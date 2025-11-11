import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

// Ensure RFC3339-like datetime with explicit offset when possible.
// If the provided dateTime string has no timezone designator (no Z or +hh:mm/-hh:mm),
// append a timezone offset. For Manila we use +08:00 (no DST).
const ensureRfc3339WithOffset = (dateTimeStr, timeZone) => {
  if (!dateTimeStr) return dateTimeStr;
  // If already has Z or an offset, leave as-is
  if (/[Zz]$/.test(dateTimeStr) || /[+-]\d{2}:\d{2}$/.test(dateTimeStr)) return dateTimeStr;

  // Add seconds if missing (e.g. 2025-11-12T13:43 -> 2025-11-12T13:43:00)
  let s = dateTimeStr;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = `${s}:00`;

  // Map known timezones to offsets; default to +00:00 if unknown.
  const tzMap = {
    'Asia/Manila': '+08:00',
  };

  const offset = tzMap[timeZone] || '+00:00';
  return `${s}${offset}`;
};

class GoogleCalendarService {
  constructor() {
    // Initialize OAuth2 client
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );
  }

  /**
   * Create authenticated calendar instance with instructor's tokens
   */
  getCalendarInstance(accessToken, refreshToken) {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/auth/google/callback'
    );

    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return google.calendar({ version: 'v3', auth: oauth2Client });
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData, accessToken, refreshToken) {
    try {
      if (!accessToken || !refreshToken) {
        return {
          success: false,
          error: 'Google Calendar not connected. Please connect your Google Calendar in settings.',
        };
      }

      const calendar = this.getCalendarInstance(accessToken, refreshToken);

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: {
          // Ensure RFC3339 with explicit offset to avoid ambiguous naive datetimes
          dateTime: ensureRfc3339WithOffset(eventData.startDateTime, 'Asia/Manila'),
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: ensureRfc3339WithOffset(eventData.endDateTime, 'Asia/Manila'),
          timeZone: 'Asia/Manila',
        },
        colorId: this.getEventColorId(eventData.eventType),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 day before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      // Add attendees if provided
      if (eventData.attendees && eventData.attendees.length > 0) {
        event.attendees = eventData.attendees.map(email => ({ email }));
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        resource: event,
        sendUpdates: 'all', // Send notifications to all attendees
      });

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error.message || error);
      // Log full response for easier debugging when available
      if (error.response && error.response.data) {
        console.error('Full Google API error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Full error object:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Update a calendar event
   */
  async updateEvent(eventId, eventData, accessToken, refreshToken) {
    try {
      if (!accessToken || !refreshToken) {
        return {
          success: false,
          error: 'Google Calendar not connected. Please connect your Google Calendar in settings.',
        };
      }

      const calendar = this.getCalendarInstance(accessToken, refreshToken);

      const event = {
        summary: eventData.title,
        description: eventData.description || '',
        location: eventData.location || '',
        start: {
          dateTime: ensureRfc3339WithOffset(eventData.startDateTime, 'Asia/Manila'),
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: ensureRfc3339WithOffset(eventData.endDateTime, 'Asia/Manila'),
          timeZone: 'Asia/Manila',
        },
        colorId: this.getEventColorId(eventData.eventType),
      };

      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all',
      });

      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink,
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error.message || error);
      if (error.response && error.response.data) {
        console.error('Full Google API error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Full error object:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId, accessToken, refreshToken) {
    try {
      if (!accessToken || !refreshToken) {
        return {
          success: false,
          error: 'Google Calendar not connected. Please connect your Google Calendar in settings.',
        };
      }

      const calendar = this.getCalendarInstance(accessToken, refreshToken);

      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error.message || error);
      if (error.response && error.response.data) {
        console.error('Full Google API error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Full error object:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get calendar event by ID
   */
  async getEvent(eventId, accessToken, refreshToken) {
    try {
      if (!accessToken || !refreshToken) {
        return {
          success: false,
          error: 'Google Calendar not connected. Please connect your Google Calendar in settings.',
        };
      }

      const calendar = this.getCalendarInstance(accessToken, refreshToken);

      const response = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId,
      });

      return {
        success: true,
        event: response.data,
      };
    } catch (error) {
      console.error('Error getting Google Calendar event:', error.message || error);
      if (error.response && error.response.data) {
        console.error('Full Google API error response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.error('Full error object:', error);
      }
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get color ID based on event type
   */
  getEventColorId(eventType) {
    const colorMap = {
      quiz: '11', // Red
      laboratory: '5', // Yellow
      exam: '9', // Blue
      assignment: '6', // Orange
      project: '10', // Green
      other: '8', // Gray
    };

    return colorMap[eventType] || '8';
  }
}

export default new GoogleCalendarService();
