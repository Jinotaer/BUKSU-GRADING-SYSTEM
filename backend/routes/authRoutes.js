import express from "express";
import {
  initiateGoogleAuth,
  handleGoogleCallback,
  getCurrentUser,
  logout,
  checkAuthStatus,
  validateEmailDomain,
  loginWithEmail
} from "../controller/loginController.js";
import { 
  verifyGoogleAuthToken, 
  requireRole, 
  requireStudent, 
  requireInstructor, 
  requireAcademicUser 
} from "../middleware/auth.js";
import { bruteForceProtection } from "../middleware/bruteForceProtection.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

/**
 * @route   POST /api/auth/validate-email
 * @desc    Validate institutional email domain
 * @access  Public
 */
router.post("/validate-email", validateEmailDomain);

/**
 * @route   POST /api/auth/login
 * @desc    Login with email and user type validation with brute-force protection
 * @access  Public
 */
router.post("/login", bruteForceProtection, universalAuditLogger('LOGIN', 'AUTHENTICATION'), loginWithEmail);

/**
 * @route   GET /api/auth/google
 * @desc    Initiate Google OAuth authentication
 * @access  Public
 */
router.get("/google", initiateGoogleAuth);

/**
 * @route   GET /api/auth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get("/google/callback", handleGoogleCallback);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get("/me", verifyGoogleAuthToken, universalAuditLogger('PROFILE_VIEWED', 'PROFILE_MANAGEMENT'), getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and destroy session
 * @access  Private
 */
router.post("/logout", universalAuditLogger('LOGOUT', 'AUTHENTICATION'), logout);

/**
 * @route   GET /api/auth/status
 * @desc    Check authentication status
 * @access  Public
 */
router.get("/status", checkAuthStatus);

/**
 * @route   GET /api/auth/student-only
 * @desc    Student-only protected route (example)
 * @access  Private (Students only)
 */
router.get("/student-only", ...requireStudent, (req, res) => {
  res.json({
    success: true,
    message: "This is a student-only route",
    user: req.user
  });
});

/**
 * @route   GET /api/auth/instructor-only
 * @desc    Instructor-only protected route (example)
 * @access  Private (Instructors only)
 */
router.get("/instructor-only", ...requireInstructor, (req, res) => {
  res.json({
    success: true,
    message: "This is an instructor-only route",
    user: req.user
  });
});

/**
 * @route   GET /api/auth/academic-users
 * @desc    Route accessible by both students and instructors
 * @access  Private (Students and Instructors)
 */
router.get("/academic-users", ...requireAcademicUser, (req, res) => {
  res.json({
    success: true,
    message: "This route is accessible by students and instructors",
    user: req.user
  });
});

export default router;