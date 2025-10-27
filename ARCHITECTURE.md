# Google Sheets Export - System Architecture

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Grade Management Page (gradeManagement.jsx)           │    │
│  │                                                          │    │
│  │  1. User selects section                                │    │
│  │  2. User clicks "Export to Google Sheets" button       │    │
│  │  3. Shows loading state                                 │    │
│  │  4. Receives spreadsheet URL                            │    │
│  │  5. Opens spreadsheet in new tab                        │    │
│  │  6. Shows success notification                          │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                ↓ HTTP POST Request
                    /api/grade/export-sheets/:sectionId
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                          BACKEND                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Grade Controller (gradeController.js)                 │    │
│  │                                                          │    │
│  │  1. Authenticate instructor                             │    │
│  │  2. Fetch section data from MongoDB                     │    │
│  │  3. Fetch students from MongoDB                         │    │
│  │  4. Fetch activities from MongoDB                       │    │
│  │  5. Fetch activity scores from MongoDB                  │    │
│  │  6. Organize data by category                           │    │
│  │  7. Call Google API Service                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                ↓                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Google API Service (googleApiService.js)              │    │
│  │                                                          │    │
│  │  1. Initialize Google Auth (JWT)                        │    │
│  │  2. Check if spreadsheet exists (by title)             │    │
│  │  3. Create/Reuse spreadsheet                            │    │
│  │  4. Format class record data                            │    │
│  │  5. Write data to spreadsheet                           │    │
│  │  6. Apply formatting (colors, borders, etc.)           │    │
│  │  7. Share with instructor email                         │    │
│  │  8. Return spreadsheet URL                              │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                ↓ Google API Calls
┌─────────────────────────────────────────────────────────────────┐
│                      GOOGLE CLOUD                                │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Google Sheets API                                      │    │
│  │  - Create spreadsheet                                   │    │
│  │  - Update cell values                                   │    │
│  │  - Format cells (colors, borders, fonts)               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                ↓                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Google Drive API                                       │    │
│  │  - Store file in Drive                                  │    │
│  │  - Set file location (folder/Shared Drive)             │    │
│  │  - Share file with instructor                           │    │
│  │  - Manage permissions                                   │    │
│  └────────────────────────────────────────────────────────┘    │
│                                ↓                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  Google Drive Storage                                   │    │
│  │                                                          │    │
│  │  📁 Root or Custom Folder                               │    │
│  │     📊 CS101_A_2024-2025_1st.xlsx                       │    │
│  │     📊 MATH201_B_2024-2025_2nd.xlsx                     │    │
│  │     📊 ENG301_C_2024-2025_1st.xlsx                      │    │
│  └────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
MongoDB Database                Google APIs                Result
─────────────────              ─────────────              ────────

┌──────────────┐
│   Section    │──┐
│  Collection  │  │
└──────────────┘  │
                  │
┌──────────────┐  │
│   Student    │──┤                                  ┌─────────────┐
│  Collection  │  │                                  │             │
└──────────────┘  │                                  │  Formatted  │
                  │                                  │  Spreadsheet│
┌──────────────┐  │                                  │             │
│   Activity   │──┼─────→ Data Processing ─────→    │   Headers   │
│  Collection  │  │       (Backend)                 │   Sections  │
└──────────────┘  │                                  │   Students  │
                  │                                  │   Grades    │
┌──────────────┐  │       ┌──────────────┐          │             │
│ ActivityScore│──┤       │   Google     │          └─────────────┘
│  Collection  │  │       │    Auth      │                 │
└──────────────┘  │       │    (JWT)     │                 │
                  │       └──────────────┘                 │
┌──────────────┐  │              │                         │
│  Instructor  │──┘              ↓                         │
│  Collection  │          ┌──────────────┐                 │
└──────────────┘          │   Sheets API │                 │
                          │   Create     │─────────────────┤
                          └──────────────┘                 │
                                 │                         │
                          ┌──────────────┐                 │
                          │   Drive API  │                 │
                          │   Store File │←────────────────┘
                          └──────────────┘
                                 │
                                 ↓
                          ┌──────────────┐
                          │ Google Drive │
                          │   Storage    │
                          └──────────────┘
