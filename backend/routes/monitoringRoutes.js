import express from 'express';
import {
  getActivityLogs,
  getSecurityEvents,
  getMonitoringStats,
  getSystemHealth,
  exportLogs,
  deleteOldLogs,
  getUserTypeStats
} from '../controller/monitoringController.js';
import { adminAuth } from '../middleware/auth.js';

const router = express.Router();

// Apply admin authentication to all monitoring routes
router.use(adminAuth);

// Activity logs
router.get('/activities', getActivityLogs); // Legacy route for compatibility
router.get('/logs', getActivityLogs);
router.get('/logs/export', exportLogs);

// Security monitoring
router.get('/security-events', getSecurityEvents);

// System monitoring
router.get('/stats', getMonitoringStats);
router.get('/user-stats', getUserTypeStats);
router.get('/health', getSystemHealth);

// Maintenance
router.delete('/logs/cleanup', deleteOldLogs);

export default router;