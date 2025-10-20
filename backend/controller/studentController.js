import Student from "../models/student.js";
import Section from "../models/sections.js";
import Grade from "../models/grades.js";
import bcrypt from "bcryptjs";

/**
 * Register a new student
 * @route POST /api/student/register
 * @access Public
 */
export const registerStudent = async (req, res) => {
  try {
    const { email, studid, fullName, college, course, yearLevel} = req.body;

    // Validate required fields
    if (!email || !studid || !fullName || !college || !course || !yearLevel) {
      return res.status(400).json({
        success: false,
        message: "All fields are required"
      });
    }

    // Validate email domain
    if (!email.endsWith("@student.buksu.edu.ph")) {
      return res.status(400).json({
        success: false,
        message: "Invalid student email domain. Must use @student.buksu.edu.ph"
      });
    }

    // Validate year level
    const validYearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
    if (!validYearLevels.includes(yearLevel)) {
      return res.status(400).json({
        success: false,
        message: "Invalid year level. Must be one of: " + validYearLevels.join(", ")
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: "Student with this email already exists"
      });
    }

    // Hash password
    // const saltRounds = 12;
    // const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create temporary googleId (will be updated when they first login with Google)
    const tempGoogleId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create new student
    const newStudent = new Student({
      googleId: tempGoogleId,
      studid,
      email,
      fullName: fullName.trim(),
      college,
      course,
      yearLevel,
// Add password field to model if not exists
      status: "Approved" // Automatically approved
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: "Student registration successful. Your account has been automatically approved.",
      student: {
        id: newStudent._id,
        email: newStudent.email,
        fullName: newStudent.fullName,
        college: newStudent.college,
        course: newStudent.course,
        yearLevel: newStudent.yearLevel,
        status: newStudent.status
      }
    });

  } catch (error) {
    console.error("Student registration error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Student with this email already exists"
      });
    }

    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get student profile
 * @route GET /api/student/profile
 * @access Private (Student only)
 */
