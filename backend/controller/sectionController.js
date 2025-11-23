// controllers/sectionController.js
import Section from "../models/sections.js";
import Subject from "../models/subjects.js";
import Instructor from "../models/instructor.js";
import Student from "../models/student.js";
import Activity from "../models/activity.js";
import emailService from "../services/emailService.js";
import { calculateAndUpdateAllGradesInSection } from "../utils/gradeCalculator.js";
import { bulkDecryptUserData, decryptInstructorData } from "./decryptionController.js";

export const createSection = async (req, res) => {
  try {
    const { subjectId, instructorId, sectionName, schoolYear, term, gradingSchema } = req.body;
    
    console.log('Creating section with data:', { subjectId, instructorId, sectionName, schoolYear, term });
    
    // For admin requests, instructorId is provided in the body
    // For instructor requests, use the authenticated user's ID
    const finalInstructorId = instructorId || req.user.user._id;

    if (!subjectId || !sectionName || !schoolYear || !term) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // If this is an instructor request (no instructorId provided), verify subject assignment
    if (!instructorId && req.user.user._id) {
      if (subject.assignedInstructor.toString() !== req.user.user._id.toString()) {
        return res.status(403).json({ message: "You can only create sections for subjects assigned to you" });
      }
    }

    const instructor = await Instructor.findById(finalInstructorId);
    if (!instructor) return res.status(404).json({ message: "Instructor not found" });

    // Check uniqueness: same subject+instructor+sectionName in same sy/term
    const existing = await Section.findOne({ 
      subject: subjectId, 
      instructor: finalInstructorId, 
      schoolYear, 
      term,
      sectionName: sectionName
    });
    if (existing) {
      return res.status(400).json({ 
        message: "A section with this name already exists for this subject and instructor in this term" 
      });
    }

    const section = await Section.create({
      subject: subjectId,
      instructor: finalInstructorId,
      sectionName,
      schoolYear,
      term,
      gradingSchema: gradingSchema || {
        classStanding: 30,
        laboratory: 30,
        majorOutput: 40
      },
    });

    console.log('Section created successfully:', section._id);

    const populatedSection = await Section.findById(section._id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department");

    // Send email notification to the assigned instructor
    try {
      const sectionDetails = {
        subjectCode: populatedSection.subject.subjectCode,
        subjectName: populatedSection.subject.subjectName,
        sectionName: populatedSection.sectionName,
        schoolYear: populatedSection.schoolYear,
        term: populatedSection.term,
        units: populatedSection.subject.units,
        college: populatedSection.subject.college,
        department: populatedSection.subject.department
      };

      // Determine who created the section (admin or self-assignment)
      const createdBy = instructorId ? "Admin" : "Self-assigned";
      
      await emailService.sendSectionAssignmentNotification(
        populatedSection.instructor.email,
        populatedSection.instructor.fullName,
        sectionDetails,
        createdBy
      );
      
      console.log(`📧 Section assignment email sent to ${populatedSection.instructor.email}`);
    } catch (emailError) {
      console.error("❌ Error sending section assignment email:", emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({ success: true, section: populatedSection });
  } catch (err) {
    console.error("createSection Error Details:");
    console.error("Error message:", err.message);
    console.error("Error stack:", err.stack);
    console.error("Error code:", err.code);
    console.error("Full error:", err);
    
    if (err.code === 11000) {
      return res.status(400).json({ 
        message: "A section with these details already exists. Please use different section details." 
      });
    }
    
    res.status(500).json({ 
      message: "Server error", 
      error: err.message,
      details: err.code ? `Error code: ${err.code}` : undefined
    });
  }
};

export const getAllSections = async (req, res) => {
  try {
    const { includeArchived = false } = req.query;
    
    const filter = {};
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const sections = await Section.find(filter)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, sections });
  } catch (err) {
    console.error("getAllSections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getInstructorSections = async (req, res) => {
  try {
    // Handle both old and new auth middleware patterns
    const instructorId = req.instructor?.id || req.user?.user?._id || req.user?._id;
    const { includeArchived = false } = req.query;
    
    if (!instructorId) {
      return res.status(401).json({ 
        success: false, 
        message: "Instructor authentication required" 
      });
    }
    
    const filter = { instructor: instructorId };
    if (includeArchived !== 'true') {
      filter.isArchived = { $ne: true };
    }
    
    const sections = await Section.find(filter)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department")
      .sort({ createdAt: -1 });
    
    res.json({ success: true, sections });
  } catch (err) {
    console.error("getInstructorSections:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const section = await Section.findById(id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department")
      .populate("students", "studid fullName email yearLevel course");
    
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }
    
    // Decrypt student and instructor data
    const sectionObj = section.toObject();
    
    if (sectionObj.students && sectionObj.students.length > 0) {
      sectionObj.students = bulkDecryptUserData(sectionObj.students, 'student');
    }
    
    if (sectionObj.instructor) {
      sectionObj.instructor = decryptInstructorData(sectionObj.instructor);
    }
    
    res.json({ success: true, section: sectionObj });
  } catch (err) {
    console.error("getSectionById:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSubjectsWithMultipleInstructors = async (req, res) => {
  try {
    // Aggregate sections to show subjects with multiple instructors
    const subjectsWithInstructors = await Section.aggregate([
      {
        $group: {
          _id: "$subject",
          instructors: { $addToSet: "$instructor" },
          sections: { $push: "$$ROOT" },
          instructorCount: { $addToSet: "$instructor" }
        }
      },
      {
        $addFields: {
          instructorCount: { $size: "$instructorCount" }
        }
      },
      {
        $lookup: {
          from: "subjects",
          localField: "_id",
          foreignField: "_id",
          as: "subjectDetails"
        }
      },
      {
        $lookup: {
          from: "instructors",
          localField: "instructors",
          foreignField: "_id",
          as: "instructorDetails"
        }
      },
      {
        $sort: { instructorCount: -1, "_id": 1 }
      }
    ]);

    res.json({ success: true, subjects: subjectsWithInstructors });
  } catch (err) {
    console.error("getSubjectsWithMultipleInstructors:", err);
    res.status(500).json({ message: "Server error" });
    }
};

export const updateSection = async (req, res) => {
  try {
    const { id } = req.params;
    const { subjectId, instructorId, sectionName, schoolYear, term, gradingSchema } = req.body;

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    // Check if this is an admin request (has instructorId) or instructor request
    const isAdminRequest = !!instructorId;
    const finalInstructorId = instructorId || req.user.user._id;

    // If instructor request, verify ownership
    if (!isAdminRequest && section.instructor.toString() !== req.user.user._id.toString()) {
      return res.status(403).json({ message: "You can only edit your own sections" });
    }

    if (subjectId) {
      const subject = await Subject.findById(subjectId);
      if (!subject) return res.status(404).json({ message: "Subject not found" });
      
      // For instructor requests, verify subject assignment
      if (!isAdminRequest && subject.assignedInstructor.toString() !== req.user.user._id.toString()) {
        return res.status(403).json({ message: "You can only assign subjects that are assigned to you" });
      }
    }

    // If instructor is being changed (admin only), verify the new instructor exists
    if (instructorId) {
      const instructor = await Instructor.findById(instructorId);
      if (!instructor) return res.status(404).json({ message: "Instructor not found" });
    }

    // Check uniqueness if changing key fields
    if (subjectId || sectionName || schoolYear || term) {
      const existing = await Section.findOne({ 
        subject: subjectId || section.subject, 
        instructor: finalInstructorId,
        schoolYear: schoolYear || section.schoolYear, 
        term: term || section.term,
        sectionName: sectionName || section.sectionName,
        _id: { $ne: id }
      });
      if (existing) {
        return res.status(400).json({ 
          message: "A section with this name already exists for this subject and instructor in this term" 
        });
      }
    }

    // Check if grading schema is being updated
    const gradingSchemaChanged = gradingSchema && JSON.stringify(gradingSchema) !== JSON.stringify(section.gradingSchema);
    
    // Check if school year changed
    const schoolYearChanged = schoolYear && schoolYear !== section.schoolYear;
    const oldSchoolYear = section.schoolYear;

    const updatedSection = await Section.findByIdAndUpdate(
      id,
      {
        ...(subjectId && { subject: subjectId }),
        ...(instructorId && { instructor: instructorId }), // Admin can change instructor
        ...(sectionName && { sectionName }),
        ...(schoolYear && { schoolYear }),
        ...(term && { term }),
        ...(gradingSchema && { gradingSchema }),
      },
      { new: true, runValidators: true }
    ).populate("instructor", "fullName email college department")
     .populate("subject", "subjectCode subjectName units college department");

    // If school year changed, update activities for THIS SECTION ONLY
    // We do this by finding activities that were created for this section's schedule
    if (schoolYearChanged) {
      // Find all schedules for this section
      const Schedule = (await import("../models/schedule.js")).default;
      const schedules = await Schedule.find({ section: id });
      const scheduleIds = schedules.map(s => s._id);
      
      if (scheduleIds.length > 0) {
        // Update activities tied to this section's schedules
        const updateResult = await Activity.updateMany(
          {
            schedule: { $in: scheduleIds },
            schoolYear: oldSchoolYear
          },
          {
            $set: { schoolYear: schoolYear }
          }
        );
        
        console.log(`[sectionController] Updated ${updateResult.modifiedCount} activities from ${oldSchoolYear} to ${schoolYear} for section ${updatedSection.sectionName}`);
      }
    }

    // If grading schema was changed, recalculate all grades in the section
    if (gradingSchemaChanged && updatedSection.students.length > 0) {
      calculateAndUpdateAllGradesInSection(id, finalInstructorId)
        .then(results => {
          console.log(`[sectionController] Grades recalculated for ${results.successful.length} students after grading schema change`);
          if (results.failed.length > 0) {
            console.error(`[sectionController] Failed to recalculate grades for ${results.failed.length} students:`, results.failed);
          }
        })
        .catch(err => {
          console.error('[sectionController] Error recalculating grades after schema change:', err);
        });
    }
    
    // If school year changed, recalculate grades for students
    if (schoolYearChanged && updatedSection.students.length > 0) {
      calculateAndUpdateAllGradesInSection(id, finalInstructorId)
        .then(results => {
          console.log(`[sectionController] Grades recalculated for ${results.successful.length} students after school year change`);
        })
        .catch(err => {
          console.error('[sectionController] Error recalculating grades:', err);
        });
    }

    res.json({ success: true, section: updatedSection });
  } catch (err) {
    console.error("updateSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const { id } = req.params;

    const section = await Section.findById(id);
    if (!section) return res.status(404).json({ message: "Section not found" });

    await Section.findByIdAndDelete(id);
    res.json({ success: true, message: "Section deleted successfully" });
  } catch (err) {
    console.error("deleteSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getSectionsBySubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const sections = await Section.find({ subject: subjectId })
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName");
    res.json(sections);
  } catch (err) {
    console.error("getSectionsBySubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get instructor assigned for a specific subject in a sy/term
export const getInstructorForSubject = async (req, res) => {
  try {
    const { subjectId } = req.params;
    const { schoolYear, term } = req.query; // optional filters
    const query = { subject: subjectId };
    if (schoolYear) query.schoolYear = schoolYear;
    if (term) query.term = term;

    const section = await Section.findOne(query)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName");

    if (!section) return res.status(404).json({ message: "No section/instructor found for this subject in the given term" });

    res.json({
      subject: section.subject,
      instructor: section.instructor,
      sectionName: section.sectionName,
      schoolYear: section.schoolYear,
      term: section.term,
    });
  } catch (err) {
    console.error("getInstructorForSubject:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Invite students to a section (Admin only)
export const inviteStudentsToSection = async (req, res) => {
  try {
    const { id } = req.params; // section ID
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: "Student IDs are required" });
    }

    const section = await Section.findById(id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department");
      
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Get student details
    const students = await Student.find({ _id: { $in: studentIds } });
    if (students.length !== studentIds.length) {
      return res.status(400).json({ message: "Some students not found" });
    }

    // Add students to the section if they're not already enrolled
    const newStudents = studentIds.filter(studentId => 
      !section.students.includes(studentId)
    );

    if (newStudents.length === 0) {
      return res.status(400).json({ message: "All selected students are already enrolled in this section" });
    }

    section.students.push(...newStudents);
    await section.save();

    // Send email invitations to newly added students
    const emailPromises = students
      .filter(student => newStudents.includes(student._id.toString()))
      .map(student => {
        const sectionDetails = {
          subjectCode: section.subject.subjectCode,
          subjectName: section.subject.subjectName,
          sectionName: section.sectionName,
          schoolYear: section.schoolYear,
          term: section.term
        };
        
        return emailService.sendSectionInvitation(
          student.email,
          `${student.firstName} ${student.lastName}`,
          sectionDetails,
          section.instructor.fullName
        );
      });

    // Send emails but don't fail the request if emails fail
    try {
      await Promise.all(emailPromises);
      console.log(`📧 Section invitation emails sent to ${newStudents.length} students`);
    } catch (emailError) {
      console.error("❌ Error sending some invitation emails:", emailError);
    }

    const updatedSection = await Section.findById(id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department")
      .populate("students", "studid firstName lastName email");

    res.json({ 
      success: true, 
      message: `Successfully added ${newStudents.length} students to the section and sent email invitations`,
      section: updatedSection,
      invitedStudents: newStudents
    });
  } catch (err) {
    console.error("inviteStudentsToSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get students in a section (Admin only)
export const getSectionStudents = async (req, res) => {
  try {
    const { id } = req.params; // section ID

    const section = await Section.findById(id)
      .populate("students", "studid fullName email yearLevel course createdAt")
      .populate("subject", "subjectCode subjectName")
      .populate("instructor", "fullName email");
      
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Decrypt student data
    const decryptedStudents = bulkDecryptUserData(
      section.students.map(s => s.toObject()),
      'student'
    );

    // Decrypt instructor data
    const decryptedInstructor = section.instructor ? 
      decryptInstructorData(section.instructor.toObject()) : null;

    // Format student data with invite date
    const studentsWithInviteDate = decryptedStudents.map(student => ({
      _id: student._id,
      studid: student.studid,
      fullName: student.fullName,
      email: student.email,
      yearLevel: student.yearLevel,
      course: student.course,
      inviteDate: student.createdAt // Using createdAt as a proxy for invite date
    }));

    res.json({ 
      success: true, 
      students: studentsWithInviteDate,
      section: {
        _id: section._id,
        sectionName: section.sectionName,
        schoolYear: section.schoolYear,
        term: section.term,
        subject: section.subject,
        instructor: decryptedInstructor
      }
    });
  } catch (err) {
    console.error("getSectionStudents:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Remove student from section (Admin only)
export const removeStudentFromSection = async (req, res) => {
  try {
    const { id } = req.params; // section ID
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({ message: "Section not found" });
    }

    // Check if student is in the section
    if (!section.students.includes(studentId)) {
      return res.status(400).json({ message: "Student is not enrolled in this section" });
    }

    // Remove student from section
    section.students = section.students.filter(student => 
      student.toString() !== studentId.toString()
    );
    
    await section.save();

    // Get student details for confirmation
    const student = await Student.findById(studentId);
    const studentName = student ? student.fullName : 'Student';

    res.json({ 
      success: true, 
      message: `${studentName} has been removed from the section successfully`,
      remainingStudents: section.students.length
    });
  } catch (err) {
    console.error("removeStudentFromSection:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Archive section
export const archiveSection = async (req, res) => {
  try {
    const { id } = req.params;
    // Support both admin and instructor roles
    const userEmail = req.admin?.email || req.instructor?.email || req.user?.user?.email || req.user?.email;
    const userId = req.instructor?.id || req.user?.user?._id || req.user?._id;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // If instructor, verify they own this section
    if (userId && !req.admin) {
      if (section.instructor.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only archive your own sections",
        });
      }
    }

    if (section.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Section is already archived",
      });
    }

    section.isArchived = true;
    section.archivedAt = new Date();
    section.archivedBy = userEmail || "Unknown";
    await section.save();

    const populatedSection = await Section.findById(section._id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department");

    res.status(200).json({
      success: true,
      message: "Section archived successfully",
      section: {
        id: populatedSection._id,
        sectionName: populatedSection.sectionName,
        schoolYear: populatedSection.schoolYear,
        term: populatedSection.term,
        isArchived: populatedSection.isArchived,
        archivedAt: populatedSection.archivedAt,
        archivedBy: populatedSection.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive section error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive section
export const unarchiveSection = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.instructor?.id || req.user?.user?._id || req.user?._id;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // If instructor, verify they own this section
    if (userId && !req.admin) {
      if (section.instructor.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: "You can only unarchive your own sections",
        });
      }
    }

    if (!section.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Section is not archived",
      });
    }

    section.isArchived = false;
    section.archivedAt = null;
    section.archivedBy = null;
    await section.save();

    const populatedSection = await Section.findById(section._id)
      .populate("instructor", "fullName email college department")
      .populate("subject", "subjectCode subjectName units college department");

    res.status(200).json({
      success: true,
      message: "Section unarchived successfully",
      section: {
        id: populatedSection._id,
        sectionName: populatedSection.sectionName,
        schoolYear: populatedSection.schoolYear,
        term: populatedSection.term,
        isArchived: populatedSection.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive section error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Manually recalculate all grades in a section (Instructor only)
export const recalculateGrades = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.instructor?.id || req.user?.user?._id || req.user?._id;

    const section = await Section.findById(id);
    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Section not found",
      });
    }

    // Verify instructor owns this section
    if (section.instructor.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only recalculate grades for your own sections",
      });
    }

    if (section.students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Section has no students enrolled",
      });
    }

    // Recalculate all grades
    const results = await calculateAndUpdateAllGradesInSection(id, userId);

    res.json({
      success: true,
      message: "Grades recalculated successfully",
      results: {
        successful: results.successful.length,
        failed: results.failed.length,
        failures: results.failed.length > 0 ? results.failed : undefined
      }
    });
  } catch (error) {
    console.error("Recalculate grades error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
