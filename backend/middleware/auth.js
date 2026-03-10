import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import Instructor from '../models/instructor.js';
import Student from '../models/student.js';
import { decryptAdminData, decryptInstructorData, decryptStudentData } from '../controller/decryptionController.js';
import { logRequestSecurityEvent } from "../utils/activityLogUtils.js";

// JWT secret for Google OAuth tokens - should match loginController
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "your-secret-key";
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET || "your-secret-key";

const getTargetType = (userType) => {
  if (userType === "admin") return "Admin";
  if (userType === "instructor") return "Instructor";
  if (userType === "student") return "Student";
  return "System";
};

const denyWithSecurityLog = (
  req,
  res,
  {
    status = 401,
    message,
    action = "UNAUTHORIZED_ACCESS_ATTEMPT",
    userType,
    description,
    code,
    metadata = {},
  }
) => {
  const attemptedEmail =
    typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : undefined;

  logRequestSecurityEvent({
    req,
    res,
    action,
    statusCode: status,
    description:
      description ||
      `Blocked ${req.method} ${req.originalUrl} with message: ${message}`,
    errorMessage: message,
    actorOverride: {
      attemptedEmail,
      attemptedUserType: userType,
    },
    targetInfo: attemptedEmail
      ? {
          targetType: getTargetType(userType),
          targetIdentifier: attemptedEmail,
        }
      : null,
    metadata: {
      authLayer: "middleware",
      denialStatus: status,
      ...metadata,
    },
  }).catch(() => {});

  const responseBody = {
    success: false,
    message,
  };

  if (code) {
    responseBody.code = code;
  }

  return res.status(status).json(responseBody);
};

// Admin authentication middleware
export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'No token, authorization denied',
        userType: 'admin',
        metadata: {
          authFailureReason: 'missing_token',
        },
      });
    }

    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Token is not valid',
        userType: 'admin',
        metadata: {
          authFailureReason: 'admin_not_found',
        },
      });
    }

    if (admin.status !== 'Active') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Account not active',
        userType: 'admin',
        metadata: {
          authFailureReason: 'inactive_account',
        },
      });
    }

    // Decrypt admin data for use in controllers
    const decryptedAdmin = decryptAdminData(admin.toObject());

    req.admin = {
      _id: admin._id,
      id: admin._id,
      email: decryptedAdmin.email,
      role: admin.role,
      fullName: decryptedAdmin.fullName || `${decryptedAdmin.firstName} ${decryptedAdmin.lastName}`,
      firstName: decryptedAdmin.firstName,
      lastName: decryptedAdmin.lastName
    };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    // Provide specific error messages for different JWT errors
    if (error.name === 'TokenExpiredError') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
        userType: 'admin',
        metadata: {
          authFailureReason: 'token_expired',
        },
      });
    } else if (error.name === 'JsonWebTokenError') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Invalid token',
        code: 'INVALID_TOKEN',
        userType: 'admin',
        metadata: {
          authFailureReason: 'invalid_token',
        },
      });
    } else {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Token is not valid',
        userType: 'admin',
        metadata: {
          authFailureReason: 'unknown_admin_auth_error',
        },
      });
    }
  }
};

