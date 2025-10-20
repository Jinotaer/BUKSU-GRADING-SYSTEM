// routes/subjectRoutes.js
import express from "express";
import { 
  addSubject, 
  getSubjectsBySemester, 
  listSubjects, 
  updateSubject, 
  deleteSubject,
  assignInstructorToSubject,
  getAssignedSubjects
} from "../controller/subjectController.js";
import { adminAuth, instructorAuth, auth, verifyGoogleAuthToken, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Admin routes
router.post("/", adminAuth, addSubject);
router.put("/:id", adminAuth, updateSubject);
router.delete("/:id", adminAuth, deleteSubject);
router.post("/:subjectId/assign-instructor", adminAuth, assignInstructorToSubject);

// Shared routes (admin and instructor can access)
router.get("/", auth, listSubjects); // Allow both admin and instructor to list subjects
router.get("/semester/:semesterId", auth, getSubjectsBySemester); // Allow both admin and instructor

// Instructor-specific routes
router.get("/assigned", instructorAuth, getAssignedSubjects);

export default router;