```

---

## 📊 Spreadsheet Structure

```
┌───────────────────────────────────────────────────────────────────┐
│                   BUKIDNON STATE UNIVERSITY                       │
│              Malaybalay City, Bukidnon 8700                       │
│  Tel. (088) 813-5661 to 5663, Telefax (088) 813-2717             │
├───────────────────────────────────────────────────────────────────┤
│                         CLASS RECORD                              │
├───────────────────────────────────────────────────────────────────┤
│ Section Code: CS-A     │ Day: TF                                  │
│ Subject Code: CS101    │ Time: 7:30AM - 10:00AM                   │
│ Descriptive Title: ... │ Rm: Lab 3                                │
│ Semester: 1st          │ Units: 3                                 │
│ School Year: 2024-2025 │ Chair: Dr. Sales G. Aribe, Jr.          │
│ Instructor: John Doe   │ Dean: Dr. Marilou O. Espina             │
├───────────────────────────────────────────────────────────────────┤
│     │      │           │ Class Standing │ Laboratory  │ Major  │  │
│ CL  │  ID  │   NAME    │ 1 2 3 4 5 6 7  │  1 2 3 4   │Output│  │
│ No. │Number│           │(max scores...) │(max scores)│  1   │  │
├─────┼──────┼───────────┼────────────────┼────────────┼──────┤  │
│  1  │2301..│John Smith │95 90 88 92 ... │ 85 90 87...│  92  │  │
│  2  │2302..│Jane Doe   │88 85 90 86 ... │ 90 88 85...│  88  │  │
│  3  │2303..│Bob Wilson │92 94 89 91 ... │ 88 92 90...│  95  │  │
│ ... │ ...  │  ...      │ ... ... ... ...│ ... ... ...│ ...  │  │
└─────┴──────┴───────────┴────────────────┴────────────┴──────┴──┘
```

---

## 🗂️ File Organization Options

### Option 1: Flat Structure (Default)
```
Google Drive (Service Account)
├── 📊 CS101_A_2024-2025_1st.xlsx
├── 📊 MATH201_B_2024-2025_2nd.xlsx
├── 📊 ENG301_C_2024-2025_1st.xlsx
└── 📊 PHY401_D_2024-2025_1st.xlsx
```

### Option 2: Folder Organization (Recommended)
```
Google Drive
└── 📁 BukSU Class Records (GOOGLE_DRIVE_PARENT_FOLDER_ID)
    ├── 📊 CS101_A_2024-2025_1st.xlsx
    ├── 📊 MATH201_B_2024-2025_2nd.xlsx
    ├── 📊 ENG301_C_2024-2025_1st.xlsx
    └── 📊 PHY401_D_2024-2025_1st.xlsx
```

### Option 3: Shared Drive (For Teams)
```
Shared Drive: "BukSU Grading System" (GOOGLE_SHARED_DRIVE_ID)
└── 📁 Class Records (GOOGLE_DRIVE_PARENT_FOLDER_ID)
    ├── 📁 2024-2025 1st Semester
    │   ├── 📊 CS101_A_2024-2025_1st.xlsx
    │   └── 📊 MATH201_B_2024-2025_1st.xlsx
    └── 📁 2024-2025 2nd Semester
        ├── 📊 ENG301_C_2024-2025_2nd.xlsx
        └── 📊 PHY401_D_2024-2025_2nd.xlsx
```

---

## 🔐 Authentication Flow

```
┌─────────────┐
│  Backend    │
│  Server     │
└──────┬──────┘
       │
       │ 1. Load from .env
       ├─────→ GOOGLE_SERVICE_ACCOUNT_EMAIL
       └─────→ GOOGLE_PRIVATE_KEY
       │
       │ 2. Create JWT Client
       ↓
┌──────────────────┐
│  google.auth.JWT │
│                  │
│  • email         │
│  • privateKey    │
│  • scopes        │
└────────┬─────────┘
         │
         │ 3. Authorize
         ↓
┌─────────────────────┐
│  Google OAuth 2.0   │
│  Token Server       │
└──────────┬──────────┘
           │
           │ 4. Return Access Token
           ↓
