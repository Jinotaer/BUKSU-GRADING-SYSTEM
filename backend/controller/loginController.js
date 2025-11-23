import passport from "passport";
import jwt from "jsonwebtoken";
import Student from "../models/student.js";
import Instructor from "../models/instructor.js";
import logger from "../config/logger.js";
import { handleFailedLogin, handleSuccessfulLogin } from "../middleware/bruteForceProtection.js";
import { decryptStudentData, decryptInstructorData } from "./decryptionController.js";

// JWT secret from environment variables - should match auth middleware
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "your-secret-key";

/**
 * Find user by decrypting email field
 * Since emails are encrypted in database, we need to decrypt and compare
 * @param {string} email - Plain text email to search for
 * @param {string} userType - 'student' or 'instructor'
 * @returns {Object|null} - Found user or null
 */
const findUserByEmail = async (email, userType) => {
  try {
    let users, decryptFunction;
    
    if (userType === 'student') {
      users = await Student.find({});
      decryptFunction = decryptStudentData;
    } else if (userType === 'instructor') {
      users = await Instructor.find({});
      decryptFunction = decryptInstructorData;
    } else {
      return null;
    }

    // Decrypt each user and check email match
    for (const user of users) {
      try {
        const decryptedUser = decryptFunction(user.toObject());
        if (decryptedUser.email && decryptedUser.email.toLowerCase() === email.toLowerCase()) {
          return user; // Return the original user with encrypted data
        }
      } catch (error) {
        console.warn(`Failed to decrypt user ${user._id}:`, error.message);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
};

/**
 * Validate institutional email domains
 * @param {string} email - Email to validate
 * @returns {Object} - Validation result with role and validity
 */
const validateInstitutionalEmail = (email) => {
  if (!email) {
    return { isValid: false, role: null, message: "Email is required" };
  }

  // Student email validation
  if (email.endsWith("@student.buksu.edu.ph")) {
    return { isValid: true, role: "student", message: "Valid student email" };
  }

  // Instructor email validation
  if (email.endsWith("@gmail.com")) {
    return { isValid: true, role: "instructor", message: "Valid instructor email" };
  }

  // Invalid domain
  return { 
    isValid: false, 
    role: null, 
    message: "Invalid email domain. Use @student.buksu.edu.ph for students or @buksu.edu.ph for instructors" 
  };
};

/**
 * Validate Email Domain
 * Checks if email is from a valid institutional domain
 */
export const validateEmailDomain = (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    const validation = validateInstitutionalEmail(email);
    
    if (validation.isValid) {
      return res.json({
        success: true,
        message: validation.message,
        role: validation.role,
        emailDomain: validation.role === "student" ? "@student.buksu.edu.ph" : "@buksu.edu.ph"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: validation.message,
        allowedDomains: [
          "@student.buksu.edu.ph (for students)",
          "@buksu.edu.ph (for instructors)"
        ]
      });
    }
  } catch (error) {
    console.error("Email validation error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Google OAuth Login Initiation
 * Redirects user to Google OAuth consent screen
 */
export const initiateGoogleAuth = (req, res, next) => {
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account" // Force account selection
  })(req, res, next);
};

/**
 * Google OAuth Callback Handler
 * Handles the callback from Google after authentication
 */
export const handleGoogleCallback = (req, res, next) => {
  passport.authenticate("google", { 
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=auth_failed` 
  }, async (err, authData, info) => {
    if (err) {
      console.error("Google auth error:", err);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=server_error`);
    }

    if (!authData) {
      // Authentication failed - handle different scenarios
      const errorMessage = info?.message || "Authentication failed";
      let redirectURL = `${process.env.FRONTEND_URL || "http://localhost:5173"}/login`;

      if (errorMessage.includes("Unregistered student")) {
        redirectURL += "?error=unregistered_student&message=Student account not found. Please register first.";
      } else if (errorMessage.includes("not approved")) {
        redirectURL += "?error=not_approved&message=Student account pending admin approval.";
      } else if (errorMessage.includes("not invited")) {
        redirectURL += "?error=not_invited&message=Instructor not invited. Contact admin for access.";
      } else if (errorMessage.includes("Unauthorized email")) {
        redirectURL += "?error=invalid_domain&message=Invalid email domain. Use @student.buksu.edu.ph for students or @buksu.edu.ph for instructors.";
      } else {
        redirectURL += "?error=auth_failed&message=Authentication failed. Please try again.";
      }

      return res.redirect(redirectURL);
    }

    try {
      // Login successful - establish session and create JWT
      req.logIn(authData, (err) => {
        if (err) {
          console.error("Session login error:", err);
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=session_error`);
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            id: authData.user._id,
            email: authData.user.email,
            role: authData.role,
            googleId: authData.user.googleId
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        // Set HTTP-only cookie for additional security
        res.cookie("auth_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
          sameSite: "lax"
        });

        // Redirect based on role
        if (authData.role === "student") {
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/student/dashboard?token=${token}`);
        } else if (authData.role === "instructor") {
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/instructor/dashboard?token=${token}`);
        } else {
          return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=invalid_role`);
        }
      });
    } catch (error) {
      console.error("JWT generation error:", error);
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/login?error=token_error`);
    }
  })(req, res, next);
};

/**
 * Get Current User Information
 * Returns current logged-in user data
 */
export const getCurrentUser = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const { user, role } = req.user;
    
    // Remove sensitive data before sending
    const userData = {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      role: role,
      status: user.status
    };

    // Add role-specific data
    if (role === "student") {
      userData.college = user.college;
      userData.course = user.course;
      userData.yearLevel = user.yearLevel;
    } else if (role === "instructor") {
      userData.college = user.college;
      userData.department = user.department;
    }

    res.json({
      success: true,
      data: userData
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Logout Handler
 * Destroys session and clears cookies
 */
export const logout = (req, res) => {
  try {
    // Clear the authentication cookie
    res.clearCookie("auth_token");
    
    // Destroy passport session
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({
          success: false,
          message: "Error during logout"
        });
      }

      // Destroy session
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({
            success: false,
            message: "Error destroying session"
          });
        }

        res.json({
          success: true,
          message: "Logged out successfully"
        });
      });
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Verify JWT Token
 * Middleware to verify JWT tokens sent in requests
 */
export const verifyToken = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
    
    // Check for token in cookies as fallback
    if (!token && req.cookies.auth_token) {
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
 * Role-based Authorization Middleware
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
 * Login Handler for Google OAuth Token
 * Validates email domain and checks user registration/approval status
 */
export const loginWithEmail = async (req, res) => {
  try {
    const { email, userType } = req.body;
    const actualUserType = userType || req.inferredUserType;
    
    if (!email || !actualUserType) {
      return res.status(400).json({
        success: false,
        message: "Email and userType are required"
      });
    }

    // Validate email domain
    const validation = validateInstitutionalEmail(email);
    if (!validation.isValid) {
      // Record failed attempt for invalid email
      await handleFailedLogin(email, actualUserType).catch(() => {});
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }

    // Check if the userType matches the email domain
    if (validation.role !== actualUserType) {
      // Record failed attempt for mismatched user type
      await handleFailedLogin(email, actualUserType).catch(() => {});
      return res.status(400).json({
        success: false,
        message: `Email domain doesn't match user type. ${email} should be used for ${validation.role} accounts.`
      });
    }

    let user;
    let message;

    if (actualUserType === 'student') {
      // Check if student is registered (using encrypted email search)
      user = await findUserByEmail(email, 'student');
      
      if (!user) {
        // Record failed attempt for non-existent user
        await handleFailedLogin(email, actualUserType).catch(() => {});
        return res.status(404).json({
          success: false,
          message: "Student not registered"
        });
      }

      if (user.status !== 'Approved') {
        // Record failed attempt for unapproved account
        await handleFailedLogin(email, actualUserType).catch(() => {});
        return res.status(403).json({
          success: false,
          message: "Account not approved yet"
        });
      }

      message = "Student login successful";
    } else if (actualUserType === 'instructor') {
      // Check if instructor exists and is active (using encrypted email search)
      user = await findUserByEmail(email, 'instructor');
      
      if (!user) {
        // Record failed attempt for non-existent user
        await handleFailedLogin(email, actualUserType).catch(() => {});
        return res.status(404).json({
          success: false,
          message: "Instructor not registered"
        });
      }

      if (user.status !== 'Active') {
        // Record failed attempt for inactive account
        await handleFailedLogin(email, actualUserType).catch(() => {});
        return res.status(403).json({
          success: false,
          message: "Account not approved yet"
        });
      }

      message = "Instructor login successful";
    }

    // Successful login - reset any failed attempts
    await handleSuccessfulLogin(email, actualUserType).catch(() => {});

    // Decrypt user data for response and logging
    let decryptedUser;
    if (actualUserType === 'student') {
      decryptedUser = decryptStudentData(user.toObject());
    } else if (actualUserType === 'instructor') {
      decryptedUser = decryptInstructorData(user.toObject());
    }

    // Log successful login
    logger.auth(`Successful ${actualUserType} login`, {
      userId: user._id,
      email: decryptedUser.email,
      userType: actualUserType,
      ip: req.ip
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: decryptedUser.email,
        role: actualUserType,
        googleId: decryptedUser.googleId
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return decrypted user data and token
    const userData = {
      id: decryptedUser._id,
      email: decryptedUser.email,
      fullName: decryptedUser.fullName,
      role: actualUserType,
      status: decryptedUser.status
    };

    // Add role-specific data
    if (actualUserType === "student") {
      userData.college = decryptedUser.college;
      userData.course = decryptedUser.course;
      userData.yearLevel = decryptedUser.yearLevel;
    } else if (actualUserType === "instructor") {
      userData.college = decryptedUser.college;
      userData.department = decryptedUser.department;
    }

    res.json({
      success: true,
      message,
      user: userData,
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Check Authentication Status
 * Returns whether user is authenticated and their role
 */
export const checkAuthStatus = async (req, res) => {
  try {
    // Check if user is authenticated via session
    if (req.user) {
      return res.json({
        success: true,
        authenticated: true,
        role: req.user.role,
        user: {
          id: req.user.user._id,
          email: req.user.user.email,
          fullName: req.user.user.fullName
        }
      });
    }

    // Check JWT token if session is not available
    let token = req.cookies.auth_token || req.query.token;
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({
          success: true,
          authenticated: true,
          role: decoded.role,
          user: {
            id: decoded.id,
            email: decoded.email
          }
        });
      } catch (err) {
        // Token is invalid or expired
        res.clearCookie("auth_token");
      }
    }

    res.json({
      success: true,
      authenticated: false,
      role: null,
      user: null
    });
  } catch (error) {
    console.error("Auth status check error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
