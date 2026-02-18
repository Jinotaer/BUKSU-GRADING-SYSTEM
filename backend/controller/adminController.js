import Admin from "../models/admin.js";
import AdminReset from "../models/adminReset.js";
import Instructor from "../models/instructor.js";
import Student from "../models/student.js";
import Semester from "../models/semester.js";
import Subject from "../models/subjects.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import emailService from "../services/emailService.js";
import logger from "../config/logger.js";
import { logUniversalActivity } from "../middleware/universalAuditLogger.js";
import {
  handleFailedLogin,
  handleSuccessfulLogin,
} from "../middleware/bruteForceProtection.js";
import { encryptAdminData, encryptInstructorData } from "./encryptionController.js";
import { decryptAdminData, decryptInstructorData, bulkDecryptUserData } from "./decryptionController.js";
import { verifyCaptchaResponse } from "../middleware/captchaVerification.js";

/**
 * Find admin by decrypting email field
 * Since admin emails are encrypted in database, we need to decrypt and compare
 * @param {string} email - Plain text email to search for
 * @returns {Object|null} - Found admin or null
 */
const findAdminByEmail = async (email) => {
  try {
    console.log(`🔍 Searching for admin with email: "${email}"`);
    const admins = await Admin.find({});
    console.log(`📊 Found ${admins.length} total admin records in database`);
    
    // Decrypt each admin and check email match
    for (const admin of admins) {
      try {
        const decryptedAdmin = decryptAdminData(admin.toObject());
        console.log(`🔓 Decrypted admin email: "${decryptedAdmin.email}"`);
        console.log(`🔍 Comparing: "${decryptedAdmin.email.toLowerCase()}" === "${email.toLowerCase()}"`);
        console.log(`🔍 Match result: ${decryptedAdmin.email.toLowerCase() === email.toLowerCase()}`);
        
        if (decryptedAdmin.email && decryptedAdmin.email.toLowerCase() === email.toLowerCase()) {
          console.log(`✅ Found matching admin: ${admin._id}`);
          return admin; // Return the original admin with encrypted data
        }
      } catch (error) {
        console.warn(`⚠️ Failed to decrypt admin ${admin._id}:`, error.message);
        continue;
      }
    }
    
    console.log(`❌ No admin found with email: "${email}"`);
    return null;
  } catch (error) {
    console.error('💥 Error finding admin by email:', error);
    return null;
  }
};

// Generate JWT token
const generateToken = (payload, secret, expiresIn) => {
  return jwt.sign(payload, secret, { expiresIn });
};
const PASSCODE_TTL = 1000 * 60 * 15; // 15 minutes
const BCRYPT_ROUNDS = 12;

// Helper: Generate numeric 6-digit passcode
function generatePasscode(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1) + min));
}

