import Admin from "../models/admin.js";
import Instructor from "../models/instructor.js";
import Student from "../models/student.js";
import Semester from "../models/semester.js";
import Subject from "../models/subjects.js";
import jwt from "jsonwebtoken";
import emailService from "../services/emailService.js";
import {
  handleFailedLogin,
  handleSuccessfulLogin,
} from "../middleware/bruteForceProtection.js";

// Generate JWT token
const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find admin by email
    const admin = await Admin.findByEmail(email);
    if (!admin) {
      // Record failed attempt for non-existent admin
      await handleFailedLogin(email, req.inferredUserType || "admin").catch(
        () => {}
      );
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Please try again.",
      });
    }

    // Production lock (2 hours) - commented for development
    if (admin.isLocked()) {
      const timeUntilUnlock = admin.accountLockedUntil - Date.now();
      const hoursRemaining = Math.ceil(timeUntilUnlock / (60 * 60 * 1000));
      const minutesRemaining = Math.ceil(timeUntilUnlock / (60 * 1000));

      let timeMessage;
      if (hoursRemaining >= 1) {
        timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''}`;
      } else {
        timeMessage = `${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''}`;
      }

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
        locked: true,
        timeUntilUnlock: admin.accountLockedUntil,
        failedAttempts: admin.failedLoginAttempts
      });
    }

    
    // Check if account is active
    if (admin.status !== "Active") {
      // Record failed attempt for inactive account
      await handleFailedLogin(email, req.inferredUserType || "admin").catch(
        () => {}
      );
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      });
    }

    // Verify password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      const result = await handleFailedLogin(
        email,
        req.inferredUserType || "admin"
      ).catch(() => ({}));
      let message = "Invalid credentials. Please try again.";

      if (
        result.remainingAttempts !== undefined &&
        result.remainingAttempts > 0
      ) {
        message += ` ${result.remainingAttempts} attempt${
          result.remainingAttempts > 1 ? "s" : ""
        } remaining.`;
      } else if (result.locked) {
        message =
          "Account has been temporarily locked due to too many failed login attempts.";
      }

      return res.status(401).json({
        success: false,
        message,
        remainingAttempts: result.remainingAttempts,
        locked: result.locked,
      });
    }

    // Successful login - reset any failed attempts
    await handleSuccessfulLogin(email, req.inferredUserType || "admin").catch(
      () => {}
    );

    // Generate tokens
    const accessToken = generateToken(
      {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES_IN || "1d"
    );

    const refreshToken = generateToken(
      { adminId: admin._id },
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRES_IN || "7d"
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Invite instructor
export const inviteInstructor = async (req, res) => {
  try {
    const { instructorid, email, fullName, college, department } = req.body;
    const adminId = req.admin.id; // From auth middleware

    // Validate input
    if (!instructorid || !email || !fullName || !college || !department) {
      return res.status(400).json({
        success: false,
        message:
          "All fields are required: instructorid, email, fullName, college, department",
      });
    }

    // Validate email domain
    if (!email.endsWith("@gmail.com")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email domain. Must be @buksu.edu.ph",
      });
    }

    // Check if instructor already exists
    const existingInstructor = await Instructor.findOne({
      $or: [{ email }, { instructorid }],
    });
    if (existingInstructor) {
      return res.status(409).json({
        success: false,
        message: "Instructor with this email or ID already exists",
      });
    }

    // Get admin info for invitation
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Create instructor record
    const instructor = new Instructor({
      instructorid,
      email,
      fullName,
      college,
      department,
      status: "Active", // Automatically approved when invited by admin
      invitedBy: admin.email,
    });

    await instructor.save();

    // Send notification email (no longer need invitation token)
    const emailResult = await emailService.sendInstructorInvitation(
      email,
      null, // No token needed since auto-approved
      admin.fullName
    );

    if (!emailResult.success) {
      // If email fails, we might want to delete the instructor record
      await Instructor.findByIdAndDelete(instructor._id);
      return res.status(500).json({
        success: false,
        message: "Failed to send invitation email",
      });
    }

    res.status(201).json({
      success: true,
      message: "Instructor invited and automatically approved successfully",
      instructor: {
        id: instructor._id,
        email: instructor.email,
        fullName: instructor.fullName,
        college: instructor.college,
        department: instructor.department,
        status: instructor.status,
        invitedBy: instructor.invitedBy,
        createdAt: instructor.createdAt,
      },
    });
  } catch (error) {
    console.error("Invite instructor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all instructors
export const getAllInstructors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, college, department } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (college) filter.college = college;
    if (department) filter.department = department;

    // Get instructors with pagination
    const instructors = await Instructor.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-googleId");

    const total = await Instructor.countDocuments(filter);

    res.status(200).json({
      success: true,
      instructors,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalInstructors: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get instructors error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all students (for approval/rejection)
export const getAllStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      college,
      course,
      yearLevel,
      search,
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (college) filter.college = college;
    if (course) filter.course = course;
    if (yearLevel) filter.yearLevel = yearLevel;

    // Add search functionality
    if (search) {
      filter.$or = [
        { studid: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
      ];
    }

    // Get students with pagination
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-googleId");

    const total = await Student.countDocuments(filter);

    res.status(200).json({
      success: true,
      students,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete student (Admin can only delete approved students now)
export const updateStudentStatus = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { action } = req.body; // Only "delete" action is supported now

    // Validate action
    if (action !== "delete") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid action. Only 'delete' is supported. Students are automatically approved upon registration.",
      });
    }

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Delete the student
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      deletedStudent: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
      },
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete student
export const deleteStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Find student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Delete the student
    await Student.findByIdAndDelete(studentId);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
      deletedStudent: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
      },
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete instructor
export const deleteInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    // Find instructor
    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    // Delete the instructor
    await Instructor.findByIdAndDelete(instructorId);

    res.status(200).json({
      success: true,
      message: "Instructor deleted successfully",
      deletedInstructor: {
        id: instructor._id,
        email: instructor.email,
        fullName: instructor.fullName,
      },
    });
  } catch (error) {
    console.error("Delete instructor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get admin dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    // Get counts
    const totalStudents = await Student.countDocuments();
    const approvedStudents = await Student.countDocuments({
      status: "Approved",
    });
    // No more pending students since they are automatically approved
    const pendingStudents = 0;
    const rejectedStudents = 0; // Not tracking rejected students anymore

    const totalInstructors = await Instructor.countDocuments();
    const activeInstructors = await Instructor.countDocuments({
      status: "Active",
    });
    const invitedInstructors = 0; // No longer tracking invited since auto-approved

    // Get semester and subject counts
    const totalSemesters = await Semester.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    // Get recent activities (last 10 students and instructors)
    const recentStudents = await Student.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status createdAt");

    const recentInstructors = await Instructor.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status createdAt");

    res.status(200).json({
      success: true,
      stats: {
        students: {
          total: totalStudents,
          pending: pendingStudents,
          approved: approvedStudents,
          rejected: rejectedStudents,
        },
        instructors: {
          total: totalInstructors,
          active: activeInstructors,
          invited: invitedInstructors,
        },
        semesters: {
          total: totalSemesters,
        },
        subjects: {
          total: totalSubjects,
        },
      },
      recentActivities: {
        students: recentStudents,
        instructors: recentInstructors,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get admin profile
export const getAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.status(200).json({
      success: true,
      admin: {
        id: admin._id,
        email: admin.email,
        fullName: admin.fullName,
        firstName: admin.firstName,
        lastName: admin.lastName,
        role: admin.role,
        status: admin.status,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.header("Authorization")?.replace("Bearer ", "");

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: "No refresh token provided",
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find admin
    const admin = await Admin.findById(decoded.adminId);
    if (!admin || admin.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Generate new access token
    const accessToken = generateToken(
      {
        adminId: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES_IN || "15m"
    );

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      accessToken,
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

// Change admin password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    // Find admin
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    admin.password = newPassword;
    await admin.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
