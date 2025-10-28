// routes/exportRoutes.js
import express from 'express';
import { exportToGoogleSheets } from '../controller/exportController.js';
import { instructorAuth } from '../middleware/auth.js';

const router = express.Router();

// Export grades to Google Sheets
router.post('/google-sheets/:sectionId', instructorAuth, exportToGoogleSheets);

export default router;