// Request reset code
export const requestResetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    const admin = await findAdminByEmail(email);
    if (!admin) return res.json({ ok: true }); // hide existence

    // Decrypt admin data for email sending
    const decryptedAdmin = decryptAdminData(admin.toObject());

    // Remove previous reset requests
    await AdminReset.deleteMany({ adminId: admin._id });

    // Generate passcode and hash
    const passcode = generatePasscode();
    const passcodeHash = await bcrypt.hash(passcode, BCRYPT_ROUNDS);
    const expiresAt = new Date(Date.now() + PASSCODE_TTL);

    const resetRecord = await AdminReset.create({
      adminId: admin._id,
      passcodeHash,
      expiresAt,
    });

    // Send reset email via existing EmailService
    const emailResult = await emailService.sendAdminResetCode(
      decryptedAdmin.email,
      `${decryptedAdmin.firstName} ${decryptedAdmin.lastName}`,
      passcode
    );

    if (!emailResult?.success) {
      await AdminReset.deleteOne({ _id: resetRecord._id });
      return res.status(500).json({
        error: emailResult?.message || "Failed to send reset code email",
      });
    }

    return res.json({ ok: true, message: "Reset code sent to email" });
  } catch (error) {
    console.error("Error requesting reset:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// reset password using verified passcode
export const resetPassword = async (req, res) => {
  try {
    const { passcode, newPassword } = req.body;

    if (!passcode || !newPassword) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const resetRecord = await AdminReset.findOne({}).sort({ createdAt: -1 });
    if (!resetRecord) {
      return res.status(400).json({ success: false, message: "No reset request found" });
    }

    const isValid = await bcrypt.compare(passcode, resetRecord.passcodeHash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid code" });
    }

    if (resetRecord.expiresAt < new Date()) {
      await AdminReset.deleteOne({ _id: resetRecord._id });
      return res.status(400).json({ success: false, message: "Code expired" });
    }

    const admin = await Admin.findById(resetRecord.adminId);
    if (!admin) {
      await AdminReset.deleteMany({ adminId: resetRecord.adminId });
      return res.status(404).json({ success: false, message: "Admin not found" });
    }

    admin.password = newPassword;
    await admin.save();
    await AdminReset.deleteMany({ adminId: admin._id });

    return res.json({ success: true, message: "Password successfully updated" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyResetCode = async (req, res) => {
  try {
    const { passcode } = req.body;
    if (!passcode)
      return res.status(400).json({ message: "Code required" });

    const reset = await AdminReset.findOne({}).sort({ createdAt: -1 }); // latest code
    if (!reset)
      return res.status(400).json({ message: "No reset request found" });

    const isValid = await bcrypt.compare(passcode, reset.passcodeHash);
    if (!isValid)
      return res.status(400).json({ message: "Invalid code" });

    if (reset.expiresAt < new Date())
      return res.status(400).json({ message: "Code expired" });

    res.json({ ok: true, message: "Code verified successfully" });
  } catch (err) {
    console.error("Verify code error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin login
export const loginAdmin = async (req, res) => {
  try {
    console.log(`🔍 ========================================`);
    console.log(`🔍 Admin login attempt received`);
    console.log(`🔍 Request body:`, JSON.stringify(req.body));
    console.log(`🔍 ========================================`);
    
    const { email, password, captchaResponse } = req.body;

    // Validate input
    if (!email || !password) {
      console.log(`❌ Missing email or password`);
      console.log(`❌ Email present: ${!!email}, Password present: ${!!password}`);
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Verify reCAPTCHA
    if (!captchaResponse) {
      console.log(`❌ Missing CAPTCHA response`);
      return res.status(400).json({
        success: false,
        message: "Please complete the reCAPTCHA verification",
      });
    }

    console.log(`🔍 Verifying reCAPTCHA...`);
    const isCaptchaValid = await verifyCaptchaResponse(captchaResponse, req.ip);
    
    if (!isCaptchaValid) {
      console.log(`❌ CAPTCHA verification failed`);
      // Record failed attempt for invalid CAPTCHA
      await handleFailedLogin(email, req.inferredUserType || "admin").catch(
        () => {}
      );
      return res.status(400).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again.",
      });
    }
    
    console.log(`✅ CAPTCHA verification successful`);
    console.log(`🔍 Searching for admin with email: "${email}"`);

    // Find admin by encrypted email
    const admin = await findAdminByEmail(email);
    console.log(`🔍 Admin found:`, admin ? `Yes (ID: ${admin._id})` : 'No');
    
    if (!admin) {
      console.log(`❌ Admin not found for email: ${email}`);
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
        timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""}`;
      } else {
        timeMessage = `${minutesRemaining} minute${
          minutesRemaining > 1 ? "s" : ""
        }`;
      }

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
        locked: true,
        timeUntilUnlock: admin.accountLockedUntil,
        failedAttempts: admin.failedLoginAttempts,
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
    console.log(`🔍 Verifying password for admin ${admin._id}...`);
    console.log(`🔍 Input password: "${password}"`);
    console.log(`🔍 Stored password hash: ${admin.password.substring(0, 29)}...`);
    const isPasswordValid = await admin.comparePassword(password);
    console.log(`🔍 Password valid: ${isPasswordValid}`);
    
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

      // Log failed login attempt
      logger.auth('Failed admin login attempt', {
        email: email,
        ip: req.ip,
        remainingAttempts: result.remainingAttempts,
        locked: result.locked
      });

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

    // Decrypt admin data for response
    const decryptedAdmin = decryptAdminData(admin.toObject());

    // Log successful login
    logger.auth('Successful admin login', {
      adminId: admin._id,
      email: decryptedAdmin.email,
      role: admin.role,
      ip: req.ip
    });

    // Generate tokens
    const accessToken = generateToken(
      {
        adminId: admin._id,
        email: decryptedAdmin.email,
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
        email: decryptedAdmin.email,
        fullName: decryptedAdmin.fullName || `${decryptedAdmin.firstName} ${decryptedAdmin.lastName}`,
        firstName: decryptedAdmin.firstName,
        lastName: decryptedAdmin.lastName,
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
    logger.error("Admin login error:", error);
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

    // Decrypt admin data to get the real fullName
    const decryptedAdmin = decryptAdminData(admin.toObject());

    // Prepare instructor data for encryption
    const instructorData = {
      instructorid,
      email,
      fullName,
      college,
      department,
      status: "Active", // Automatically approved when invited by admin - keep unencrypted
      invitedBy: decryptedAdmin.email, // Use decrypted email for audit trails
    };

    // Encrypt sensitive instructor data before saving
    const encryptedInstructorData = encryptInstructorData(instructorData);

    // Create instructor record with encrypted data
    const instructor = new Instructor(encryptedInstructorData);

    await instructor.save();

    // Send notification email (no longer need invitation token)
    const emailResult = await emailService.sendInstructorInvitation(
      email,
      null, // No token needed since auto-approved
      decryptedAdmin.fullName
    );

    if (!emailResult.success) {
      // If email fails, we might want to delete the instructor record
      await Instructor.findByIdAndDelete(instructor._id);
      
      // Log failed invitation
      await logUniversalActivity(
        adminId,
        decryptedAdmin.email,
        'admin',
        'INSTRUCTOR_INVITED',
        {
          category: 'USER_MANAGEMENT',

          success: false,
          description: `Failed to invite instructor ${email} - email delivery failed`,
          targetType: 'Instructor',
          targetIdentifier: email,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );
      
      return res.status(500).json({
        success: false,
        message: "Failed to send invitation email",
      });
    }

    // Log successful invitation
    await logUniversalActivity(
      adminId,
      decryptedAdmin.email,
      'admin',
      'INSTRUCTOR_INVITED',
      {
        category: 'USER_MANAGEMENT',
        success: true,
        description: `Successfully invited instructor ${fullName} (${email})`,
        targetType: 'Instructor',
        targetId: instructor._id,
        targetIdentifier: email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          instructorId: instructor.instructorid,
          college,
          department
        }
      }
    );

    // Decrypt instructor data for response (don't send encrypted data to client)
    const responseInstructor = decryptInstructorData(instructor.toObject());

    res.status(201).json({
      success: true,
      message: "Instructor invited and automatically approved successfully",
      instructor: {
        id: responseInstructor._id,
        email: responseInstructor.email,
        fullName: responseInstructor.fullName,
        college: responseInstructor.college,
        department: responseInstructor.department,
        status: responseInstructor.status,
        invitedBy: responseInstructor.invitedBy,
        createdAt: responseInstructor.createdAt,
      },
    });
  } catch (error) {
    console.error("Invite instructor error:", error);
    // Handle MongoDB duplicate key error (code 11000)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Instructor with this email or ID already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const inviteMultipleInstructors = async (req, res) => {
  try {
    const { instructors } = req.body;
    const adminId = req.admin.id;

    if (!Array.isArray(instructors) || instructors.length === 0) {
      return res.status(400).json({
        success: false,
        message: "instructors array is required and must not be empty"
      });
    }

    // Get admin info for invitation
    const admin = await Admin.findById(adminId);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Decrypt admin data to get the real fullName
    const decryptedAdmin = decryptAdminData(admin.toObject());

    const results = {
      successful: [],
      failed: []
    };

    for (const instructorData of instructors) {
      const { instructorid, email, fullName, college, department } = instructorData;

      // Validate input
      if (!instructorid || !email || !fullName || !college || !department) {
        results.failed.push({
          data: instructorData,
          reason: "All fields are required: instructorid, email, fullName, college, department"
        });
        continue;
      }

      // Validate email domain
      if (!email.endsWith("@gmail.com")) {
        results.failed.push({
          data: instructorData,
          reason: "Invalid email domain. Must be @buksu.edu.ph"
        });
        continue;
      }

      // Check if instructor already exists
      const existingInstructor = await Instructor.findOne({
        $or: [{ email }, { instructorid }],
      });
      if (existingInstructor) {
        results.failed.push({
          data: instructorData,
          reason: "Instructor with this email or ID already exists"
        });
        continue;
      }

      try {
        // Prepare instructor data for encryption
        const preparedData = {
          instructorid,
          email,
          fullName,
          college,
          department,
          status: "Active",
          invitedBy: decryptedAdmin.email,
        };

        // Encrypt sensitive instructor data before saving
        const encryptedInstructorData = encryptInstructorData(preparedData);

        // Create instructor record with encrypted data
        const instructor = new Instructor(encryptedInstructorData);
        await instructor.save();

        // Send notification email
        try {
          await emailService.sendInstructorInvitation(
            email,
            null,
            decryptedAdmin.fullName
          );
        } catch (emailError) {
          console.error(`Failed to send invitation email to ${email}:`, emailError);
          // Continue even if email fails
        }

        // Log successful invitation
        await logUniversalActivity(
          adminId,
          decryptedAdmin.email,
          'admin',
          'INSTRUCTOR_INVITED',
          {
            category: 'USER_MANAGEMENT',
            success: true,
            description: `Successfully invited instructor ${fullName} (${email})`,
            targetType: 'Instructor',
            targetId: instructor._id,
            targetIdentifier: email,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent'),
            metadata: {
              instructorId: instructor.instructorid,
              college,
              department
            }
          }
        );

        // Decrypt instructor data for response
        const responseInstructor = decryptInstructorData(instructor.toObject());

        results.successful.push({
          id: responseInstructor._id,
          email: responseInstructor.email,
          fullName: responseInstructor.fullName,
          instructorid: responseInstructor.instructorid,
          college: responseInstructor.college,
          department: responseInstructor.department,
          status: responseInstructor.status,
          invitedBy: responseInstructor.invitedBy
        });

      } catch (error) {
        results.failed.push({
          data: instructorData,
          reason: error.message || "Failed to create instructor"
        });
      }
    }

    res.status(201).json({
      success: true,
      message: `Invited ${results.successful.length} instructors, ${results.failed.length} failed`,
      results
    });

  } catch (error) {
    console.error("Bulk invite instructors error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

// Get all instructors
export const getAllInstructors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, college, department, includeArchived = false } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (college) filter.college = college;
    if (department) filter.department = department;

    // Include archived instructors only if explicitly requested
    if (includeArchived === 'true') {
      // Show all instructors including archived
    } else {
      filter.isArchived = { $ne: true };
    }

    // Get instructors with pagination
    const instructors = await Instructor.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-googleId");

    const total = await Instructor.countDocuments(filter);

    // Decrypt instructor data for response
    const decryptedInstructors = bulkDecryptUserData(
      instructors.map(instructor => instructor.toObject()),
      'instructor'
    );

    res.status(200).json({
      success: true,
      instructors: decryptedInstructors,
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
      includeArchived = false,
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

    // Include archived students only if explicitly requested
    if (includeArchived === 'true') {
      // Show all students including archived
    } else {
      filter.isArchived = { $ne: true };
    }

    // Get students with pagination
    const students = await Student.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select("-googleId");

    const total = await Student.countDocuments(filter);

    // Decrypt student data for response
    const decryptedStudents = bulkDecryptUserData(
      students.map(student => student.toObject()),
      'student'
    );

    res.status(200).json({
      success: true,
      students: decryptedStudents,
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

    // Log student deletion
    await logUniversalActivity(
      req.admin.id,
      req.admin.email,
      'admin',
      'STUDENT_DELETED',
      {
        category: 'USER_MANAGEMENT',
        success: true,
        description: `Successfully deleted student ${student.fullName} (${student.email})`,
        targetType: 'Student',
        targetId: student._id,
        targetIdentifier: student.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          studentId: student.studid,
          college: student.college,
          course: student.course,
          yearLevel: student.yearLevel
        }
      }
    );

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

    // Log instructor deletion
    await logUniversalActivity(
      req.admin.id,
      req.admin.email,
      'admin',
      'INSTRUCTOR_DELETED',
      {
        category: 'USER_MANAGEMENT',
        success: true,
        description: `Successfully deleted instructor ${instructor.fullName} (${instructor.email})`,
        targetType: 'Instructor',
        targetId: instructor._id,
        targetIdentifier: instructor.email,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        metadata: {
          instructorId: instructor.instructorid,
          college: instructor.college,
          department: instructor.department
        }
      }
    );

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
    // Get counts (excluding archived items)
    const totalStudents = await Student.countDocuments({ isArchived: { $ne: true } });
    const approvedStudents = await Student.countDocuments({
      status: "Approved",
      isArchived: { $ne: true }
    });
    // No more pending students since they are automatically approved
    const pendingStudents = 0;
    const rejectedStudents = 0; // Not tracking rejected students anymore

    const totalInstructors = await Instructor.countDocuments({ isArchived: { $ne: true } });
    const activeInstructors = await Instructor.countDocuments({
      status: "Active",
      isArchived: { $ne: true }
    });
    const invitedInstructors = 0; // No longer tracking invited since auto-approved

    // Get semester and subject counts (excluding archived)
    const totalSemesters = await Semester.countDocuments({ isArchived: { $ne: true } });
    const totalSubjects = await Subject.countDocuments({ isArchived: { $ne: true } });

    // Get recent activities (last 10 students and instructors, excluding archived)
    const recentStudents = await Student.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status createdAt");

    const recentInstructors = await Instructor.find({ isArchived: { $ne: true } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("fullName email status createdAt");

    // Decrypt recent activities data before sending to frontend
    const decryptedRecentStudents = bulkDecryptUserData(
      recentStudents.map(s => s.toObject()),
      'student'
    );
    
    const decryptedRecentInstructors = bulkDecryptUserData(
      recentInstructors.map(i => i.toObject()),
      'instructor'
    );

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
        students: decryptedRecentStudents,
        instructors: decryptedRecentInstructors,
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

    // Decrypt admin data for response
    const decryptedAdmin = decryptAdminData(admin.toObject());

    res.status(200).json({
      success: true,
      admin: {
        id: decryptedAdmin._id,
        email: decryptedAdmin.email,
        fullName: decryptedAdmin.fullName,
        firstName: decryptedAdmin.firstName,
        lastName: decryptedAdmin.lastName,
        role: decryptedAdmin.role,
        status: decryptedAdmin.status,
        lastLogin: decryptedAdmin.lastLogin,
        createdAt: decryptedAdmin.createdAt,
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

// Archive student
export const archiveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const adminEmail = req.admin.email;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (student.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Student is already archived",
      });
    }

    student.isArchived = true;
    student.archivedAt = new Date();
    student.archivedBy = adminEmail;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Student archived successfully",
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        isArchived: student.isArchived,
        archivedAt: student.archivedAt,
        archivedBy: student.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive student
export const unarchiveStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    if (!student.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Student is not archived",
      });
    }

    student.isArchived = false;
    student.archivedAt = null;
    student.archivedBy = null;
    await student.save();

    res.status(200).json({
      success: true,
      message: "Student unarchived successfully",
      student: {
        id: student._id,
        email: student.email,
        fullName: student.fullName,
        isArchived: student.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive student error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Archive instructor
export const archiveInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;
    const adminEmail = req.admin.email;

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (instructor.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Instructor is already archived",
      });
    }

    instructor.isArchived = true;
    instructor.archivedAt = new Date();
    instructor.archivedBy = adminEmail;
    await instructor.save();

    res.status(200).json({
      success: true,
      message: "Instructor archived successfully",
      instructor: {
        id: instructor._id,
        email: instructor.email,
        fullName: instructor.fullName,
        isArchived: instructor.isArchived,
        archivedAt: instructor.archivedAt,
        archivedBy: instructor.archivedBy,
      },
    });
  } catch (error) {
    console.error("Archive instructor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unarchive instructor
export const unarchiveInstructor = async (req, res) => {
  try {
    const { instructorId } = req.params;

    const instructor = await Instructor.findById(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: "Instructor not found",
      });
    }

    if (!instructor.isArchived) {
      return res.status(400).json({
        success: false,
        message: "Instructor is not archived",
      });
    }

    instructor.isArchived = false;
    instructor.archivedAt = null;
    instructor.archivedBy = null;
    await instructor.save();

    res.status(200).json({
      success: true,
      message: "Instructor unarchived successfully",
      instructor: {
        id: instructor._id,
        email: instructor.email,
        fullName: instructor.fullName,
        isArchived: instructor.isArchived,
      },
    });
  } catch (error) {
    console.error("Unarchive instructor error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Admin logout
export const logoutAdmin = async (req, res) => {
  try {
    // If using sessions, destroy the session
    if (req.session) {
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });
    }

    // Log the logout activity
    if (req.admin) {
      await logUniversalActivity(
        req.admin.id,
        req.admin.email,
        'admin',
        'LOGOUT',
        {
          category: 'AUTHENTICATION',
          success: true,
          description: `Admin ${req.admin.email} logged out successfully`,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      logger.auth('Admin logout', {
        adminId: req.admin.id,
        email: req.admin.email,
        ip: req.ip
      });
    }

    res.status(200).json({
      success: true,
      message: "Logout successful"
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
};

/**
 * Change admin password
 * Verifies current password before allowing password change
 */
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required"
      });
    }

    // Validate new password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long"
      });
    }

    // Get admin from database
    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found"
      });
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      await logUniversalActivity(
        req.admin.id,
        'admin',
        'PASSWORD_CHANGE_FAILED',
        {
          category: 'SECURITY',
          success: false,
          description: 'Failed password change attempt - incorrect current password',
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      );

      return res.status(401).json({
        success: false,
        message: "Current password is incorrect"
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, admin.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password"
      });
    }

    // Update password (pre-save hook will hash it automatically)
    admin.password = newPassword;
    await admin.save();

    // Log the activity
    await logUniversalActivity(
      req.admin.id,
      'admin',
      'PASSWORD_CHANGED',
      {
        category: 'SECURITY',
        success: true,
        description: 'Admin password changed successfully',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      }
    );

    logger.auth('Admin password changed', {
      adminId: req.admin.id,
      email: req.admin.email,
      ip: req.ip
    });

    res.status(200).json({
      success: true,
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Change password error:", error);
    logger.error('Admin password change failed', {
      error: error.message,
      adminId: req.admin?.id
    });

    res.status(500).json({
      success: false,
      message: "Failed to change password"
    });
  }
};

