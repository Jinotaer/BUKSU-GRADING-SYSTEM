// routes/lockRoutes.js
import express from "express";
import {
  acquireLock,
  heartbeatLock,
  releaseLock,
  getLockStatus,
  checkBatchLocks,
  cleanupExpiredLocks,
} from "../controller/lockController.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// POST /api/locks/acquire - Acquire lock when clicking Edit
router.post("/acquire", adminAuth, acquireLock);

// POST /api/locks/heartbeat - Keep lock alive (every ~5 min)
router.post("/heartbeat", adminAuth, heartbeatLock);

// POST /api/locks/release - Release lock on Save/Cancel (5s grace)
router.post("/release", adminAuth, releaseLock);

// GET /api/locks/:id - Check if resource is locked
router.get("/:id", adminAuth, getLockStatus);

// POST /api/locks/check-batch - Batch check for list views (disable icons)
router.post("/check-batch", adminAuth, checkBatchLocks);

// POST /api/locks/cleanup - Clean up expired locks
router.post("/cleanup", adminAuth, cleanupExpiredLocks);

export default router;
