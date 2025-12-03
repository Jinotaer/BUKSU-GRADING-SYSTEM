// routes/exportRoutes.js
import express from 'express';
import { exportToGoogleSheets } from '../controller/exportController.js';
import { exportFinalGrade } from '../controller/exportfinalgradeController.js';
import { instructorAuth } from '../middleware/auth.js';
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

const router = express.Router();

// Export grades to Google Sheets (CLASS RECORD)
router.post('/google-sheets/:sectionId', instructorAuth, universalAuditLogger('INSTRUCTOR_GRADE_EXPORTED', 'INSTRUCTOR_ACTIVITY'), exportToGoogleSheets);

// Export final grades (HYBRID-FLEXIBLE LEARNING GRADE SHEET)
router.post('/final-grade/:sectionId', instructorAuth, universalAuditLogger('INSTRUCTOR_FINAL_GRADE_EXPORTED', 'INSTRUCTOR_ACTIVITY'), exportFinalGrade);

export default router;
