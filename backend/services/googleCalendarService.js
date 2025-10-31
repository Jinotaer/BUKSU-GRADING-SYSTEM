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

    // Set credentials if available
    if (process.env.GOOGLE_CALENDAR_REFRESH_TOKEN) {
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_CALENDAR_REFRESH_TOKEN
      });
    }

    this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Create a calendar event
   */
  async createEvent(eventData) {
    try {
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

      const response = await this.calendar.events.insert({
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
  async updateEvent(eventId, eventData) {
    try {
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

      const response = await this.calendar.events.update({
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
  async deleteEvent(eventId) {
    try {
      await this.calendar.events.delete({
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
  async getEvent(eventId) {
    try {
      const response = await this.calendar.events.get({
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

  /**
   * Set access token (used when user authenticates)
   */
  setAccessToken(accessToken) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
    });
  }

  /**
   * Set refresh token
   */
  setRefreshToken(refreshToken) {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });
  }
}

export default new GoogleCalendarService();
