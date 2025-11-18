// routes/semesterRoutes.js
import express from "express";
import { addSemester, listSemesters } from "../controller/semesterController.js";
import { adminAuth, auth } from "../middleware/auth.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

// Admin-only routes
router.post("/", adminAuth, universalAuditLogger('SEMESTER_CREATED', 'ACADEMIC_MANAGEMENT'), addSemester);

// Shared routes (admin and instructor can access)
router.get("/", auth, universalAuditLogger('SEMESTER_VIEWED', 'ACADEMIC_MANAGEMENT'), listSemesters); // Allow both admin and instructor to list semesters

export default router;
