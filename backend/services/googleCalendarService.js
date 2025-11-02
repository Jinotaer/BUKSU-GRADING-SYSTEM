import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

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
          dateTime: eventData.startDateTime,
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: eventData.endDateTime,
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
      console.error('Error creating Google Calendar event:', error);
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
          dateTime: eventData.startDateTime,
          timeZone: 'Asia/Manila',
        },
        end: {
          dateTime: eventData.endDateTime,
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
      console.error('Error updating Google Calendar event:', error);
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
      console.error('Error deleting Google Calendar event:', error);
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
      console.error('Error getting Google Calendar event:', error);
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
