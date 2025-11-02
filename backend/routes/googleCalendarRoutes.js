import express from 'express';
import {
  getAuthUrl,
  handleCallback,
  checkConnectionStatus,
  disconnectCalendar,
} from '../controller/googleCalendarController.js';
import { instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// Get OAuth URL to connect Google Calendar
router.get('/auth-url', instructorAuth, getAuthUrl);

// Handle OAuth callback
router.get('/callback', handleCallback);

// Check connection status
router.get('/status', instructorAuth, checkConnectionStatus);

// Disconnect Google Calendar
router.post('/disconnect', instructorAuth, disconnectCalendar);

export default router;
