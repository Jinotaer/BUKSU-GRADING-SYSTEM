import express from 'express';
import { verifyCaptcha } from '../controller/captchaController.js';
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

const router = express.Router();

/**
 * @route   POST /api/verify-captcha
 * @desc    Validates CAPTCHA responses with Google's reCAPTCHA API
 * @access  Public
 */
router.post('/verify-captcha', universalAuditLogger('CAPTCHA_VERIFICATION', 'SECURITY'), verifyCaptcha);

export default router;