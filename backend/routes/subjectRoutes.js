// routes/subjectRoutes.js
import express from "express";
import { 
  addSubject,
  addMultipleSubjects,
  getSubjectsBySemester, 
  listSubjects, 
  updateSubject, 
  deleteSubject,
  assignInstructorToSubject,
  getAssignedSubjects
} from "../controller/subjectController.js";
import { adminAuth, instructorAuth, auth, verifyGoogleAuthToken, requireRole } from "../middleware/auth.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

// Admin routes
router.post("/", adminAuth, universalAuditLogger('SUBJECT_CREATED', 'ACADEMIC_MANAGEMENT'), addSubject);
router.post("/bulk", adminAuth, universalAuditLogger('MULTIPLE_SUBJECTS_CREATED', 'ACADEMIC_MANAGEMENT'), addMultipleSubjects);
router.put("/:id", adminAuth, universalAuditLogger('SUBJECT_UPDATED', 'ACADEMIC_MANAGEMENT'), updateSubject);
router.delete("/:id", adminAuth, universalAuditLogger('SUBJECT_DELETED', 'ACADEMIC_MANAGEMENT'), deleteSubject);
router.post("/:subjectId/assign-instructor", adminAuth, universalAuditLogger('INSTRUCTOR_ASSIGNED', 'USER_MANAGEMENT'), assignInstructorToSubject);

// Shared routes (admin and instructor can access)
router.get("/", auth, universalAuditLogger('SUBJECT_VIEWED', 'ACADEMIC_MANAGEMENT'), listSubjects); // Allow both admin and instructor to list subjects
router.get("/semester/:semesterId", auth, universalAuditLogger('SUBJECT_VIEWED', 'ACADEMIC_MANAGEMENT'), getSubjectsBySemester); // Allow both admin and instructor

// Instructor-specific routes
router.get("/assigned", instructorAuth, universalAuditLogger('INSTRUCTOR_SUBJECT_ACCESSED', 'INSTRUCTOR_ACTIVITY'), getAssignedSubjects);

export default router;
