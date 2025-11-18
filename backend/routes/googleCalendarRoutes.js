import express from 'express';
import {
  getAuthUrl,
  handleCallback,
  checkConnectionStatus,
  disconnectCalendar,
} from '../controller/googleCalendarController.js';
import { instructorAuth } from '../middleware/auth.js';
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

const router = express.Router();

// Get OAuth URL to connect Google Calendar
router.get('/auth-url', instructorAuth, universalAuditLogger('CALENDAR_AUTH_REQUESTED', 'INSTRUCTOR_ACTIVITY'), getAuthUrl);

// Handle OAuth callback
router.get('/callback', handleCallback);

// Check connection status
router.get('/status', instructorAuth, universalAuditLogger('CALENDAR_STATUS_CHECKED', 'INSTRUCTOR_ACTIVITY'), checkConnectionStatus);

// Disconnect Google Calendar
router.post('/disconnect', instructorAuth, universalAuditLogger('CALENDAR_DISCONNECTED', 'INSTRUCTOR_ACTIVITY'), disconnectCalendar);

export default router;
