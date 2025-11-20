// routes/gradeRoutes.js
import express from "express";
import { addOrUpdateGrade, getGradesBySection } from "../controller/gradeController.js";
import { instructorAuth, studentAuth } from "../middleware/auth.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

// Instructor routes
router.post("/", instructorAuth, universalAuditLogger('INSTRUCTOR_STUDENT_GRADED', 'GRADE_MANAGEMENT'), addOrUpdateGrade);
router.get("/section/:sectionId", instructorAuth, universalAuditLogger('GRADE_VIEWED', 'GRADE_MANAGEMENT'), getGradesBySection);

// Student routes (students can view their own grades via student controller)

export default router;
