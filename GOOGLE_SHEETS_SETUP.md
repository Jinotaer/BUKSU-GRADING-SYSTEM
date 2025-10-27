# Google Sheets & Drive Export Setup Guide

## 🎯 Overview

Your system is **already configured** to export student grades to Google Sheets and automatically store them in Google Drive! This guide explains how it works and how to optimize the setup.

---

## ✅ What's Already Working

1. **Automatic Export** - Click "Export to Google Sheets" button to create a formatted class record
2. **Google Drive Storage** - All exported spreadsheets are automatically saved to Google Drive
3. **Auto-Open** - The spreadsheet opens in a new browser tab after export
4. **Email Sharing** - The file is automatically shared with the instructor's email
5. **Error Handling** - User-friendly error messages for quota/storage issues

---

## 📋 How It Works

### 1. Export Process Flow

```
User clicks "Export to Google Sheets"
    ↓
Frontend sends request to backend API
    ↓
Backend authenticates with Google Service Account
    ↓
Creates new spreadsheet in Google Drive
    ↓
Formats class record with headers, student data, and grades
    ↓
Shares file with instructor's email
    ↓
Returns spreadsheet URL to frontend
    ↓
Opens spreadsheet in new browser tab
```

### 2. File Storage

- **Location**: Google Drive (accessed via service account)
- **File Name Format**: `{SubjectCode}_{SectionName}_{SchoolYear}_{Term}`
- **Example**: `CS101_A_2024-2025_1st.xlsx`

### 3. Reuse Strategy

- If a spreadsheet with the same name already exists, it will be **reused** instead of creating a duplicate
- This prevents cluttering your Drive with duplicate files

---

## 🔧 Configuration Options

### Option 1: Basic Setup (Current - Already Working)

Files are saved to the **root of the service account's Drive**. No additional configuration needed.

**Pros**: Simple, works immediately  
**Cons**: All files in one location, harder to organize

---

### Option 2: Organized Folder Structure (Recommended)

Store all class records in a **dedicated folder** for better organization.

#### Steps to Set Up:

1. **Create a Folder in Google Drive**
   - Go to https://drive.google.com
   - Click "+ New" → "Folder"
   - Name it: `BukSU Class Records` (or any name you prefer)

2. **Get the Folder ID**
   - Open the folder
   - Copy the ID from the URL:
     ```
     https://drive.google.com/drive/folders/1ABC123xyz-FOLDER-ID-HERE
                                            ↑
                                    Copy this part
     ```