// Instructor authentication middleware (disabled for activities)
export const instructorAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'No token, authorization denied',
        userType: 'instructor',
        metadata: {
          authFailureReason: 'missing_token',
        },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // token must be for an instructor
    if (decoded.role !== 'instructor') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Access denied. Instructor token required.',
        userType: 'instructor',
        metadata: {
          authFailureReason: 'wrong_role_token',
          decodedRole: decoded.role,
        },
      });
    }

    const instructor = await Instructor.findById(decoded.id);
    if (!instructor) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Instructor not found',
        userType: 'instructor',
        metadata: {
          authFailureReason: 'instructor_not_found',
          decodedUserId: decoded.id,
        },
      });
    }
    if (instructor.status !== 'Active') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Instructor account not active',
        userType: 'instructor',
        metadata: {
          authFailureReason: 'inactive_account',
          decodedUserId: decoded.id,
        },
      });
    }

    // Decrypt instructor data for use in controllers
    const decryptedInstructor = decryptInstructorData(instructor.toObject());

    // normalize for controllers
    req.instructor = {
      id: instructor._id,
      email: decryptedInstructor.email,
      role: 'instructor',
      fullName: decryptedInstructor.fullName,
    };
    // (optional) also expose a generic user
    req.user = { ...req.instructor, userType: 'instructor' };

    next();
  } catch (error) {
    console.error('Instructor auth error:', error);
    const message =
      error.name === 'TokenExpiredError' ? 'Token expired' :
      error.name === 'JsonWebTokenError' ? 'Invalid token' :
      'Unauthorized';
    return denyWithSecurityLog(req, res, {
      status: 401,
      message,
      userType: 'instructor',
      metadata: {
        authFailureReason:
          error.name === 'TokenExpiredError'
            ? 'token_expired'
            : error.name === 'JsonWebTokenError'
            ? 'invalid_token'
            : 'unauthorized',
      },
    });
  }
};


// Student authentication middleware
export const studentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'No token, authorization denied',
        userType: 'student',
        metadata: {
          authFailureReason: 'missing_token',
        },
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is a student token (from Google OAuth)
    if (decoded.role !== 'student') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Access denied. Student token required.',
        userType: 'student',
        metadata: {
          authFailureReason: 'wrong_role_token',
          decodedRole: decoded.role,
        },
      });
    }
    
    const student = await Student.findById(decoded.id);
    
    if (!student) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Token is not valid',
        userType: 'student',
        metadata: {
          authFailureReason: 'student_not_found',
          decodedUserId: decoded.id,
        },
      });
    }

    if (student.status !== 'Approved') {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Account not approved',
        userType: 'student',
        metadata: {
          authFailureReason: 'unapproved_account',
          decodedUserId: decoded.id,
        },
      });
    }

    // Decrypt student data for use in controllers
    const decryptedStudent = decryptStudentData(student.toObject());

    req.student = {
      id: student._id,
      email: decryptedStudent.email,
      role: student.role,
      fullName: decryptedStudent.fullName
    };
    next();
  } catch (error) {
    console.error('Student auth error:', error);
    return denyWithSecurityLog(req, res, {
      status: 401,
      message: 'Token is not valid',
      userType: 'student',
      metadata: {
        authFailureReason:
          error.name === 'TokenExpiredError' ? 'token_expired' : 'invalid_token',
      },
    });
  }
};

