// routes/sectionRoutes.js
import express from "express";
import { 
  createSection, 
  getAllSections,
  getInstructorSections,
  updateSection,
  deleteSection,
  getSectionsBySubject, 
  getInstructorForSubject,
  getSubjectsWithMultipleInstructors,
  archiveSection,
  unarchiveSection,
  recalculateGrades
} from "../controller/sectionController.js";
import { instructorAuth, adminAuth, verifyGoogleAuthToken, requireRole } from "../middleware/auth.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

// Get sections assigned to the logged-in instructor
router.get("/instructor/my-sections", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('INSTRUCTOR_SECTION_ACCESSED', 'INSTRUCTOR_ACTIVITY'), getInstructorSections);

// Get all sections
router.get("/", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_VIEWED', 'ACADEMIC_MANAGEMENT'), getAllSections);

// Get subjects with multiple instructors
router.get("/subjects-with-multiple-instructors", verifyGoogleAuthToken, requireRole(["instructor"]), getSubjectsWithMultipleInstructors);

// Admin or instructor can create
router.post("/", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_CREATED', 'ACADEMIC_MANAGEMENT'), createSection);

// Update section
router.put("/:id", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_UPDATED', 'ACADEMIC_MANAGEMENT'), updateSection);

// Delete section
router.delete("/:id", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_DELETED', 'ACADEMIC_MANAGEMENT'), deleteSection);

// Get all sections for a subject
router.get("/subject/:subjectId", verifyGoogleAuthToken, requireRole(["instructor"]), getSectionsBySubject);

// Get instructor for subject (optionally filter by sy/term)
router.get("/subject/:subjectId/instructor", verifyGoogleAuthToken, requireRole(["instructor"]), getInstructorForSubject);

// Archive and unarchive sections (instructors can archive their own sections)
router.put("/:id/archive", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_ARCHIVED', 'ACADEMIC_MANAGEMENT'), archiveSection);
router.put("/:id/unarchive", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('SECTION_UNARCHIVED', 'ACADEMIC_MANAGEMENT'), unarchiveSection);

// Manually recalculate all grades in a section (instructors only)
router.post("/:id/recalculate-grades", verifyGoogleAuthToken, requireRole(["instructor"]), universalAuditLogger('GRADES_RECALCULATED', 'GRADE_MANAGEMENT'), recalculateGrades);

export default router;
