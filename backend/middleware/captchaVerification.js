import axios from 'axios';
import logger from '../config/logger.js';

/**
 * Middleware to verify reCAPTCHA token
 * Can be used in any route that requires CAPTCHA verification
 */
export const verifyCaptchaToken = async (req, res, next) => {
  try {
    const { captchaResponse } = req.body;

    // Skip CAPTCHA verification in development if needed
    if (process.env.NODE_ENV === 'development' && process.env.SKIP_CAPTCHA === 'true') {
      logger.info('Skipping CAPTCHA verification in development mode');
      return next();
    }

    // Check if CAPTCHA response is provided
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
      // CAPTCHA verified successfully, continue to next middleware
      logger.info('CAPTCHA verification successful', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
      return next();
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
        description: 'CAPTCHA verification failed',
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
      description: 'The server encountered an error during CAPTCHA verification'
    });
  }
};

/**
 * Utility function to verify reCAPTCHA token (for direct use in controllers)
 * @param {string} captchaResponse - reCAPTCHA response token
 * @param {string} remoteIp - Client IP address
 * @returns {Promise<boolean>} - Verification result
 */
export const verifyCaptchaResponse = async (captchaResponse, remoteIp = null) => {
  try {
    console.log('reCAPTCHA verification attempt:', { 
      hasResponse: !!captchaResponse, 
      responseLength: captchaResponse?.length, 
      remoteIp 
    });
    
    if (!captchaResponse) {
      console.log('No reCAPTCHA response provided');
      return false;
    }

    // Skip verification in development mode
    if (process.env.NODE_ENV === 'development' || !process.env.RECAPTCHA_SECRET) {
      console.log('Skipping reCAPTCHA verification in development mode');
      return true;
    }

    const verificationURL = 'https://www.google.com/recaptcha/api/siteverify';
    
    const response = await axios.post(verificationURL, null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET,
        response: captchaResponse,
        ...(remoteIp && { remoteip: remoteIp })
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('Google reCAPTCHA response:', response.data);
    
    return response.data.success;
  } catch (error) {
    console.error('reCAPTCHA verification utility error:', error.message);
    logger.error('CAPTCHA verification utility error:', error.message);
    return false;
  }
};