┌─────────────────────────┐
│  Authenticated Session  │
│                         │
│  • Sheets API enabled   │
│  • Drive API enabled    │
└─────────────────────────┘
```

---

## ⚙️ Environment Variables Map

```
Backend (.env)                      Purpose
────────────────────────────────── ─────────────────────────────
GOOGLE_SERVICE_ACCOUNT_EMAIL    → Service account identifier
GOOGLE_PRIVATE_KEY              → Authentication key (JWT)
GOOGLE_PROJECT_ID               → GCP project identifier

GOOGLE_DRIVE_PARENT_FOLDER_ID   → Target folder for exports
GOOGLE_SHARED_DRIVE_ID          → Shared/Team Drive ID
EXPORT_HUB_SPREADSHEET_ID       → Fallback spreadsheet

                    ↓
         ┌──────────────────────┐
         │   googleApiService   │
         │   Initialization     │
         └──────────────────────┘
                    ↓
         ┌──────────────────────┐
         │  Google APIs Ready   │
         │  • Sheets            │
         │  • Drive             │
         └──────────────────────┘
```

---

## 🚨 Error Handling Flow

```
Export Request
      ↓
┌─────────────────────────┐
│ Try: Create Spreadsheet │
└───────────┬─────────────┘
            │
            ├─ Success ─────────────→ ✅ Export complete
            │
            └─ Error
                │
                ├─ Storage Quota Exceeded
                │       ↓
                │  Fallback: Use Hub Spreadsheet
                │       ↓
                │  Create new tab in existing file
                │       ↓
                │  ✅ Export complete (fallback)
                │
                ├─ Permission Denied
                │       ↓
                │  ❌ Show: "Access denied to Google Drive"
                │       ↓
                │  💡 Solution: Share folder with service account
                │
                ├─ API Not Enabled
                │       ↓
                │  ❌ Show: "Google API not enabled"
                │       ↓
                │  💡 Solution: Enable APIs in Cloud Console
                │
                └─ Network Error
                        ↓
                   ❌ Show: "Network connection issue"
                        ↓
                   💡 Solution: Check internet connection
```

---

## 📈 Performance Characteristics

### Export Speed
- **Small Section** (1-20 students): ~2-3 seconds
- **Medium Section** (21-50 students): ~3-5 seconds
- **Large Section** (51-100 students): ~5-8 seconds

### API Quotas (Google Free Tier)
- **Reads**: 100 requests per 100 seconds per user
- **Writes**: 100 requests per 100 seconds per user
- **Storage**: 15 GB (personal) or Unlimited (Workspace)

### Optimization Features
- ✅ Batch API calls (single update for all data)
- ✅ Reuse existing files (reduces API calls)
- ✅ Caching spreadsheet metadata
- ✅ Parallel data fetching from MongoDB

---

## 🎯 Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **UI Button** | `gradeManagement.jsx` | Triggers export |
| **API Route** | `gradeRoutes.js` | Defines endpoint |
| **Controller** | `gradeController.js` | Orchestrates export |
| **Service** | `googleApiService.js` | Google API logic |
| **Models** | `models/*.js` | Data schemas |
| **Config** | `.env` | API credentials |

---

## 🔍 Debug Checklist

If export fails, check in this order:

1. ✅ **Environment Variables** - Are they set correctly?
2. ✅ **APIs Enabled** - Sheets & Drive APIs in Cloud Console?
3. ✅ **Service Account** - Email correct in .env?
4. ✅ **Private Key** - Valid and properly formatted?
5. ✅ **Folder Permissions** - Service account has Editor access?
6. ✅ **Storage Quota** - Drive has available space?
7. ✅ **Network** - Server can reach Google APIs?
8. ✅ **Section Data** - Section has students and activities?

---

## 📚 Related Files

- `GOOGLE_SHEETS_SETUP.md` - Complete setup guide
- `GOOGLE_DRIVE_QUICK_START.md` - Quick reference
- `test-google-sheets.js` - Test script
- `backend/services/googleApiService.js` - Implementation
- `backend/controller/gradeController.js` - Export logic

---

This architecture provides a robust, scalable solution for exporting class records to Google Sheets with automatic Drive storage! 🚀
