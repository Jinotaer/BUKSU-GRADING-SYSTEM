import express from "express";
import {
  registerStudent,
  getStudentProfile,
  updateStudentProfile,
  getAllStudents,
  updateStudentStatus,
  getStudentSections,
  getStudentGrades,
  getAvailableSubjects,
  searchStudents
} from "../controller/studentController.js";
import { 
  instructorAuth,
  adminAuth,
  studentAuth,
  auth
} from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   POST /api/student/register
 * @desc    Register a new student
 * @access  Public
 */
router.post("/register", registerStudent);

/**
 * @route   GET /api/student/profile
 * @desc    Get current student's profile
 * @access  Private (Student only)
 */
router.get("/profile", studentAuth, getStudentProfile);

/**
 * @route   PUT /api/student/profile
 * @desc    Update current student's profile
 * @access  Private (Student only)
 */
router.put("/profile", studentAuth, updateStudentProfile);

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
router.get("/sections", studentAuth, getStudentSections);

/**
 * @route   GET /api/student/grades
 * @desc    Get student's grades
 * @access  Private (Student only)
 */
router.get("/grades", studentAuth, getStudentGrades);

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

export default router;