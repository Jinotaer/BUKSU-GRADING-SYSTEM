import { google } from 'googleapis';
import Instructor from '../models/instructor.js';

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:5000/api/google-calendar/callback'
);

// Scopes required for Google Calendar API
const SCOPES = ['https://www.googleapis.com/auth/calendar'];

/**
 * Generate Google OAuth URL for instructor
 */
export const getAuthUrl = async (req, res) => {
  try {
    const instructorId = req.user.id;

    // Generate auth URL with instructor ID in state
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      state: instructorId, // Pass instructor ID to retrieve after callback
      prompt: 'consent', // Force consent screen to get refresh token
    });

    res.json({ success: true, authUrl });
  } catch (error) {
    console.error('Error generating auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate authorization URL',
      error: error.message,
    });
  }
};

/**
 * Handle OAuth callback and store tokens
 */
export const handleCallback = async (req, res) => {
  try {
    const { code, state } = req.query;
    const instructorId = state; // Retrieve instructor ID from state

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Authorization code is required',
      });
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);
    
    if (!tokens.refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Failed to obtain refresh token. Please try again.',
      });
    }

    // Update instructor with tokens
    await Instructor.findByIdAndUpdate(instructorId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleCalendarConnected: true,
      googleCalendarConnectedAt: new Date(),
    });

    // Redirect to frontend with success message
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/instructor/profile?googleCalendar=connected`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/instructor/profile?googleCalendar=error`);
  }
};

/**
 * Check if instructor has connected Google Calendar
 */
export const checkConnectionStatus = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructor = await Instructor.findById(instructorId).select(
      'googleCalendarConnected googleCalendarConnectedAt'
    );

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found',
      });
    }

    res.json({
      success: true,
      connected: instructor.googleCalendarConnected || false,
      connectedAt: instructor.googleCalendarConnectedAt || null,
    });
  } catch (error) {
    console.error('Error checking connection status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check connection status',
      error: error.message,
    });
  }
};

/**
 * Disconnect Google Calendar
 */
export const disconnectCalendar = async (req, res) => {
  try {
    const instructorId = req.user.id;

    const instructor = await Instructor.findById(instructorId);

    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Instructor not found',
      });
    }

    // Revoke the refresh token if it exists
    if (instructor.googleRefreshToken) {
      try {
        oauth2Client.setCredentials({
          refresh_token: instructor.googleRefreshToken,
        });
        await oauth2Client.revokeCredentials();
      } catch (revokeError) {
        console.error('Error revoking credentials:', revokeError);
        // Continue even if revoke fails
      }
    }

    // Clear tokens from database
    await Instructor.findByIdAndUpdate(instructorId, {
      googleAccessToken: null,
      googleRefreshToken: null,
      googleCalendarConnected: false,
      googleCalendarConnectedAt: null,
    });

    res.json({
      success: true,
      message: 'Google Calendar disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting calendar:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Calendar',
      error: error.message,
    });
  }
};
