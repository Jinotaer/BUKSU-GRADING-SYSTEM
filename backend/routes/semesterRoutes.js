// routes/semesterRoutes.js
import express from "express";
import { addSemester, listSemesters } from "../controller/semesterController.js";
import { adminAuth, auth } from "../middleware/auth.js";

const router = express.Router();

// Admin-only routes
router.post("/", adminAuth, addSemester);

// Shared routes (admin and instructor can access)
router.get("/", auth, listSemesters); // Allow both admin and instructor to list semesters

export default router;
