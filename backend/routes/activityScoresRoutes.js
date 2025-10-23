// routes/activityScoresRoutes.js
import express from "express";
import { requireInstructor } from "../middleware/auth.js";
import {
  getActivityScores,
  upsertActivityScoresBulk,
} from "../controller/activityScoresController.js";

const router = express.Router();

// read for instructors (you can allow students to read their own later)
router.get("/activities/:activityId/scores", requireInstructor, getActivityScores);

// bulk upsert
router.post("/activities/:activityId/scores", requireInstructor, upsertActivityScoresBulk);

export default router;
