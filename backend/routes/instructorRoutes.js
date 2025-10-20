// routes/instructorRoutes.js
import express from "express";
import { 
  getInstructorProfile,
  updateInstructorProfile,
  getInstructorSections,
  getStudentsInSection,
  enrollStudentToSection,
  removeStudentFromSection,
  inviteStudentsToSection,
  getAvailableStudents,
  getInstructorDashboardStats,
  createActivity,
  getActivitiesBySubject,
  getActivitiesBySection
} from "../controller/instructorController.js";
import { getAllInstructors } from "../controller/adminController.js";
import { instructorAuth, auth } from "../middleware/auth.js";

const router = express.Router();

/**
 * @route   GET /api/instructor/dashboard/stats
 * @desc    Get dashboard statistics for the instructor
 * @access  Private (Instructor only)
 */
router.get("/dashboard/stats", instructorAuth, getInstructorDashboardStats);

/**
 * @route   GET /api/instructor/profile
 * @desc    Get current instructor's profile
 * @access  Private (Instructor only)
 */
router.get("/profile", instructorAuth, getInstructorProfile);

/**
 * @route   PUT /api/instructor/profile
 * @desc    Update current instructor's profile
 * @access  Private (Instructor only)
 */
router.put("/profile", instructorAuth, updateInstructorProfile);

/**
 * @route   GET /api/instructor/all
 * @desc    Get all instructors (for section creation)
 * @access  Private (Authenticated users)
 */
router.get("/all", auth, getAllInstructors);

/**
 * @route   GET /api/instructor/sections
 * @desc    Get all sections assigned to the instructor
 * @access  Private (Instructor only)
 */
router.get("/sections", instructorAuth, getInstructorSections);

/**
 * @route   GET /api/instructor/sections/:sectionId/students
 * @desc    Get all students in a specific section
 * @access  Private (Instructor only)
 */
router.get("/sections/:sectionId/students", instructorAuth, getStudentsInSection);

/**
 * @route   GET /api/instructor/sections/:sectionId/available-students
 * @desc    Get all available students that can be invited to a section
 * @access  Private (Instructor only)
 */
router.get("/sections/:sectionId/available-students", instructorAuth, getAvailableStudents);

/**
 * @route   POST /api/instructor/sections/:sectionId/students
 * @desc    Enroll a student to a section
 * @access  Private (Instructor only)
 */
router.post("/sections/:sectionId/students", instructorAuth, enrollStudentToSection);

/**
 * @route   POST /api/instructor/sections/:sectionId/invite-students
 * @desc    Invite multiple students to a section
 * @access  Private (Instructor only)
 */
router.post("/sections/:sectionId/invite-students", instructorAuth, inviteStudentsToSection);

/**
 * @route   DELETE /api/instructor/sections/:sectionId/students/:studentId
 * @desc    Remove a student from a section
 * @access  Private (Instructor only)
 */
router.delete("/sections/:sectionId/students/:studentId", instructorAuth, removeStudentFromSection);

/**
 * @route   POST /api/instructor/subjects/:subjectId/activities
 * @desc    Create a new activity for a subject
 * @access  Private (Instructor only)
 */
router.post("/subjects/:subjectId/activities", instructorAuth, createActivity);

/**
 * @route   GET /api/instructor/subjects/:subjectId/activities
 * @desc    Get all activities for a subject
 * @access  Private (Instructor only)
 */
router.get("/subjects/:subjectId/activities", instructorAuth, getActivitiesBySubject);

/**
 * @route   GET /api/instructor/sections/:sectionId/activities
 * @desc    Get all activities for a section
 * @access  Private (Instructor only)
 */
router.get("/sections/:sectionId/activities", instructorAuth, getActivitiesBySection);

export default router;