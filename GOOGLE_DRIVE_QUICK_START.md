# Google Drive Export - Quick Start Guide

## ✅ Current Status: **WORKING!** 

Your system already exports to Google Sheets and stores files in Google Drive automatically.

---

## 🚀 How to Use (For Instructors)

### Step 1: Select Section
1. Go to **Grade Management** page
2. Choose a section from the dropdown

### Step 2: Export
1. Click **"Export to Google Sheets"** button
2. Wait for success message
3. Spreadsheet opens automatically in new tab

### Step 3: Access Later
- Find the file in your **Google Drive**
- File name format: `{Subject}_{Section}_{Year}_{Term}`
- Example: `CS101_A_2024-2025_1st`

---

## 📁 Optional: Organize Exports in a Folder

### For Administrators:

**1. Create Folder**
```
• Go to https://drive.google.com
• Click "+ New" → "Folder"
• Name it: "BukSU Class Records"
```

**2. Share with Service Account**
```
• Right-click folder → "Share"
• Add: bgs-812@grading-system-472908.iam.gserviceaccount.com
• Role: Editor
• Uncheck "Notify people"
• Click "Share"
```

**3. Get Folder ID**
```
• Open the folder
• Look at URL: https://drive.google.com/drive/folders/1ABC123xyz
• Copy the ID after "folders/": 1ABC123xyz
```

**4. Update Backend Configuration**
```
• Open: backend/.env
• Find: GOOGLE_DRIVE_PARENT_FOLDER_ID=
• Add folder ID: GOOGLE_DRIVE_PARENT_FOLDER_ID=1ABC123xyz
• Save and restart backend server
```

**Done!** All future exports will go to this folder. 📂

---

## 🔍 How to Find Exported Files

### Method 1: From Notification
- Click the spreadsheet link that opens after export

### Method 2: Search Google Drive
- Go to Google Drive
- Search: Section name or subject code
- Filter by: Spreadsheets

### Method 3: Shared with Me (Instructors)
- Go to "Shared with me" in Google Drive
- Find files shared by service account

### Method 4: Organized Folder (If configured)
- Navigate to the configured parent folder
- Browse all class records in one place

---

## ⚡ Features

✅ **Automatic Formatting** - Professional class record layout  
✅ **Student Roster** - All enrolled students included  
✅ **Activity Scores** - Individual scores per activity  
✅ **Grade Calculations** - Weighted averages based on schema  
✅ **Reuse Existing** - Updates existing file instead of duplicating  
✅ **Auto-Share** - Shared with instructor's email automatically  
✅ **Real-time Data** - Exports current grades from database  

---

## ❓ FAQ

**Q: Where are the files stored?**  
A: In Google Drive, accessible via the service account. If you configure a parent folder, all exports go there.

**Q: Can I edit the spreadsheet?**  
A: Yes! The file is automatically shared with your instructor email with Editor access.

**Q: What if I export multiple times?**  
A: The system reuses the existing file with the same name, so you won't get duplicates.

**Q: Can students see the exported grades?**  
A: No, only the instructor's email is granted access to the spreadsheet.

**Q: What happens if Drive storage is full?**  
A: The system falls back to adding a new tab in the hub spreadsheet instead of creating a new file.

**Q: How do I organize old class records?**  
A: Create folders in Google Drive and move older files to archive folders manually.

---

## 🛠️ Admin Commands

### Restart Backend (After Config Changes)
```powershell
# Navigate to backend folder
cd backend

# Stop server (Ctrl+C if running)

# Start server
npm run dev
```

### Check if APIs are Enabled
```
Visit: https://console.cloud.google.com/apis/dashboard
Project: grading-system-472908

Required APIs:
✅ Google Sheets API
✅ Google Drive API
```

### Test Service Account Access
```
1. Go to Google Drive
2. Search for files owned by: bgs-812@grading-system-472908.iam.gserviceaccount.com
3. If you see files, it's working!
```

---

## 🎯 Key Files

| File | Purpose |
|------|---------|
| `backend/.env` | Configuration (API keys, folder IDs) |
| `backend/services/googleApiService.js` | Google API integration logic |
| `backend/controller/gradeController.js` | Export endpoint handler |
| `frontend/src/component/instructor/gradeManagement.jsx` | Export UI button |

---

## 📞 Need Help?

Check these files for detailed information:
- **GOOGLE_SHEETS_SETUP.md** - Complete setup guide
- **Backend logs** - Console output shows detailed errors
- **Google Cloud Console** - Check API usage and quotas

---

## ✨ That's It!

Your Google Sheets export is **fully configured and working**. Just click the button and it works! 🎉

For better organization, follow the optional folder setup above. Otherwise, enjoy the automatic exports! 📊
