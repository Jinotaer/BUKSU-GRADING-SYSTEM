// routes/activityRoutes.js
import express from "express";
import {
  createActivity,
  getSectionActivities,
  getSubjectActivities,
  updateActivity,
  deleteActivity,
  toggleActivityStatus,
} from "../controller/activityController.js";
import { requireInstructor, requireAcademicUser } from "../middleware/auth.js";

const router = express.Router();

/**
 * Bridge middleware:
 * Your Google OAuth flow sets `req.user`, not `req.instructor`.
 * Some controllers still read `req.instructor.id`. This normalizes it.
 */
const attachInstructorFromUser = (req, _res, next) => {
  if (!req.instructor && req.user?.role === "instructor" && req.user?.user?._id) {
    const u = req.user.user;
    req.instructor = {
      id: u._id,
      email: u.email,
      role: "instructor",
      fullName: u.fullName,
    };
  }
  next();
};

/**
 * NOTE: Mount this router at `/api/instructor` in your server:
 * app.use("/api/instructor", activityRoutes);
 *
 * The effective routes will be:
 *  POST   /api/instructor/subjects/:subjectId/activities
 *  GET    /api/instructor/sections/:sectionId/activities
 *  GET    /api/instructor/subjects/:subjectId/activities
 *  PUT    /api/instructor/activities/:activityId
 *  DELETE /api/instructor/activities/:activityId
 *  PATCH  /api/instructor/activities/:activityId/toggle
 */

/** Create new activity (write) – require instructor */
router.post(
  "/subjects/:subjectId/activities",
  requireInstructor,
  attachInstructorFromUser,
  createActivity
);

/** Get activities by section (read) – allow academic users (students/instructors) */
router.get(
  "/sections/:sectionId/activities",
  requireAcademicUser,
  attachInstructorFromUser,
  getSectionActivities
);

/** Get activities by subject (read) – allow academic users (students/instructors) */
router.get(
  "/subjects/:subjectId/activities",
  requireAcademicUser,
  attachInstructorFromUser,
  getSubjectActivities
);

/** Update activity (write) – require instructor */
router.put(
  "/activities/:activityId",
  requireInstructor,
  attachInstructorFromUser,
  updateActivity
);

/** Delete activity (write) – require instructor */
router.delete(
  "/activities/:activityId",
  requireInstructor,
  attachInstructorFromUser,
  deleteActivity
);

/** Toggle activity status (write) – require instructor */
router.patch(
  "/activities/:activityId/toggle",
  requireInstructor,
  attachInstructorFromUser,
  toggleActivityStatus
);

export default router;
