# 🚨 URGENT FIX: Export to Google Sheets Error

## Current Error
```
500 Internal Server Error
"The caller does not have permission"
```

---

## ✅ SOLUTION (Takes 2 Minutes)

### Step 1: Open Hub Spreadsheet

Click this link:
👉 https://docs.google.com/spreadsheets/d/1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g/edit

---

### Step 2: Share with Service Account

1. **Click the "Share" button** (top-right corner of Google Sheets)

2. **In the "Add people and groups" field, paste this email:**
   ```
   bgs-812@grading-system-472908.iam.gserviceaccount.com
   ```

3. **Set permission to "Editor"** (use dropdown next to email field)

4. **IMPORTANT: Uncheck "Notify people"** ✅
   (It's a service account, not a real person)

5. **Click "Share" or "Send"**

---

### Step 3: Restart Backend Server

In your terminal where the backend is running:

1. **Stop the server**: Press `Ctrl+C`

2. **Start it again**:
   ```powershell
   cd backend
   npm run dev
   ```

---

### Step 4: Test Export

1. Go to **Grade Management** page in your browser
2. Select a section with students
3. Click **"Export to Google Sheets"**
4. ✅ Should work now!

---

## 🧪 Verify Fix (Optional)

Run this test to confirm everything is working:

```powershell
cd backend
node test-google-sheets.js
```

**Expected output:**
```
🎉 All Tests Passed!
```

---

## ❓ Alternative: Don't Use Hub Spreadsheet

If you don't want to share the hub spreadsheet, you can disable it:

1. **Edit file**: `backend/.env`

2. **Find this line**:
   ```env
   EXPORT_HUB_SPREADSHEET_ID=1DDKXYakqgSDGSTwG1-T3ey6EmIF9X_gv3IN6i4p3C7g
   ```

3. **Change to** (remove the ID):
   ```env
   EXPORT_HUB_SPREADSHEET_ID=
   ```

4. **Save and restart backend server**

**Note**: Without hub spreadsheet, the system creates individual files for each section (which is fine for most cases).

---

## 📊 What's a Hub Spreadsheet?

It's a fallback spreadsheet used when:
- Google Drive storage is full
- Too many files have been created
- System needs to consolidate exports

Instead of creating a new file, it creates a new tab in the hub spreadsheet.

---

## 🎯 Why This Error Happened

The test script tried to access the hub spreadsheet to verify permissions, but the service account doesn't have access to it yet. This is normal for first-time setup.

Once you share the spreadsheet (or remove the hub ID), everything will work perfectly!

---

## 📞 Need Help?

See **TROUBLESHOOTING.md** for detailed debugging steps.
