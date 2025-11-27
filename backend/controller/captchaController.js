import axios from 'axios';
import logger from '../config/logger.js';

/**
 * Verify reCAPTCHA response with Google's reCAPTCHA API
 * @route POST /api/verify-captcha
 * @desc Validates CAPTCHA responses with Google's reCAPTCHA API
 * @access Public
 */
export const verifyCaptcha = async (req, res) => {
  try {
    const { captchaResponse } = req.body;

    // Validate request body
    if (!captchaResponse) {
      return res.status(400).json({
        success: false,
        message: 'Bad Request',
        error: 'No CAPTCHA response provided'
      });
    }

    // Verify with Google's reCAPTCHA API
    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    
    const response = await axios.post(verificationURL, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: captchaResponse,
        remoteip: req.ip
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { success, 'error-codes': errorCodes } = response.data;

    if (success) {
      // CAPTCHA verified successfully
      logger.info('CAPTCHA verification successful', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });

      return res.status(200).json({
        success: true,
        message: 'OK',
        description: 'CAPTCHA verified successfully'
      });
    } else {
      // CAPTCHA verification failed
      logger.warn('CAPTCHA verification failed', {
        ip: req.ip,
        errorCodes,
        timestamp: new Date().toISOString()
      });

      return res.status(400).json({
        success: false,
        message: 'Bad Request',
        description: 'No CAPTCHA response provided',
        errorCodes
      });
    }

  } catch (error) {
    // Server error during verification
    logger.error('CAPTCHA verification error:', {
      error: error.message,
      stack: error.stack,
      ip: req.ip,
      timestamp: new Date().toISOString()
    });

    return res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      description: 'The server encountered an error'
    });
  }
};