import express from "express";
import {
  registerStudent,
  bulkRegisterStudents,
  getStudentProfile,
  updateStudentProfile,
  getAllStudents,
  updateStudentStatus,
  getStudentSections,
  getStudentGrades,
  getAvailableSubjects,
  searchStudents,
  hideStudentSection,
  unhideStudentSection,
  getHiddenSections
} from "../controller/studentController.js";
import { 
  instructorAuth,
  adminAuth,
  studentAuth,
  auth
} from "../middleware/auth.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

/**
 * @route   POST /api/student/register
 * @desc    Register a new student
 * @access  Public
 */
router.post("/register", universalAuditLogger('STUDENT_REGISTERED', 'STUDENT_ACTIVITY'), registerStudent);

/**
 * @route   POST /api/student/register/bulk
 * @desc    Bulk register students
 * @access  Public
 */
router.post("/register/bulk", universalAuditLogger('BULK_STUDENTS_REGISTERED', 'STUDENT_ACTIVITY'), bulkRegisterStudents);

/**
 * @route   GET /api/student/profile
 * @desc    Get current student's profile
 * @access  Private (Student only)
 */
router.get("/profile", studentAuth, universalAuditLogger('PROFILE_VIEWED', 'PROFILE_MANAGEMENT'), getStudentProfile);

/**
 * @route   PUT /api/student/profile
 * @desc    Update current student's profile
 * @access  Private (Student only)
 */
router.put("/profile", studentAuth, universalAuditLogger('PROFILE_UPDATED', 'PROFILE_MANAGEMENT'), updateStudentProfile);

/**
 * @route   GET /api/student/all
 * @desc    Get all students (with pagination and filtering)
 * @access  Private (Admin only)
 */
router.get("/all", adminAuth, getAllStudents);

/**
 * @route   PUT /api/student/:id/status
 * @desc    Update student status (approve/reject)
 * @access  Private (Admin only)
 */
router.put("/:id/status", adminAuth, updateStudentStatus);

/**
 * @route   GET /api/student/sections
 * @desc    Get student's enrolled sections
 * @access  Private (Student only)
 */
router.get("/sections", studentAuth, universalAuditLogger('STUDENT_SUBJECT_ACCESSED', 'STUDENT_ACTIVITY'), getStudentSections);

/**
 * @route   GET /api/student/grades
 * @desc    Get student's grades
 * @access  Private (Student only)
 */
router.get("/grades", studentAuth, universalAuditLogger('STUDENT_GRADE_VIEWED', 'STUDENT_ACTIVITY'), getStudentGrades);

/**
 * @route   GET /api/student/subjects/available
 * @desc    Get available subjects for enrollment
 * @access  Private (Student only)
 */
router.get("/subjects/available", studentAuth, getAvailableSubjects);

/**
 * @route   GET /api/students/search
 * @desc    Search students by studid or email  
 * @access  Private (Instructor or Admin)
 */
router.get("/search", auth, searchStudents);

/**
 * @route   GET /api/student/sections/hidden
 * @desc    Get student's hidden sections
 * @access  Private (Student only)
 */
router.get("/sections/hidden", studentAuth, getHiddenSections);

/**
 * @route   PUT /api/student/sections/:id/hide
 * @desc    Hide a section (student perspective)
 * @access  Private (Student only)
 */
router.put("/sections/:id/hide", studentAuth, hideStudentSection);

/**
 * @route   PUT /api/student/sections/:id/unhide
 * @desc    Unhide a section (student perspective)
 * @access  Private (Student only)
 */
router.put("/sections/:id/unhide", studentAuth, unhideStudentSection);

export default router;