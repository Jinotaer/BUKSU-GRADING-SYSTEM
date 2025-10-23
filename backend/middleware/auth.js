import jwt from 'jsonwebtoken';
import Admin from '../models/admin.js';
import Instructor from '../models/instructor.js';
import Student from '../models/student.js';

// JWT secret for Google OAuth tokens
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "your-secret-key";

// Admin authentication middleware
export const adminAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    const admin = await Admin.findById(decoded.adminId).select('-password');
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    if (admin.status !== 'Active') {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not active' 
      });
    }

    req.admin = {
      id: admin._id,
      email: admin.email,
      role: admin.role,
      fullName: admin.fullName
    };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    
    // Provide specific error messages for different JWT errors
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }
  }
};

// Instructor authentication middleware (disabled for activities)
export const instructorAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // token must be for an instructor
    if (decoded.role !== 'instructor') {
      return res.status(401).json({ success: false, message: 'Access denied. Instructor token required.' });
    }

    const instructor = await Instructor.findById(decoded.id);
    if (!instructor) {
      return res.status(401).json({ success: false, message: 'Instructor not found' });
    }
    if (instructor.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Instructor account not active' });
    }

    // normalize for controllers
    req.instructor = {
      id: instructor._id,
      email: instructor.email,
      role: 'instructor',
      fullName: instructor.fullName,
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
    return res.status(401).json({ success: false, message });
  }
};


// Student authentication middleware
export const studentAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Check if this is a student token (from Google OAuth)
    if (decoded.role !== 'student') {
      return res.status(401).json({ 
        success: false, 
        message: 'Access denied. Student token required.' 
      });
    }
    
    const student = await Student.findById(decoded.id);
    
    if (!student) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token is not valid' 
      });
    }

    if (student.status !== 'Approved') {
      return res.status(401).json({ 
        success: false, 
        message: 'Account not approved' 
      });
    }

    req.student = {
      id: student._id,
      email: student.email,
      role: student.role,
      fullName: student.fullName
    };
    next();
  } catch (error) {
    console.error('Student auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
    });
  }
};

// General authentication middleware (for any authenticated user)
export const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token, authorization denied' 
      });
    }

    let decoded;
    let isAdminToken = false;
    let isInstructorToken = false;

    // Try to decode with admin JWT secret first
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      isAdminToken = true;
    } catch (error) {
      // If admin token verification fails, try instructor JWT secret
      try {
        decoded = jwt.verify(token, JWT_SECRET);
        isInstructorToken = true;
      } catch (error2) {
        return res.status(401).json({ 
          success: false, 
          message: 'Token is not valid' 
        });
      }
    }
    
    // Check which type of user based on the token payload and verification method
    if (isAdminToken && decoded.adminId) {
      const admin = await Admin.findById(decoded.adminId).select('-password');
      if (!admin || admin.status !== 'Active') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or inactive account' 
        });
      }
      req.user = { ...admin.toObject(), userType: 'admin' };
      req.admin = {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        fullName: admin.fullName
      };
    } else if (isInstructorToken && decoded.role === 'instructor') {
      const instructor = await Instructor.findById(decoded.id);
      if (!instructor || instructor.status !== 'Active') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or inactive account' 
        });
      }
      req.user = { ...instructor.toObject(), userType: 'instructor' };
      req.instructor = {
        id: instructor._id,
        email: instructor.email,
        role: instructor.role,
        fullName: instructor.fullName
      };
    } else if (isInstructorToken && decoded.role === 'student') {
      const student = await Student.findById(decoded.id);
      if (!student || student.status !== 'Approved') {
        return res.status(401).json({ 
          success: false, 
          message: 'Invalid or unapproved account' 
        });
      }
      req.user = { ...student.toObject(), userType: 'student' };
      req.student = {
        id: student._id,
        email: student.email,
        role: student.role,
        fullName: student.fullName
      };
    } else {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token format' 
      });
    }

    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Token is not valid' 
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
      return res.status(401).json({
        success: false,
        message: "Access token required"
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
      return res.status(401).json({
        success: false,
        message: "User not found"
      });
    }

    // Check if user is still active/approved
    if (decoded.role === "student" && user.status !== "Approved") {
      return res.status(401).json({
        success: false,
        message: "Student account not approved"
      });
    }

    if (decoded.role === "instructor" && user.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: "Instructor account not active"
      });
    }

    // Attach user data to request
    req.user = {
      user: user,
      role: decoded.role
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired"
      });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token"
      });
    } else {
      console.error("Token verification error:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
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
      return res.status(401).json({
        success: false,
        message: "Authentication required"
      });
    }

    const userRole = req.user.role;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions"
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