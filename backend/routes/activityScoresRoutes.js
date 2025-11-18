// routes/activityScoresRoutes.js
import express from "express";
import { requireInstructor, requireAcademicUser } from "../middleware/auth.js";
import {
  getActivityScores,
  upsertActivityScoresBulk,
} from "../controller/activityScoresController.js";
import { universalAuditLogger } from "../middleware/universalAuditLogger.js";

const router = express.Router();

// read for both instructors and students (students see only their own scores)
router.get("/activities/:activityId/scores", requireAcademicUser, universalAuditLogger('ACTIVITY_SCORES_VIEWED', 'ACADEMIC_MANAGEMENT'), getActivityScores);

// bulk upsert
router.post("/activities/:activityId/scores", requireInstructor, universalAuditLogger('ACTIVITY_SCORES_UPDATED', 'GRADE_MANAGEMENT'), upsertActivityScoresBulk);

export default router;
