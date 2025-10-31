import express from 'express';
import {
  createSchedule,
  getInstructorSchedules,
  getStudentSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getUpcomingSchedules
} from '../controller/scheduleController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Create a new schedule (instructor only)
router.post('/create', auth, createSchedule);

// Get schedules based on user role
router.get('/instructor/schedules', auth, getInstructorSchedules);
router.get('/student/schedules', auth, getStudentSchedules);

// Get upcoming schedules
router.get('/upcoming', auth, getUpcomingSchedules);

// Get, update, or delete a specific schedule
router.get('/:id', auth, getScheduleById);
router.put('/:id', auth, updateSchedule);
router.delete('/:id', auth, deleteSchedule);

export default router;