3. **Share Folder with Service Account**
   - Click "Share" on the folder
   - Add email: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
   - Set permission: **Editor**
   - Uncheck "Notify people" (it's a service account)
   - Click "Share"

4. **Update `.env` File**
   ```env
   GOOGLE_DRIVE_PARENT_FOLDER_ID=1ABC123xyz-FOLDER-ID-HERE
   ```

5. **Restart Backend Server**
   ```bash
   npm run dev
   ```

**Result**: All exported spreadsheets will now be saved in this folder! 📁

---

### Option 3: Shared Drive (Team Drive) - For Organizations

Use a **Shared Drive** for team collaboration and better access control.

#### Steps to Set Up:

1. **Create or Use Existing Shared Drive**
   - Go to Google Drive → "Shared drives"
   - Create a new one or use existing

2. **Add Service Account as Member**
   - Open the Shared Drive
   - Click "⚙️ Settings" → "Manage members"
   - Add: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
   - Set role: **Manager** or **Content Manager**

3. **(Optional) Create a Folder Inside Shared Drive**
   - Navigate into the Shared Drive
   - Create a folder: `Class Records`
   - Copy the folder ID from URL

4. **Get Shared Drive ID**
   - Go to the Shared Drive main page
   - Copy the ID from URL:
     ```
     https://drive.google.com/drive/folders/0ABC-SHARED-DRIVE-ID
                                            ↑
                                    Copy this part
     ```

5. **Update `.env` File**
   ```env
   GOOGLE_SHARED_DRIVE_ID=0ABC-SHARED-DRIVE-ID
   GOOGLE_DRIVE_PARENT_FOLDER_ID=1XYZ-FOLDER-ID  # Optional: folder inside Shared Drive
   ```

6. **Restart Backend Server**

**Benefits**:
- Shared access for multiple admins/instructors
- Better file management and permissions
- Organization-wide storage

---

## 🚨 Quota & Storage Handling

### Storage Quota Exceeded

If Google Drive storage is full, the system will:

1. **Show user-friendly error**: "📁 Google Drive storage is full..."
2. **Fallback to Hub Spreadsheet**: Creates a new tab in `EXPORT_HUB_SPREADSHEET_ID`

### Solution Options:

**Option A**: Clean up old files
- Delete or archive old class records
- Empty Google Drive trash

**Option B**: Upgrade storage
- Upgrade Google Workspace plan
- Add more storage to account

**Option C**: Use Shared Drive
- Shared Drives have separate storage quotas
- Better for organizations

---

## 🎨 Spreadsheet Format

Each exported spreadsheet includes:

### Header Section
- University name and contact info
- Section details (code, subject, semester)
- Instructor and administrator info

### Activity Columns
- **Class Standing** (7 activities max)
- **Laboratory** (4 activities max)
- **Major Output** (1 activity)

### Student Rows
- Class number
- Student ID
- Full name
- Individual activity scores
- Category averages
- Final grade (weighted by grading schema)

### Formatting
- ✅ Merged header cells
- ✅ Bold headers
- ✅ Centered text
- ✅ Bordered cells
- ✅ Professional layout

---

## 🧪 Testing the Export

### Test Steps:

1. **Select a Section** with students and activities
2. Click **"Export to Google Sheets"** button
3. Wait for success message: "Class record exported successfully!"
4. Spreadsheet should **open in new tab** automatically
5. **Check Google Drive** - file should be saved in configured location

### Expected Behavior:

✅ New spreadsheet created (or existing one reused)  
✅ File stored in Google Drive  
✅ File shared with instructor's email  
✅ Spreadsheet opens in browser  
✅ Data properly formatted

---

## ⚙️ Environment Variables Reference

```env
# Required - Service Account Credentials
GOOGLE_SERVICE_ACCOUNT_EMAIL=bgs-812@grading-system-472908.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY='-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n'

# Optional - Drive Organization
GOOGLE_DRIVE_PARENT_FOLDER_ID=    # Folder to store exports
GOOGLE_SHARED_DRIVE_ID=           # Shared/Team Drive ID

# Fallback - Hub Spreadsheet
EXPORT_HUB_SPREADSHEET_ID=1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g
```

---

## 🐛 Troubleshooting

### Error: "Access denied to Google Drive"

**Cause**: Service account doesn't have permission to folder/drive

**Fix**:
1. Share folder with: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
2. Grant **Editor** permission
3. Restart backend server

---

### Error: "Google Drive storage is full"

**Cause**: Storage quota exceeded

**Fix Options**:
1. Delete old files from Google Drive
2. Empty trash
3. Upgrade Google Workspace storage
4. Use Shared Drive (separate quota)

---

### Error: "Failed to create spreadsheet"

**Cause**: Invalid credentials or API not enabled

**Fix**:
1. Check `.env` has correct `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY`
2. Verify Google Sheets API is enabled: https://console.cloud.google.com/apis/library/sheets.googleapis.com
3. Verify Google Drive API is enabled: https://console.cloud.google.com/apis/library/drive.googleapis.com
4. Restart backend server

---

### Spreadsheet Opens But No Data

**Cause**: Backend processing error

**Fix**:
1. Check backend logs for errors
2. Verify section has students enrolled
3. Verify activities exist in the section
4. Check activity scores are recorded

---

## 📚 API Reference

### Export Endpoint

```http
POST /api/grade/export-sheets/:sectionId
Authorization: Bearer {instructor_token}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Class record exported to Google Sheets successfully",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/{id}",
  "spreadsheetId": "1ABC123...",
  "title": "CS101_A_2024-2025_1st",
  "sheetName": "Class Record"
}
```

**Response (Quota Error)**:
```json
{
  "error": "STORAGE_QUOTA_EXCEEDED",
  "message": "📁 Google Drive storage is full..."
}
```

---

## 🔐 Security Best Practices

1. **Never commit `.env` file** to Git (already in `.gitignore`)
2. **Keep service account key secure** - treat like a password
3. **Use environment-specific keys** - different keys for dev/production
4. **Regularly rotate service account keys** - annually recommended
5. **Monitor API usage** - check Google Cloud Console for unusual activity

---

## 📞 Support

If you encounter issues:

1. **Check backend logs** - `console.log` statements show detailed error info
2. **Verify API credentials** - ensure service account is properly configured
3. **Test API access** - use Google Cloud Console to test permissions
4. **Check quotas** - verify you haven't exceeded Google API limits

---

## 🎓 Additional Resources

- [Google Sheets API Documentation](https://developers.google.com/sheets/api)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- [Service Account Authentication](https://cloud.google.com/iam/docs/service-accounts)
- [Google API Quotas](https://console.cloud.google.com/apis/dashboard)

---

## ✨ Summary

Your Google Sheets export is **fully functional** and ready to use! 

**Quick Start**: Just click "Export to Google Sheets" - it works out of the box!

**For Better Organization**: Follow "Option 2" to create a dedicated folder.

**For Team Use**: Follow "Option 3" to use a Shared Drive.

Happy grading! 📊✨
