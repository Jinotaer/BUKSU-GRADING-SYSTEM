import express from 'express';
import {
  getInstructorSchedules,
  getStudentSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getUpcomingSchedules
} from '../controller/scheduleController.js';
import { verifyGoogleAuthToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Note: Schedule creation has been removed - schedules are now created automatically when creating activities
// This ensures that every activity has a schedule and activities are the primary entry point

// Get schedules based on user role
router.get('/instructor/schedules', verifyGoogleAuthToken, requireRole(['instructor']), getInstructorSchedules);
router.get('/student/schedules', verifyGoogleAuthToken, requireRole(['student']), getStudentSchedules);

// Get upcoming schedules (both instructors and students can access)
router.get('/upcoming', verifyGoogleAuthToken, requireRole(['instructor', 'student']), getUpcomingSchedules);

// Get, update, or delete a specific schedule (both instructors and students can view, only instructors can modify)
router.get('/:id', verifyGoogleAuthToken, requireRole(['instructor', 'student']), getScheduleById);
router.put('/:id', verifyGoogleAuthToken, requireRole(['instructor']), updateSchedule);
router.delete('/:id', verifyGoogleAuthToken, requireRole(['instructor']), deleteSchedule);

export default router;
