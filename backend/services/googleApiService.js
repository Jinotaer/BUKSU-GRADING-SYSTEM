// services/googleApiService.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class GoogleApiService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.drive = null;
    this.initializeAuth();
  }

  initializeAuth() {
    try {
      // Initialize Google Auth with service account
      this.auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_PROJECT_ID,
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/drive'
        ],
      });

      // Initialize Google Sheets API
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      
      // Initialize Google Drive API
      this.drive = google.drive({ version: 'v3', auth: this.auth });

      console.log('Google APIs initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Google APIs:', error);
    }
  }

  // Google Sheets Methods
  async createSpreadsheet(title, sheetNames = ['Sheet1']) {
    try {
      const response = await this.sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: title,
          },
          sheets: sheetNames.map(name => ({
            properties: {
              title: name,
            },
          })),
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating spreadsheet:', error);
      throw error;
    }
  }

  async getSpreadsheet(spreadsheetId) {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
      });

      return response.data;
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      throw error;
    }
  }

  async getSheetData(spreadsheetId, range) {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: range,
      });

      return response.data.values || [];
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw error;
    }
  }

  async updateSheetData(spreadsheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        requestBody: {
          values: values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error updating sheet data:', error);
      throw error;
    }
  }

  async appendSheetData(spreadsheetId, range, values) {
    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId,
        range: range,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error appending sheet data:', error);
      throw error;
    }
  }

  async clearSheetData(spreadsheetId, range) {
    try {
      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId: spreadsheetId,
        range: range,
      });

      return response.data;
    } catch (error) {
      console.error('Error clearing sheet data:', error);
      throw error;
    }
  }

  // Google Drive Methods
  async createFolder(name, parentFolderId = null) {
    try {
      const fileMetadata = {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating folder:', error);
      throw error;
    }
  }

  async uploadFile(fileName, filePath, parentFolderId = null, mimeType = 'application/octet-stream') {
    try {
      const fileMetadata = {
        name: fileName,
      };

      if (parentFolderId) {
        fileMetadata.parents = [parentFolderId];
      }

      const media = {
        mimeType: mimeType,
        body: require('fs').createReadStream(filePath),
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
      });

      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  }

  async shareFile(fileId, email, role = 'reader', type = 'user') {
    try {
      const response = await this.drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: role, // 'reader', 'writer', 'owner'
          type: type, // 'user', 'group', 'domain', 'anyone'
          emailAddress: email,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  async getFileList(parentFolderId = null, pageSize = 10) {
    try {
      let query = "mimeType != 'application/vnd.google-apps.folder'";
      
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      }

      const response = await this.drive.files.list({
        q: query,
        pageSize: pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
      });

      return response.data.files || [];
    } catch (error) {
      console.error('Error getting file list:', error);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      const response = await this.drive.files.delete({
        fileId: fileId,
      });

      return response.data;
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  // Utility Methods
  async exportGradesToSpreadsheet(grades, spreadsheetId, sheetName = 'Grades') {
    try {
      // Prepare headers
      const headers = ['Student ID', 'Student Name', 'Subject', 'Grade', 'Date'];
      
      // Prepare data rows
      const rows = grades.map(grade => [
        grade.student?.studid || '',
        grade.student?.fullName || '',
        grade.subject?.subjectName || '',
        grade.finalGrade || '',
        grade.updatedAt ? new Date(grade.updatedAt).toLocaleDateString() : ''
      ]);

      // Combine headers and data
      const values = [headers, ...rows];

      // Update the sheet
      const range = `${sheetName}!A1:E${values.length}`;
      await this.updateSheetData(spreadsheetId, range, values);

      return { success: true, rowsUpdated: values.length };
    } catch (error) {
      console.error('Error exporting grades to spreadsheet:', error);
      throw error;
    }
  }

  async exportStudentsToSpreadsheet(students, spreadsheetId, sheetName = 'Students') {
    try {
      // Prepare headers
      const headers = ['Student ID', 'Full Name', 'Email', 'Year Level', 'College', 'Course', 'Status'];
      
      // Prepare data rows
      const rows = students.map(student => [
        student.studid || '',
        student.fullName || '',
        student.email || '',
        student.yearLevel || '',
        student.college || '',
        student.course || '',
        student.status || ''
      ]);

      // Combine headers and data
      const values = [headers, ...rows];

      // Update the sheet
      const range = `${sheetName}!A1:G${values.length}`;
      await this.updateSheetData(spreadsheetId, range, values);

      return { success: true, rowsUpdated: values.length };
    } catch (error) {
      console.error('Error exporting students to spreadsheet:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new GoogleApiService();