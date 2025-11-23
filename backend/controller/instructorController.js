// controllers/instructorController.js
import Instructor from "../models/instructor.js";
import Section from "../models/sections.js";
import Student from "../models/student.js";
import Grade from "../models/grades.js";
import Subject from "../models/subjects.js";
import Activity from "../models/activity.js";
import emailService from "../services/emailService.js";
import { bulkDecryptUserData } from "./decryptionController.js";

// Update grading schema for instructor's section
export const updateSectionGradingSchema = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { gradingSchema } = req.body;
    const instructorId = req.instructor.id;

    // Validate grading schema
    if (!gradingSchema || typeof gradingSchema !== 'object') {
      return res.status(400).json({ message: "Invalid grading schema" });
    }

    const { classStanding, laboratory, majorOutput } = gradingSchema;
    const total = (classStanding || 0) + (laboratory || 0) + (majorOutput || 0);
    
    if (total !== 100) {
      return res.status(400).json({ 
        message: "Grading schema percentages must total 100%" 
      });
    }

    // Find section and verify instructor ownership
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId,
      isArchived: { $ne: true }
    });
    
    if (!section) {
      return res.status(404).json({ 
        message: "Section not found or you don't have permission to edit it" 
      });
    }

    // Check if grading schema is actually changing
    const gradingSchemaChanged = JSON.stringify(gradingSchema) !== JSON.stringify(section.gradingSchema);

    // Update the section
    const updatedSection = await Section.findByIdAndUpdate(
      sectionId,
      { gradingSchema },
      { new: true, runValidators: true }
    ).populate("instructor", "fullName email college department")
     .populate("subject", "subjectCode subjectName units college department");

    // If grading schema was changed, recalculate all grades in the section
    if (gradingSchemaChanged && updatedSection.students.length > 0) {
      // Import the function from gradeUtils if available
      try {
        const { calculateAndUpdateAllGradesInSection } = await import('../utils/gradeUtils.js');
        calculateAndUpdateAllGradesInSection(sectionId, instructorId)
          .then(results => {
            console.log(`[instructorController] Grades recalculated for ${results.successful.length} students after grading schema change`);
            if (results.failed.length > 0) {
              console.error(`[instructorController] Failed to recalculate grades for ${results.failed.length} students:`, results.failed);
            }
          })
          .catch(err => {
            console.error('[instructorController] Error recalculating grades after schema change:', err);
          });
      } catch (importErr) {
        console.log('[instructorController] Grade recalculation utility not available, skipping automatic recalculation');
      }
    }

    res.json({ 
      success: true, 
      section: updatedSection,
      message: "Grading schema updated successfully" + 
        (gradingSchemaChanged && updatedSection.students.length > 0 ? 
         " and grades are being recalculated" : "")
    });
  } catch (err) {
    console.error("updateSectionGradingSchema:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorDashboardStats = async (req, res) => {
  try {
    const instructorId = req.instructor.id;

    // Get all sections for this instructor (excluding archived sections)
    const sections = await Section.find({ 
      instructor: instructorId,
      isArchived: { $ne: true }
    })
    .populate('students')
    .populate('subject', 'isArchived');

    // Filter out sections with archived subjects
    const activeSections = sections.filter(section => 
      section.subject && !section.subject.isArchived
    );

    // Get total sections count
    const totalSections = activeSections.length;

    // Get total students across all active sections
    const totalStudents = activeSections.reduce((count, section) => count + section.students.length, 0);

    // Get unique subjects taught (excluding archived subjects)
    const uniqueSubjects = new Set(activeSections.map(section => section.subject?._id?.toString()).filter(Boolean));
    const totalSubjects = uniqueSubjects.size;

    // Get pending grades (sections without completed grading, excluding archived)
    const pendingGrades = activeSections.length;

    res.json({
      success: true,
      stats: {
        totalSections,
        totalStudents,
        totalSubjects,
        pendingGrades
      }
    });
  } catch (err) {
    console.error("getInstructorDashboardStats:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorProfile = async (req, res) => {
  try {
    const instructor = await Instructor.findById(req.instructor.id).select("-googleId");
    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }
    res.json({ success: true, instructor });
  } catch (err) {
    console.error("getInstructorProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateInstructorProfile = async (req, res) => {
  try {
    const { fullName, college, department } = req.body;
    const instructorId = req.instructor.id;

    const instructor = await Instructor.findByIdAndUpdate(
      instructorId,
      { fullName, college, department },
      { new: true, runValidators: true }
    ).select("-googleId");

    if (!instructor) {
      return res.status(404).json({ message: "Instructor not found" });
    }

    res.json({ success: true, instructor });
  } catch (err) {
    console.error("updateInstructorProfile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorSections = async (req, res) => {
  try {
    const instructorId = req.instructor.id;
    const { schoolYear, term, includeArchived = false } = req.query;

    const query = { instructor: instructorId };
    if (schoolYear) query.schoolYear = schoolYear;
    if (term) query.term = term;
    
    // Include archived sections only if explicitly requested
    if (includeArchived !== 'true') {
      query.isArchived = { $ne: true };
    }

    const sections = await Section.find(query)
      .populate("subject", "subjectCode subjectName units college department isArchived")
      .populate("students", "fullName studid email yearLevel")
      .sort({ schoolYear: -1, term: 1, sectionName: 1 });

    // Filter out sections with archived subjects unless explicitly requested
    let filteredSections = sections;
    if (includeArchived !== 'true') {
      filteredSections = sections.filter(section => 
        section.subject && !section.subject.isArchived
      );
    }

    // Decrypt student data in each section
    const decryptedSections = filteredSections.map(section => {
      const sectionObj = section.toObject();
      if (sectionObj.students && sectionObj.students.length > 0) {
        sectionObj.students = bulkDecryptUserData(sectionObj.students, 'student');
      }
      return sectionObj;
    });

    res.json({ success: true, sections: decryptedSections });
  } catch (err) {
    console.error("getInstructorSections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentsInSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const instructorId = req.instructor.id;

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    })
      .populate("subject", "subjectCode subjectName")
      .populate("students", "fullName studid email yearLevel college course");

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    // Get grades for students in this section
    const grades = await Grade.find({ section: sectionId })
      .populate("student", "fullName studid");

    // Decrypt student data
    const decryptedStudents = bulkDecryptUserData(
      section.students.map(s => s.toObject()),
      'student'
    );

    // Combine student info with their grades
    const studentsWithGrades = decryptedStudents.map(student => {
      const grade = grades.find(g => g.student._id.toString() === student._id.toString());
      return {
        ...student,
        grade: grade || null
      };
    });

    res.json({ 
      success: true, 
      section: {
        _id: section._id,
        sectionName: section.sectionName,
        schoolYear: section.schoolYear,
        term: section.term,
        subject: section.subject,
        gradingSchema: section.gradingSchema
      },
      students: studentsWithGrades 
    });
  } catch (err) {
    console.error("getStudentsInSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const enrollStudentToSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { studentId } = req.body;
    const instructorId = req.instructor.id;

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    });

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    // Verify student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student is already enrolled
    if (section.students.includes(studentId)) {
      return res.status(400).json({ message: "Student already enrolled in this section" });
    }

    // Add student to section
    section.students.push(studentId);
    await section.save();

    res.json({ 
      success: true, 
      message: "Student enrolled successfully",
      section: await section.populate("students", "fullName studid email")
    });
  } catch (err) {
    console.error("enrollStudentToSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const removeStudentFromSection = async (req, res) => {
  try {
    const { sectionId, studentId } = req.params;
    const instructorId = req.instructor.id;

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    });

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    // Remove student from section
    section.students = section.students.filter(
      id => id.toString() !== studentId
    );
    await section.save();

    // Optionally remove grades for this student in this section
    await Grade.deleteOne({ student: studentId, section: sectionId });

    res.json({ 
      success: true, 
      message: "Student removed from section successfully"
    });
  } catch (err) {
    console.error("removeStudentFromSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAvailableStudents = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const instructorId = req.instructor.id;

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    });

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    // Get all students not in this section
    const availableStudents = await Student.find({ 
      _id: { $nin: section.students },
      status: "Approved" // Only approved students
    }).select("fullName studid email yearLevel college course");

    res.json({ 
      success: true, 
      students: availableStudents 
    });
  } catch (err) {
    console.error("getAvailableStudents:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const inviteStudentsToSection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const { studentIds } = req.body;
    const instructorId = req.instructor.id;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Student IDs array is required" });
    }

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    })
      .populate("subject", "subjectCode subjectName")
      .populate("instructor", "fullName");

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    // Get students to invite
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(404).json({ message: "Some students not found" });
    }

    // Filter out already enrolled students
    const newStudents = students.filter(student => 
      !section.students.includes(student._id)
    );

    if (newStudents.length === 0) {
      return res.status(400).json({ message: "All selected students are already enrolled" });
    }

    // Add new students to section
    const newStudentIds = newStudents.map(student => student._id);
    section.students.push(...newStudentIds);
    await section.save();

    // Decrypt student data before sending emails
    // Convert Mongoose documents to plain objects first
    const plainStudents = newStudents.map(s => s.toObject());
    const decryptedStudents = bulkDecryptUserData(plainStudents, 'student');
    console.log('📧 Sending emails to students:', decryptedStudents.map(s => s.email));

    // Send invitation emails to new students
    const emailPromises = decryptedStudents.map(async (student) => {
      const sectionDetails = {
        subjectCode: section.subject.subjectCode,
        subjectName: section.subject.subjectName,
        sectionName: section.sectionName,
        schoolYear: section.schoolYear,
        term: section.term
      };

      try {
        await emailService.sendSectionInvitation(
          student.email,
          student.fullName,
          sectionDetails,
          section.instructor.fullName
        );
      } catch (emailError) {
        console.error(`Failed to send invitation to ${student.email}:`, emailError);
      }
    });

    await Promise.allSettled(emailPromises);

    res.json({ 
      success: true, 
      message: `${newStudents.length} students invited to section successfully`,
      invitedStudents: newStudents.map(s => ({ id: s._id, name: s.fullName, email: s.email }))
    });
  } catch (err) {
    console.error("inviteStudentsToSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const createActivity = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { title, description, instructions, category, maxScore, dueDate, sectionId } = req.body;
    const instructorId = req.instructor.id;

    // Verify instructor is assigned to this subject
    const subject = await Subject.findOne({ 
      _id: subjectId, 
      assignedInstructor: instructorId 
    }).populate("semester");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found or not assigned to you" });
    }

    // If sectionId is provided, verify instructor owns the section
    if (sectionId) {
      const section = await Section.findOne({
        _id: sectionId,
        instructor: instructorId,
        subject: subjectId
      });
      
      if (!section) {
        return res.status(404).json({ message: "Section not found or unauthorized" });
      }
    }

    // Create the activity with default values for missing fields
    const activity = new Activity({
      title,
      description: description || "",
      instructions: instructions || "",
      category,
      maxScore: parseInt(maxScore) || 100, // Default to 100 if not provided
      dueDate: dueDate ? new Date(dueDate) : undefined,
      subject: subjectId,
      instructor: instructorId,
      semester: subject.semester._id,
      schoolYear: subject.semester.schoolYear,
      term: subject.semester.term
    });

    await activity.save();

    const populatedActivity = await Activity.findById(activity._id)
      .populate("subject", "subjectCode subjectName")
      .populate("instructor", "fullName");

    res.json({ 
      success: true, 
      message: "Activity created successfully",
      activity: populatedActivity
    });
  } catch (err) {
    console.error("createActivity:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getActivitiesBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const instructorId = req.instructor.id;

    // Verify instructor is assigned to this subject
    const subject = await Subject.findOne({ 
      _id: subjectId, 
      assignedInstructor: instructorId 
    });

    if (!subject) {
      return res.status(404).json({ message: "Subject not found or not assigned to you" });
    }

    const activities = await Activity.find({ 
      subject: subjectId,
      instructor: instructorId,
      isActive: true
    })
      .populate("subject", "subjectCode subjectName")
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      activities
    });
  } catch (err) {
    console.error("getActivitiesBySubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getActivitiesBySection = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const instructorId = req.instructor.id;

    // Verify instructor owns this section
    const section = await Section.findOne({ 
      _id: sectionId, 
      instructor: instructorId 
    }).populate('subject');

    if (!section) {
      return res.status(404).json({ message: "Section not found or unauthorized" });
    }

    const activities = await Activity.find({ 
      subject: section.subject._id,
      instructor: instructorId,
      isActive: true
    })
      .populate("subject", "subjectCode subjectName")
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      activities,
      section: {
        _id: section._id,
        sectionName: section.sectionName,
        subject: section.subject
      }
    });
  } catch (err) {
    console.error("getActivitiesBySection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, students: [] });
    }

    const searchTerm = q.trim().toLowerCase();
    
    // Since data is encrypted, we need to fetch all approved students and filter after decryption
    const students = await Student.find({ status: "Approved" })
      .select("fullName studid email yearLevel college course")
      .lean();

    // Decrypt all students
    const decryptedStudents = await bulkDecryptUserData(students, 'student');

    // Filter decrypted students based on search term
    const filteredStudents = decryptedStudents.filter(student => {
      const fullName = student.fullName || '';
      const studid = student.studid || '';
      const email = student.email || '';
      
      return (
        fullName.toLowerCase().includes(searchTerm) ||
        studid.toLowerCase().includes(searchTerm) ||
        email.toLowerCase().includes(searchTerm)
      );
    }).slice(0, 20); // Limit to 20 results

    // Transform the data to match frontend expectations
    const transformedStudents = filteredStudents.map(student => ({
      _id: student._id,
      first_name: student.fullName ? student.fullName.split(' ')[0] : '',
      last_name: student.fullName ? student.fullName.split(' ').slice(1).join(' ') : '',
      student_id: student.studid,
      email: student.email,
      yearLevel: student.yearLevel,
      college: student.college,
      course: student.course
    }));

    res.json({ 
      success: true, 
      students: transformedStudents 
    });
  } catch (err) {
    console.error("searchStudents:", err);
    res.status(500).json({ message: "Server error" });
  }
};
