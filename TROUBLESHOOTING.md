# Google Sheets Export - Troubleshooting Guide

## 🔴 Current Issue: Permission Error

**Error**: `500 Internal Server Error` when clicking "Export to Google Sheets"

**Root Cause**: Service account doesn't have permission to access the hub spreadsheet.

---

## ✅ Quick Fix (Choose One Option)

### Option 1: Share Hub Spreadsheet with Service Account (Recommended)

This allows the system to use the fallback hub spreadsheet when needed.

**Steps**:

1. **Open the Hub Spreadsheet**
   - Go to: https://docs.google.com/spreadsheets/d/1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g/edit
   
2. **Click "Share" Button** (top-right corner)

3. **Add Service Account Email**
   - Enter: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
   - Set permission: **Editor**
   - **Uncheck** "Notify people" (it's a service account, not a person)
   
4. **Click "Share"**

5. **Restart Backend Server**
   ```powershell
   # Stop the server (Ctrl+C in the terminal where it's running)
   # Then start it again:
   cd backend
   npm run dev
   ```

6. **Test Again**
   - Try exporting from the Grade Management page
   - Should work now! ✅

---

### Option 2: Remove Hub Spreadsheet (Alternative)

If you don't want to use a hub spreadsheet, you can remove it from the configuration.

**Steps**:

1. **Edit `.env` File**
   - Open: `backend/.env`
   - Find the line:
     ```env
     EXPORT_HUB_SPREADSHEET_ID=1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g
     ```
   - Change it to (leave it empty):
     ```env
     EXPORT_HUB_SPREADSHEET_ID=
     ```

2. **Save the File**

3. **Restart Backend Server**
   ```powershell
   cd backend
   npm run dev
   ```

4. **Test Again**
   - The system will create new spreadsheets instead of using a hub
   - Each section gets its own file

**Note**: This option means the system won't have a fallback if storage quota is exceeded.

---

## 🧪 Verify the Fix

### Test 1: Run Configuration Test

```powershell
cd backend
node test-google-sheets.js
```

**Expected Output**:
```
✅ Test 1: Environment Variables
   Service Account Email: ✓
   Private Key: ✓
   Project ID: ✓

✅ Test 2: Google Authentication
   JWT Client Created: ✓

✅ Test 3: Authorization
   Authorization Successful: ✓

✅ Test 4: Google Sheets API
   Sheets API Access: ✓
   Test Spreadsheet Title: "..."

✅ Test 5: Google Drive API
   Drive API Access: ✓
   
🎉 All Tests Passed!
```

### Test 2: Try Export from Frontend

1. Go to Grade Management page
2. Select a section with students
3. Click "Export to Google Sheets"
4. Should see: "Class record exported successfully!"
5. Spreadsheet opens in new tab

---

## 📋 Common Issues & Solutions

### Issue: "The caller does not have permission"

**Symptoms**:
- 500 error when exporting
- Backend logs show permission error
- Test script fails at Test 4

**Solutions**:
- ✅ Share hub spreadsheet with service account (Option 1 above)
- ✅ Remove hub spreadsheet from .env (Option 2 above)
- ✅ If using a folder, share folder with service account

---

### Issue: "Google APIs not initialized"

**Symptoms**:
- Backend logs: "Google APIs not initialized"
- Export button doesn't work
- Test script fails at Test 2

**Solutions**:

1. **Check .env File**
   - Verify `GOOGLE_SERVICE_ACCOUNT_EMAIL` is set
   - Verify `GOOGLE_PRIVATE_KEY` is set and properly formatted
   
2. **Check Private Key Format**
   - Should start with: `'-----BEGIN PRIVATE KEY-----\n`
   - Should end with: `\n-----END PRIVATE KEY-----\n'`
   - Should have `\n` (not actual line breaks)
   
3. **Restart Backend Server**

---

### Issue: "Google Sheets API not enabled"

**Symptoms**:
- Error: "API has not been used in project"
- Test script fails with API not enabled error

**Solutions**:

1. **Enable Google Sheets API**
   - Go to: https://console.cloud.google.com/apis/library/sheets.googleapis.com
   - Select project: `grading-system-472908`
   - Click "Enable"
   
2. **Enable Google Drive API**
   - Go to: https://console.cloud.google.com/apis/library/drive.googleapis.com
   - Select project: `grading-system-472908`
   - Click "Enable"
   
3. **Wait 1-2 minutes** for APIs to activate

4. **Restart Backend Server**

---

### Issue: "Access denied to Google Drive"

**Symptoms**:
- Can create spreadsheet but fails to save to folder
- Error mentions folder or drive access

**Solutions**:

1. **If Using Custom Folder**:
   - Open the folder in Google Drive
   - Click "Share"
   - Add: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
   - Permission: Editor
   - Click "Share"

2. **If Using Shared Drive**:
   - Open Shared Drive settings
   - Add service account as Member
   - Role: Manager or Content Manager

3. **Or Remove Folder Configuration**:
   - Edit `backend/.env`
   - Set: `GOOGLE_DRIVE_PARENT_FOLDER_ID=`
   - Files will be created in root Drive

---

### Issue: "Storage quota exceeded"

**Symptoms**:
- Error: "Google Drive storage is full"
- Can't create new spreadsheets

**Solutions**:

1. **Clean Up Old Files**
   - Go to Google Drive
   - Delete old/unnecessary files
   - Empty trash: https://drive.google.com/drive/trash
   
2. **Use Shared Drive** (Separate quota)
   - Create/use a Shared Drive
   - Configure in .env
   
3. **Upgrade Storage**
   - Upgrade Google Workspace plan
   - Add more storage

---

### Issue: Backend Server Not Running

**Symptoms**:
- Frontend shows network error
- `http://localhost:5000` not responding

**Solutions**:

1. **Start Backend Server**
   ```powershell
   cd backend
   npm run dev
   ```

2. **Check for Port Conflicts**
   - Make sure port 5000 is not in use by another app
   - Check backend logs for errors

3. **Verify Database Connection**
   - Make sure MongoDB is running
   - Check `MONGO_URI` in .env

---

## 🔍 Debugging Steps

### Step 1: Check Backend Logs

When you try to export, watch the backend server terminal for error messages. Look for:

```
❌ exportGradesToGoogleSheets error: [error details]
```

### Step 2: Check Browser Console

Open browser DevTools (F12) and look for:
- Red errors in Console tab
- Network tab → Look for the POST request to `/api/grade/export-sheets/`
- Response body may contain error details

### Step 3: Test API Directly

Use the test script to verify configuration:

```powershell
cd backend
node test-google-sheets.js
```

This will show exactly which component is failing.

---

## 🎯 Complete Setup Checklist

Use this checklist to ensure everything is configured correctly:

### Backend Configuration

- [ ] `.env` file exists in `backend/` folder
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` is set
- [ ] `GOOGLE_PRIVATE_KEY` is set (with `\n` for newlines)
- [ ] `GOOGLE_PROJECT_ID` is set
- [ ] Backend server is running (`npm run dev`)
- [ ] MongoDB is running and connected

### Google Cloud Setup

- [ ] Google Sheets API is enabled
- [ ] Google Drive API is enabled
- [ ] Service account exists in project
- [ ] Service account key is valid

### Permissions Setup

- [ ] Hub spreadsheet is shared with service account (if using)
- [ ] Custom folder is shared with service account (if using)
- [ ] Shared Drive has service account as member (if using)

### Test Results

- [ ] `node test-google-sheets.js` passes all tests
- [ ] Can export from Grade Management page
- [ ] Spreadsheet opens automatically
- [ ] File appears in Google Drive

---

## 📞 Still Having Issues?

### Check These Resources:

1. **GOOGLE_SHEETS_SETUP.md** - Complete setup guide
2. **GOOGLE_DRIVE_QUICK_START.md** - Quick reference
3. **ARCHITECTURE.md** - Technical details

### Collect Debug Information:

1. **Backend Logs**
   - Copy full error from terminal where backend is running

2. **Browser Console**
   - Copy full error from browser DevTools console

3. **Test Script Output**
   - Run: `node test-google-sheets.js`
   - Copy full output

4. **Configuration**
   - Check which environment variables are set (don't share actual keys!)
   - Note which optional features you're using (folder, Shared Drive, etc.)

---

## ✅ Solution Summary

**For your current error**, do this:

1. **Share the hub spreadsheet** with service account:
   - Open: https://docs.google.com/spreadsheets/d/1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g/edit
   - Click "Share"
   - Add: `bgs-812@grading-system-472908.iam.gserviceaccount.com`
   - Permission: Editor
   - Uncheck "Notify people"
   - Click "Share"

2. **Restart backend server**

3. **Try exporting again** - should work! 🎉

---

**Last Updated**: October 26, 2025
