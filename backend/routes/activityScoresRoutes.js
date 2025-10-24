// routes/activityScoresRoutes.js
import express from "express";
import { requireInstructor, requireAcademicUser } from "../middleware/auth.js";
import {
  getActivityScores,
  upsertActivityScoresBulk,
} from "../controller/activityScoresController.js";

const router = express.Router();

// read for both instructors and students (students see only their own scores)
router.get("/activities/:activityId/scores", requireAcademicUser, getActivityScores);

// bulk upsert
router.post("/activities/:activityId/scores", requireInstructor, upsertActivityScoresBulk);

export default router;