export const getStudentProfile = async (req, res) => {
  try {
    const studentInfo = req.student;
    
    // Fetch full student details from database
    const student = await Student.findById(studentInfo.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        college: student.college,
        course: student.course,
        yearLevel: student.yearLevel,
        status: student.status,
        role: student.role,
        createdAt: student.createdAt
      }
    });
  } catch (error) {
    console.error("Get student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Update student profile
 * @route PUT /api/student/profile
 * @access Private (Student only)
 */
export const updateStudentProfile = async (req, res) => {
  try {
    const studentId = req.student.id;
    const { fullName, college, course, yearLevel } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (college) updateData.college = college;
    if (course) updateData.course = course;
    if (yearLevel) {
      const validYearLevels = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
      if (!validYearLevels.includes(yearLevel)) {
        return res.status(400).json({
          success: false,
          message: "Invalid year level. Must be one of: " + validYearLevels.join(", ")
        });
      }
      updateData.yearLevel = yearLevel;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update"
      });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      studentId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      student: {
        id: updatedStudent._id,
        email: updatedStudent.email,
        fullName: updatedStudent.fullName,
        college: updatedStudent.college,
        course: updatedStudent.course,
        yearLevel: updatedStudent.yearLevel,
        status: updatedStudent.status
      }
    });

  } catch (error) {
    console.error("Update student profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get all students (Admin only)
 * @route GET /api/student/all
 * @access Private (Admin only)
 */
export const getAllStudents = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    // Build filter object
    const filter = {};
    if (status) filter.status = status;

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Get students with pagination
    const students = await Student.find(filter)
      .select('-password -googleId') // Exclude sensitive fields
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalStudents = await Student.countDocuments(filter);
    const totalPages = Math.ceil(totalStudents / limit);

    res.json({
      success: true,
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalStudents,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error("Get all students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Update student status (Admin only)
 * @route PUT /api/student/:id/status
 * @access Private (Admin only)
 */
export const updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, statusReason } = req.body;
    const adminId = req.admin.id;

    // Validate status
    const validStatuses = ["Pending", "Approved", "Rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be one of: " + validStatuses.join(", ")
      });
    }

    // If rejecting, reason is required
    if (status === "Rejected" && !statusReason) {
      return res.status(400).json({
        success: false,
        message: "Status reason is required when rejecting a student"
      });
    }

    const updateData = {
      status,
      statusUpdatedAt: new Date(),
      statusUpdatedBy: adminId
    };

    if (statusReason) {
      updateData.statusReason = statusReason;
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -googleId');

    if (!updatedStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found"
      });
    }

    res.json({
      success: true,
      message: `Student status updated to ${status}`,
      student: updatedStudent
    });

  } catch (error) {
    console.error("Update student status error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Get student's enrolled sections
 * @route GET /api/student/sections
 * @access Private (Student only)
 */
export const getStudentSections = async (req, res) => {
  try {
    const studentId = req.student.id;
    const { schoolYear, term } = req.query;

    const query = { students: studentId };
    if (schoolYear) query.schoolYear = schoolYear;
    if (term) query.term = term;

    const sections = await Section.find(query)
      .populate("subject", "subjectCode subjectName units college department")
      .populate("instructor", "fullName email college department")
      .sort({ schoolYear: -1, term: 1, sectionName: 1 });

    res.json({ success: true, sections });
  } catch (err) {
    console.error("getStudentSections:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get student's grades
 * @route GET /api/student/grades
 * @access Private (Student only)
 */
export const getStudentGrades = async (req, res) => {
  try {
    const studentId = req.student.id;
    const { schoolYear, term, sectionId } = req.query;

    // Build query to find sections where student is enrolled
    const sectionQuery = { students: studentId };
    if (schoolYear) sectionQuery.schoolYear = schoolYear;
    if (term) sectionQuery.term = term;
    if (sectionId) sectionQuery._id = sectionId;

    const sections = await Section.find(sectionQuery)
      .populate("subject", "subjectCode subjectName units")
      .populate("instructor", "fullName");

    // Get grades for these sections
    const sectionIds = sections.map(section => section._id);
    const grades = await Grade.find({ 
      student: studentId, 
      section: { $in: sectionIds } 
    })
      .populate({
        path: "section",
        populate: {
          path: "subject",
          select: "subjectCode subjectName units"
        }
      })
      .populate({
        path: "section",
        populate: {
          path: "instructor", 
          select: "fullName"
        }
      });

    // Combine section info with grades
    const gradesWithSections = sections.map(section => {
      const grade = grades.find(g => g.section._id.toString() === section._id.toString());
      return {
        section: {
          _id: section._id,
          sectionName: section.sectionName,
          schoolYear: section.schoolYear,
          term: section.term,
          subject: section.subject,
          instructor: section.instructor,
          gradingSchema: section.gradingSchema
        },
        grade: grade ? {
          classStanding: grade.classStanding,
          laboratory: grade.laboratory,
          majorOutput: grade.majorOutput,
          finalGrade: grade.finalGrade,
          remarks: grade.remarks,
          updatedAt: grade.updatedAt
        } : null
      };
    });

    res.json({ success: true, grades: gradesWithSections });
  } catch (err) {
    console.error("getStudentGrades:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Get available subjects for enrollment
 * @route GET /api/student/subjects/available
 * @access Private (Student only)  
 */
export const getAvailableSubjects = async (req, res) => {
  try {
    const studentId = req.student.id;
    const { schoolYear, term } = req.query;

    // Get student info
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    // Find sections that match student's college and are available for enrollment
    const query = { 
      schoolYear: schoolYear || new Date().getFullYear().toString() + "-" + (new Date().getFullYear() + 1).toString(),
      term: term || "1st"
    };

    const sections = await Section.find(query)
      .populate({
        path: "subject",
        match: { college: student.college }, // Only subjects from student's college
        select: "subjectCode subjectName units college department"
      })
      .populate("instructor", "fullName email")
      .populate("students", "fullName studid");

    // Filter out sections where subject is null (didn't match college) and where student is already enrolled
    const availableSections = sections.filter(section => 
      section.subject && 
      !section.students.some(s => s._id.toString() === studentId.toString())
    );

    res.json({ success: true, sections: availableSections });
  } catch (err) {
    console.error("getAvailableSubjects:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * Search students by studid or email
 * @route GET /api/student/search
 * @access Private (Instructor only)
 */
export const searchStudents = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.json({
        success: true,
        students: []
      });
    }

    const searchTerm = query.trim();

    // Search by studid or email using regex for partial matches
    const searchQuery = {
      $and: [
        { status: "Approved" }, // Only search approved students
        {
          $or: [
            { studid: { $regex: searchTerm, $options: "i" } },
            { email: { $regex: searchTerm, $options: "i" } },
            { fullName: { $regex: searchTerm, $options: "i" } }
          ]
        }
      ]
    };

    const students = await Student.find(searchQuery)
      .select("studid email fullName college course yearLevel")
      .limit(20) // Limit results to prevent overwhelming response
      .sort({ fullName: 1 });

    res.json({
      success: true,
      students
    });

  } catch (error) {
    console.error("Search students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};