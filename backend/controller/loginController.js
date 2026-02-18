import passport from "passport";
import jwt from "jsonwebtoken";
import Student from "../models/student.js";
import Instructor from "../models/instructor.js";
import Admin from "../models/admin.js";
import logger from "../config/logger.js";
import { handleFailedLogin, handleSuccessfulLogin } from "../middleware/bruteForceProtection.js";
import { decryptStudentData, decryptInstructorData, decryptAdminData } from "./decryptionController.js";
import { verifyCaptchaResponse } from "../middleware/captchaVerification.js";

// JWT secret from environment variables - should match auth middleware
const JWT_SECRET = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET || "your-secret-key";

/**
 * Find user by decrypting email field
 * Since emails are encrypted in database, we need to decrypt and compare
 * @param {string} email - Plain text email to search for
 * @param {string} userType - 'student', 'instructor', 'admin', or null to search all
 * @returns {Object|null} - Found user with type or null
 */
const findUserByEmail = async (email, userType = null) => {
  try {
    let searchTypes = userType ? [userType] : ['student', 'instructor', 'admin'];
    
    for (const type of searchTypes) {
      let users, decryptFunction;
      
      if (type === 'student') {
        users = await Student.find({});
        decryptFunction = decryptStudentData;
      } else if (type === 'instructor') {
        users = await Instructor.find({});
        decryptFunction = decryptInstructorData;
      } else if (type === 'admin') {
        users = await Admin.find({});
        decryptFunction = decryptAdminData;
      } else {
        continue;
      }

      // Decrypt each user and check email match
      for (const user of users) {
        try {
          const decryptedUser = decryptFunction(user.toObject());
          if (decryptedUser.email && decryptedUser.email.toLowerCase() === email.toLowerCase()) {
            return { user, userType: type }; // Return user with detected type
          }
        } catch (error) {
          console.warn(`Failed to decrypt ${type} ${user._id}:`, error.message);
          continue;
        }
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

  // Admin email validation
  if (email.endsWith("@buksu.edu.ph")) {
    return { isValid: true, role: "admin", message: "Valid admin email" };
  }

  // Invalid domain
  return { 
    isValid: false, 
    role: null, 
    message: "Invalid email domain. Use @student.buksu.edu.ph for students, @buksu.edu.ph for admins, or @gmail.com for instructors" 
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
        emailDomain: validation.role === "student" ? "@student.buksu.edu.ph" : 
                     validation.role === "admin" ? "@buksu.edu.ph" : "@gmail.com"
      });
    } else {
      return res.status(400).json({
        success: false,
        message: validation.message,
        allowedDomains: [
          "@student.buksu.edu.ph (for students)",
          "@buksu.edu.ph (for admins)",
          "@gmail.com (for instructors)"
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
    } else if (role === "admin") {
      userData.firstName = user.firstName;
      userData.lastName = user.lastName;
      userData.lastLogin = user.lastLogin;
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
    } else if (decoded.role === "admin") {
      user = await Admin.findById(decoded.id);
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

    if (decoded.role === "admin" && user.status !== "Active") {
      return res.status(401).json({
        success: false,
        message: "Admin account not active"
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
 * Login Handler for both Google OAuth and Email/Password Authentication
 * Supports unified authentication for students and instructors
 */
export const loginWithEmail = async (req, res) => {
  try {
    const { email, password, userType, captchaResponse, loginMethod } = req.body;
    let actualUserType = userType || req.inferredUserType;
    
    console.log('Login request received:', { 
      email, 
      userType: actualUserType, 
      loginMethod,
      hasCaptcha: !!captchaResponse,
      hasPassword: !!password 
    });
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // For email/password login, password is required
    if (loginMethod === 'email' && !password) {
      return res.status(400).json({
        success: false,
        message: "Password is required for email authentication"
      });
    }

    // Verify reCAPTCHA
    if (!captchaResponse) {
      console.log('Missing reCAPTCHA response');
      return res.status(400).json({
        success: false,
        message: "Please complete the reCAPTCHA verification"
      });
    }

    console.log('Verifying reCAPTCHA...');
    const isCaptchaValid = await verifyCaptchaResponse(captchaResponse, req.ip);
    
    if (!isCaptchaValid) {
      console.log('reCAPTCHA verification failed');
      // Record failed attempt for invalid CAPTCHA
      await handleFailedLogin(email, actualUserType || "unknown").catch(() => {});
      return res.status(400).json({
        success: false,
        message: "CAPTCHA verification failed. Please try again."
      });
    }
    
    console.log('reCAPTCHA verification successful');

    // Find user across all types if userType not specified
    const userResult = await findUserByEmail(email, actualUserType);
    
    if (!userResult) {
      // Record failed attempt for non-existent user
      await handleFailedLogin(email, actualUserType || "unknown").catch(() => {});

      // Return a role-specific message so the frontend can handle each case
      let notRegisteredMessage = "User not registered";
      if (actualUserType === 'student') {
        notRegisteredMessage = "Student not registered";
      } else if (actualUserType === 'instructor') {
        notRegisteredMessage = "Instructor not registered";
      }

      return res.status(404).json({
        success: false,
        message: notRegisteredMessage
      });
    }

    const { user, userType: detectedUserType } = userResult;
    actualUserType = detectedUserType; // Use the detected user type

    // Handle authentication based on detected user type
    let message;
    
    // For email/password authentication, verify password
    if (loginMethod === 'email' && password) {
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Record failed attempt for wrong password
        await handleFailedLogin(email, actualUserType).catch(() => {});
        return res.status(401).json({
          success: false,
          message: "Invalid email or password"
        });
      }
    } else if (loginMethod === 'email' && !password) {
      // For email login method, password is required
      await handleFailedLogin(email, actualUserType).catch(() => {});
      return res.status(401).json({
        success: false,
        message: "Password is required for email authentication"
      });
    }

    // Check account status based on user type
    if (actualUserType === 'student' && user.status !== 'Approved') {
      await handleFailedLogin(email, actualUserType).catch(() => {});
      return res.status(403).json({
        success: false,
        message: "Account not approved yet"
      });
    } else if ((actualUserType === 'instructor' || actualUserType === 'admin') && user.status !== 'Active') {
      await handleFailedLogin(email, actualUserType).catch(() => {});
      return res.status(403).json({
        success: false,
        message: `${actualUserType.charAt(0).toUpperCase() + actualUserType.slice(1)} account is not active`
      });
    }

    // Check if admin account is locked
    if (actualUserType === 'admin' && user.isLocked && user.isLocked()) {
      const timeUntilUnlock = user.accountLockedUntil - Date.now();
      const hoursRemaining = Math.ceil(timeUntilUnlock / (60 * 60 * 1000));
      const minutesRemaining = Math.ceil(timeUntilUnlock / (60 * 1000));

      let timeMessage;
      if (hoursRemaining >= 1) {
        timeMessage = `${hoursRemaining} hour${hoursRemaining > 1 ? "s" : ""}`;
      } else {
        timeMessage = `${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}`;
      }

      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to too many failed login attempts. Please try again in ${timeMessage}.`,
        locked: true
      });
    }

    message = `${actualUserType.charAt(0).toUpperCase() + actualUserType.slice(1)} login successful`;

    // Successful login - reset any failed attempts
    await handleSuccessfulLogin(email, actualUserType).catch(() => {});

    // Decrypt user data for response and logging
    let decryptedUser;
    if (actualUserType === 'student') {
      decryptedUser = decryptStudentData(user.toObject());
    } else if (actualUserType === 'instructor') {
      decryptedUser = decryptInstructorData(user.toObject());
    } else if (actualUserType === 'admin') {
      decryptedUser = decryptAdminData(user.toObject());
    }

    // Log successful login
    logger.auth(`Successful ${actualUserType} login via ${loginMethod}`, {
      userId: user._id,
      email: decryptedUser.email,
      userType: actualUserType,
      loginMethod,
      ip: req.ip
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user._id,
        email: decryptedUser.email,
        role: actualUserType, // Use consistent lowercase user type
        googleId: decryptedUser.googleId || null,
        loginMethod
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Return decrypted user data and token
    const userData = {
      id: decryptedUser._id,
      email: decryptedUser.email,
      fullName: decryptedUser.fullName || `${decryptedUser.firstName} ${decryptedUser.lastName}`,
      role: decryptedUser.role || actualUserType, // Use actual role from database
      status: decryptedUser.status,
      authMethod: decryptedUser.authMethod || 'google'
    };

    // Add role-specific data
    if (actualUserType === "student") {
      userData.college = decryptedUser.college;
      userData.course = decryptedUser.course;
      userData.yearLevel = decryptedUser.yearLevel;
      userData.studid = decryptedUser.studid;
    } else if (actualUserType === "instructor") {
      userData.college = decryptedUser.college;
      userData.department = decryptedUser.department;
      userData.instructorid = decryptedUser.instructorid;
    } else if (actualUserType === "admin") {
      userData.firstName = decryptedUser.firstName;
      userData.lastName = decryptedUser.lastName;
      userData.lastLogin = decryptedUser.lastLogin;
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

/**
 * Request Password Reset for Students and Instructors
 * Generates reset token and sends email
 */
export const requestPasswordReset = async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email and userType are required"
      });
    }

    // Find user by email
    const user = await findUserByEmail(email, userType);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return res.json({
        success: true,
        message: "If an account exists with this email, password reset instructions will be sent."
      });
    }

    // Check if user uses email/password authentication
    if (user.authMethod === 'google' && !user.password) {
      return res.status(400).json({
        success: false,
        message: "This account uses Google authentication. Please sign in with Google."
      });
    }

    // Generate reset token
    const resetToken = require('crypto').randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    // Update user with reset token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpires;
    await user.save();

    // TODO: Send email with reset instructions
    // For now, we'll just return success
    // In production, you'd integrate with an email service

    logger.auth('Password reset requested', {
      userId: user._id,
      userType,
      ip: req.ip
    });

    res.json({
      success: true,
      message: "Password reset instructions have been sent to your email.",
      // In development, include the token for testing
      ...(process.env.NODE_ENV === 'development' && { resetToken })
    });

  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Reset Password for Students and Instructors
 * Validates token and updates password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, userType } = req.body;

    if (!token || !newPassword || !userType) {
      return res.status(400).json({
        success: false,
        message: "Token, new password, and userType are required"
      });
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long"
      });
    }

    // Find user with valid reset token
    let user;
    if (userType === 'student') {
      user = await Student.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    } else if (userType === 'instructor') {
      user = await Instructor.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Update password and clear reset token
    user.password = newPassword;
    user.authMethod = 'email'; // Set to email authentication
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    user.failedLoginAttempts = 0; // Reset failed attempts
    user.accountLockedUntil = null;
    await user.save();

    logger.auth('Password reset completed', {
      userId: user._id,
      userType,
      ip: req.ip
    });

    res.json({
      success: true,
      message: "Password has been reset successfully. You can now log in with your new password."
    });

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

/**
 * Verify Reset Token for Students and Instructors
 * Checks if reset token is valid without resetting password
 */
export const verifyResetToken = async (req, res) => {
  try {
    const { token, userType } = req.body;

    if (!token || !userType) {
      return res.status(400).json({
        success: false,
        message: "Token and userType are required"
      });
    }

    // Find user with valid reset token
    let user;
    if (userType === 'student') {
      user = await Student.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    } else if (userType === 'instructor') {
      user = await Instructor.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: new Date() }
      });
    }

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }

    // Decrypt user data to get email for display
    let decryptedUser;
    if (userType === 'student') {
      decryptedUser = decryptStudentData(user.toObject());
    } else if (userType === 'instructor') {
      decryptedUser = decryptInstructorData(user.toObject());
    }

    res.json({
      success: true,
      message: "Reset token is valid",
      email: decryptedUser.email
    });

  } catch (error) {
    console.error("Reset token verification error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};
