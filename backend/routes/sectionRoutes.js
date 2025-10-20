// routes/sectionRoutes.js
import express from "express";
import { 
  createSection, 
  getAllSections,
  updateSection,
  deleteSection,
  getSectionsBySubject, 
  getInstructorForSubject,
  getSubjectsWithMultipleInstructors
} from "../controller/sectionController.js";
import { instructorAuth, adminAuth, verifyGoogleAuthToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

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

export default router;
