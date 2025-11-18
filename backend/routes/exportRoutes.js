// routes/exportRoutes.js
import express from 'express';
import { exportToGoogleSheets } from '../controller/exportController.js';
import { instructorAuth } from '../middleware/auth.js';
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

const router = express.Router();

// Export grades to Google Sheets
router.post('/google-sheets/:sectionId', instructorAuth, universalAuditLogger('INSTRUCTOR_GRADE_EXPORTED', 'INSTRUCTOR_ACTIVITY'), exportToGoogleSheets);

export default router;
