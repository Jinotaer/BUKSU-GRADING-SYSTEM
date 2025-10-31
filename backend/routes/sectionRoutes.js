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
  unarchiveSection
} from "../controller/sectionController.js";
import { instructorAuth, adminAuth, verifyGoogleAuthToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Get sections assigned to the logged-in instructor
router.get("/instructor/my-sections", verifyGoogleAuthToken, requireRole(["instructor"]), getInstructorSections);

// Get all sections
router.get("/", verifyGoogleAuthToken, requireRole(["instructor"]), getAllSections);

// Get subjects with multiple instructors
router.get("/subjects-with-multiple-instructors", verifyGoogleAuthToken, requireRole(["instructor"]), getSubjectsWithMultipleInstructors);

// Admin or instructor can create
router.post("/", verifyGoogleAuthToken, requireRole(["instructor"]), createSection);

// Update section
router.put("/:id", verifyGoogleAuthToken, requireRole(["instructor"]), updateSection);

// Delete section
router.delete("/:id", verifyGoogleAuthToken, requireRole(["instructor"]), deleteSection);

// Get all sections for a subject
router.get("/subject/:subjectId", verifyGoogleAuthToken, requireRole(["instructor"]), getSectionsBySubject);

// Get instructor for subject (optionally filter by sy/term)
router.get("/subject/:subjectId/instructor", verifyGoogleAuthToken, requireRole(["instructor"]), getInstructorForSubject);

// Archive and unarchive sections (instructors can archive their own sections)
router.put("/:id/archive", verifyGoogleAuthToken, requireRole(["instructor"]), archiveSection);
router.put("/:id/unarchive", verifyGoogleAuthToken, requireRole(["instructor"]), unarchiveSection);

export default router;
