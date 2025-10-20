// routes/gradeRoutes.js
import express from "express";
import { addOrUpdateGrade, getGradesBySection } from "../controller/gradeController.js";
import { instructorAuth, studentAuth } from "../middleware/auth.js";

const router = express.Router();

// Instructor routes
router.post("/", instructorAuth, addOrUpdateGrade);
router.get("/section/:sectionId", instructorAuth, getGradesBySection);

// Student routes (students can view their own grades via student controller)

export default router;