// General authentication middleware (for any authenticated user)
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔐 [AUTH] Token received:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    if (!token) {
      console.log('🔐 [AUTH] No token provided');
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'No token, authorization denied',
        metadata: {
          authFailureReason: 'missing_token',
          authLayer: 'general_auth',
        },
      });
    }

    let decoded;
    let isAdminToken = false;
    let isInstructorToken = false;

    // Try to decode with admin JWT secret first
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      // Check if it's actually an admin token based on the payload structure
      if (decoded.adminId) {
        isAdminToken = true;
        console.log('🔐 [AUTH] Token verified as ADMIN token');
      } else if (decoded.role === 'instructor' || decoded.role === 'student') {
        // Token was signed with JWT_ACCESS_SECRET but it's an instructor/student token
        isInstructorToken = true;
        console.log('🔐 [AUTH] Token verified as INSTRUCTOR/STUDENT token (via JWT_ACCESS_SECRET)');
      }
    } catch (error) {
      // If admin token verification fails, try instructor JWT secret
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        isInstructorToken = true;
        console.log('🔐 [AUTH] Token verified as INSTRUCTOR/STUDENT token (via JWT_SECRET)');
      } catch (error2) {
        console.log('🔐 [AUTH] Token verification failed with both secrets:', error2.message);
        return denyWithSecurityLog(req, res, {
          status: 401,
          message: 'Token is not valid',
          metadata: {
            authFailureReason: 'invalid_token',
            authLayer: 'general_auth',
          },
        });
      }
    }
    
    // Check which type of user based on the token payload and verification method
    if (isAdminToken && decoded.adminId) {
      console.log('🔐 [AUTH] Authenticated as ADMIN:', decoded.adminId);
      const admin = await Admin.findById(decoded.adminId).select('-password');
      if (!admin || admin.status !== 'Active') {
        console.log('🔐 [AUTH] Admin not found or inactive');
        return denyWithSecurityLog(req, res, {
          status: 401,
          message: 'Invalid or inactive account',
          userType: 'admin',
          metadata: {
            authFailureReason: 'invalid_or_inactive_account',
            authLayer: 'general_auth',
            decodedUserId: decoded.adminId,
          },
        });
      }
      
      // Decrypt admin data
      const decryptedAdmin = decryptAdminData(admin.toObject());
      
      req.user = { ...decryptedAdmin, userType: 'admin' };
      req.admin = {
        id: admin._id,
        email: decryptedAdmin.email,
        role: admin.role,
        fullName: decryptedAdmin.fullName || `${decryptedAdmin.firstName} ${decryptedAdmin.lastName}`
      };
    } else if (isInstructorToken && decoded.role === 'instructor') {
      console.log('🔐 [AUTH] Authenticated as INSTRUCTOR:', decoded.id);
      const instructor = await Instructor.findById(decoded.id);
      if (!instructor || instructor.status !== 'Active') {
        console.log('🔐 [AUTH] Instructor not found or inactive');
        return denyWithSecurityLog(req, res, {
          status: 401,
          message: 'Invalid or inactive account',
          userType: 'instructor',
          metadata: {
            authFailureReason: 'invalid_or_inactive_account',
            authLayer: 'general_auth',
            decodedUserId: decoded.id,
          },
        });
      }
      
      // Decrypt instructor data
      const decryptedInstructor = decryptInstructorData(instructor.toObject());
      
      req.user = { ...decryptedInstructor, userType: 'instructor' };
      req.instructor = {
        id: instructor._id,
        email: decryptedInstructor.email,
        role: 'instructor',
        fullName: decryptedInstructor.fullName
      };
    } else if (isInstructorToken && decoded.role === 'student') {
      console.log('🔐 [AUTH] Authenticated as STUDENT:', decoded.id);
      const student = await Student.findById(decoded.id);
      if (!student || student.status !== 'Approved') {
        console.log('🔐 [AUTH] Student not found or unapproved');
        return denyWithSecurityLog(req, res, {
          status: 401,
          message: 'Invalid or unapproved account',
          userType: 'student',
          metadata: {
            authFailureReason: 'invalid_or_unapproved_account',
            authLayer: 'general_auth',
            decodedUserId: decoded.id,
          },
        });
      }
      
      // Decrypt student data
      const decryptedStudent = decryptStudentData(student.toObject());
      
      req.user = { ...decryptedStudent, userType: 'student' };
      req.student = {
        id: student._id,
        email: decryptedStudent.email,
        role: 'student',
        fullName: decryptedStudent.fullName
      };
    } else {
      console.log('🔐 [AUTH] Invalid token format - decoded:', decoded);
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: 'Invalid token format',
        metadata: {
          authFailureReason: 'invalid_token_format',
          authLayer: 'general_auth',
        },
      });
    }

    console.log('🔐 [AUTH] Authentication successful');
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return denyWithSecurityLog(req, res, {
      status: 401,
      message: 'Token is not valid',
      metadata: {
        authFailureReason: 'general_auth_exception',
        authLayer: 'general_auth',
      },
    });
  }
};

/**
 * Google OAuth Token Verification Middleware
 * Authenticates users based on Google OAuth JWT tokens
 */
export const verifyGoogleAuthToken = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // Check for token in cookies as fallback
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    // Check for token in query params (for redirect scenarios)
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Access token required",
        metadata: {
          authFailureReason: "missing_access_token",
          authLayer: "verify_google_auth_token",
        },
      });
    }

    // Verify and decode token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Fetch fresh user data based on role
    let user;
    if (decoded.role === "student") {
      user = await Student.findById(decoded.id);
    } else if (decoded.role === "instructor") {
      user = await Instructor.findById(decoded.id);
    }

    if (!user) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "User not found",
        userType: decoded.role,
        metadata: {
          authFailureReason: "user_not_found",
          authLayer: "verify_google_auth_token",
          decodedUserId: decoded.id,
        },
      });
    }

    // Check if user is still active/approved
    if (decoded.role === "student" && user.status !== "Approved") {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Student account not approved",
        userType: "student",
        metadata: {
          authFailureReason: "student_not_approved",
          authLayer: "verify_google_auth_token",
          decodedUserId: decoded.id,
        },
      });
    }

    if (decoded.role === "instructor" && user.status !== "Active") {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Instructor account not active",
        userType: "instructor",
        metadata: {
          authFailureReason: "instructor_not_active",
          authLayer: "verify_google_auth_token",
          decodedUserId: decoded.id,
        },
      });
    }

    // Attach user data to request
    req.user = {
      user: user,
      role: decoded.role
    };

    // For backward compatibility with existing controllers, also set role-specific properties
    if (decoded.role === "instructor") {
      req.instructor = {
        id: decoded.id,
        _id: decoded.id,
        email: user.email,
        role: 'instructor',
        fullName: user.fullName,
      };
    } else if (decoded.role === "student") {
      req.student = {
        id: decoded.id,
        _id: decoded.id,
        email: user.email,
        role: 'student',
        fullName: user.fullName,
      };
    }

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Token expired",
        metadata: {
          authFailureReason: "token_expired",
          authLayer: "verify_google_auth_token",
        },
      });
    } else if (error.name === "JsonWebTokenError") {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Invalid token",
        metadata: {
          authFailureReason: "invalid_token",
          authLayer: "verify_google_auth_token",
        },
      });
    } else {
      console.error("Token verification error:", error);
      return denyWithSecurityLog(req, res, {
        status: 500,
        message: "Internal server error",
        action: "SECURITY_VIOLATION",
        metadata: {
          authFailureReason: "token_verification_exception",
          authLayer: "verify_google_auth_token",
        },
      });
    }
  }
};

/**
 * Role-based Authorization Middleware for Google OAuth
 * Restricts access based on user roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return denyWithSecurityLog(req, res, {
        status: 401,
        message: "Authentication required",
        metadata: {
          authFailureReason: "missing_authenticated_user",
          authLayer: "require_role",
          allowedRoles,
        },
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return denyWithSecurityLog(req, res, {
        status: 403,
        message: "Insufficient permissions",
        userType: userRole,
        metadata: {
          authFailureReason: "role_not_allowed",
          authLayer: "require_role",
          allowedRoles,
          actualRole: userRole,
        },
      });
    }

    next();
  };
};

/**
 * Student Only Middleware for Google OAuth
 * Shorthand for student-only routes
 */
export const requireStudent = [verifyGoogleAuthToken, requireRole(["student"])];

/**
 * Instructor Only Middleware for Google OAuth
 * Shorthand for instructor-only routes
 */
export const requireInstructor = [verifyGoogleAuthToken, requireRole(["instructor"])];

/**
 * Academic Users Middleware for Google OAuth
 * Allows both students and instructors
 */
export const requireAcademicUser = [verifyGoogleAuthToken, requireRole(["student", "instructor"])];

/**
 * Admin Only Middleware
 * Shorthand for admin-only routes (uses the old adminAuth system)
 */
export const requireAdmin = [adminAuth];
