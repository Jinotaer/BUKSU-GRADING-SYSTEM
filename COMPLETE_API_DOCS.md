# BUKSU Grading System API Documentation

## 🎓 Project Overview

The **BUKSU Grading System** is a comprehensive web-based platform designed for Bukidnon State University to manage academic grading, student enrollment, and course administration. The system supports three user roles (Admin, Instructor, Student) with role-based access control, Google OAuth authentication, and comprehensive grade management features including activity tracking, section management, data export capabilities, AI-powered content generation, Google Calendar integration, monitoring and audit logging, and advanced security features.

### 🌟 Key Features
- **Multi-role Authentication**: Google OAuth for Students/Instructors, JWT for Admins
- **Comprehensive Grade Management**: Activities, scores, automated calculations
- **Google Services Integration**: Sheets export, Calendar scheduling
- **AI-Powered Tools**: Gemini AI for content generation and educational assistance
- **Advanced Security**: Brute-force protection, audit logging, session management
- **Real-time Monitoring**: System health, user activities, security events
- **Lock Management**: Prevents concurrent editing conflicts
- **Archive Management**: Soft delete functionality for data retention
- **Schedule Management**: Automated schedule creation from activities
- **Export Capabilities**: Multiple format support (Google Sheets, CSV, PDF)

## 🔒 Security & Authentication Framework

### Authentication Methods
- **Google OAuth 2.0**: Primary authentication method for Students and Instructors
- **JWT Tokens**: Used for session management and API authorization  
- **Admin Authentication**: Email/password with enhanced security
- **Role-based Access Control**: Admin, Instructor, Student permissions

### Security Features
- **Brute Force Protection**: Account lockouts after failed attempts
- **Rate Limiting**: AI services and authentication endpoints
- **Audit Logging**: Comprehensive activity tracking
- **Session Management**: Secure token handling and expiration
- **Email Domain Validation**: Institutional email enforcement
- **Resource Locking**: Prevents concurrent editing conflicts

### Token Usage
Include JWT tokens in requests:
```http
Authorization: Bearer your_jwt_token_here
```

### Token Expiration
- **Student/Instructor tokens**: 7 days
- **Admin tokens**: 24 hours (configurable)
- **Refresh tokens**: Available for admins

---

## 👥 User Roles and Permissions

### 🛡️ Admin Role
**Full System Control:**
- Manage all users (Students, Instructors, Admins)
- Create and manage academic structures (semesters, subjects, sections)
- Invite instructors and approve students
- Access comprehensive system analytics and reports
- Archive/unarchive all records
- Manage system locks and monitoring
- Configure system settings and security

### 👨‍🏫 Instructor Role
**Academic Management:**
- View and manage assigned sections
- Create and manage activities/assignments
- Input and update student grades and scores
- Export grades to Google Sheets and other formats
- Manage student enrollment in sections
- Connect and sync with Google Calendar
- Search and invite students to sections
- View comprehensive student analytics

### 🎓 Student Role
**Academic Access:**
- Register for platform access
- View enrolled sections and subjects
- Check grades, activity scores, and feedback
- View activity details, deadlines, and schedules
- Hide/unhide sections from personal dashboard
- Update personal profile information
- Access academic calendar and schedules

---

## 📋 API Modules and Endpoints Summary

### 🔐 Authentication Module
- `POST /api/auth/login` - Email/userType login with brute-force protection
- `GET /api/auth/google` - Google OAuth initiation
- `GET /api/auth/google/callback` - Google OAuth callback handler
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/logout` - User logout and session termination
- `GET /api/auth/status` - Check authentication status
- `POST /api/auth/validate-email` - Validate institutional email domains

### 👥 Admin Management Module
- `POST /api/admin/login` - Admin authentication
- `POST /api/admin/refresh-token` - JWT token refresh
- `GET /api/admin/profile` - Admin profile management
- `GET /api/admin/dashboard/stats` - Administrative dashboard statistics
- `POST /api/admin/logout` - Admin logout

**User Management:**
- `POST /api/admin/instructors/invite` - Invite new instructors
- `POST /api/admin/instructors/invite/bulk` - Bulk invite instructors
- `GET /api/admin/instructors` - List all instructors
- `DELETE /api/admin/instructors/:id` - Delete instructor
- `PUT /api/admin/instructors/:id/archive` - Archive instructor
- `PUT /api/admin/instructors/:id/unarchive` - Unarchive instructor

**Student Management:**
- `GET /api/admin/students` - List all students
- `PUT /api/admin/students/:id/status` - Update student status
- `DELETE /api/admin/students/:id` - Delete student
- `PUT /api/admin/students/:id/archive` - Archive student
- `PUT /api/admin/students/:id/unarchive` - Unarchive student

**Academic Structure Management:**
- `GET /api/admin/semesters` - List semesters
- `POST /api/admin/semesters` - Create semester
- `PUT /api/admin/semesters/:id` - Update semester
- `DELETE /api/admin/semesters/:id` - Delete semester
- `PUT /api/admin/semesters/:id/archive` - Archive semester
- `PUT /api/admin/semesters/:id/unarchive` - Unarchive semester

- `GET /api/admin/subjects` - List subjects
- `POST /api/admin/subjects` - Create subject
- `PUT /api/admin/subjects/:id` - Update subject
- `DELETE /api/admin/subjects/:id` - Delete subject
- `POST /api/admin/subjects/:id/assign-instructor` - Assign instructor to subject
- `PUT /api/admin/subjects/:id/archive` - Archive subject
- `PUT /api/admin/subjects/:id/unarchive` - Unarchive subject

- `GET /api/admin/sections` - List sections
- `GET /api/admin/sections/:id` - Get section details
- `POST /api/admin/sections` - Create section
- `PUT /api/admin/sections/:id` - Update section
- `DELETE /api/admin/sections/:id` - Delete section
- `POST /api/admin/sections/:id/invite-students` - Invite students to section
- `GET /api/admin/sections/:id/students` - Get section students
- `DELETE /api/admin/sections/:id/remove-student` - Remove student from section
- `PUT /api/admin/sections/:id/archive` - Archive section
- `PUT /api/admin/sections/:id/unarchive` - Unarchive section

### 🎓 Student Management Module
- `POST /api/student/register` - Student registration
- `POST /api/student/register/bulk` - Bulk student registration
- `GET /api/student/profile` - Get student profile
- `PUT /api/student/profile` - Update student profile
- `GET /api/student/sections` - Get enrolled sections
- `GET /api/student/grades` - Get student grades
- `GET /api/student/available-subjects` - Get available subjects for enrollment
- `PUT /api/student/sections/:id/hide` - Hide section from view
- `PUT /api/student/sections/:id/unhide` - Unhide section
- `GET /api/student/sections/hidden` - Get hidden sections
- `GET /api/students/search` - Search students (instructor use)

### 👨‍🏫 Instructor Management Module
- `GET /api/instructor/profile` - Get instructor profile
- `PUT /api/instructor/profile` - Update instructor profile
- `GET /api/instructor/dashboard/stats` - Instructor dashboard statistics
- `GET /api/instructor/sections` - Get assigned sections
- `GET /api/instructor/sections/:id/students` - Get students in section
- `POST /api/instructor/sections/:id/enroll-student` - Enroll student
- `DELETE /api/instructor/sections/:id/remove-student` - Remove student
- `POST /api/instructor/sections/:id/invite-students` - Invite students to section
- `GET /api/instructor/available-students` - Get available students
- `GET /api/instructor/search-students` - Search students
- `PUT /api/instructor/sections/:id/grading-schema` - Update grading schema

### 📝 Activity Management Module
- `POST /api/instructor/subjects/:id/activities` - Create activity
- `GET /api/instructor/sections/:id/activities` - Get section activities
- `GET /api/instructor/subjects/:id/activities` - Get subject activities
- `PUT /api/instructor/activities/:id` - Update activity
- `DELETE /api/instructor/activities/:id` - Delete activity
- `PATCH /api/instructor/activities/:id/toggle` - Toggle activity status

### 📊 Activity Scores Module
- `GET /api/activityScores/activities/:id/scores` - Get activity scores
- `POST /api/instructor/activities/:id/scores` - Bulk update activity scores

### 📈 Grade Management Module
- `POST /api/grade` - Add or update grade
- `GET /api/grade/section/:id` - Get section grades

### 📤 Export Module
- `POST /api/export/google-sheets/:sectionId` - Export to Google Sheets (Class Record)
- `POST /api/export/final-grade/:sectionId` - Export final grades (Hybrid-Flexible Learning Grade Sheet)

### 🔒 Lock Management Module
- `POST /api/locks/acquire` - Acquire resource lock
- `POST /api/locks/heartbeat` - Maintain lock heartbeat
- `POST /api/locks/release` - Release resource lock
- `GET /api/locks/:id` - Get lock status
- `POST /api/locks/check-batch` - Batch check locks
- `POST /api/locks/cleanup` - Clean up expired locks

### 📅 Schedule Management Module
- `GET /api/schedule/instructor/schedules` - Get instructor schedules
- `GET /api/schedule/student/schedules` - Get student schedules
- `GET /api/schedule/upcoming` - Get upcoming schedules
- `GET /api/schedule/:id` - Get schedule details
- `PUT /api/schedule/:id` - Update schedule
- `DELETE /api/schedule/:id` - Delete schedule

### 📅 Google Calendar Integration
- `GET /api/google-calendar/auth-url` - Get Google Calendar OAuth URL
- `GET /api/google-calendar/callback` - Handle OAuth callback
- `GET /api/google-calendar/status` - Check connection status
- `POST /api/google-calendar/disconnect` - Disconnect calendar

### 🔍 Monitoring Module
- `GET /api/monitoring/logs` - Get activity logs
- `GET /api/monitoring/activities` - Get activity logs (legacy)
- `GET /api/monitoring/logs/export` - Export logs
- `GET /api/monitoring/security-events` - Get security events
- `GET /api/monitoring/stats` - Get monitoring statistics
- `GET /api/monitoring/user-stats` - Get user statistics
- `GET /api/monitoring/health` - Get system health
- `DELETE /api/monitoring/logs/cleanup` - Clean up old logs

### 🤖 AI Service Module
- `POST /api/ai/generate` - Generate AI content with rate limiting

### 🏫 Academic Structure Modules

**Semesters:**
- `GET /api/semesters` - List semesters
- `POST /api/semesters` - Create semester (admin only)

**Subjects:**
- `GET /api/subjects` - List subjects
- `GET /api/subjects/semester/:id` - Get subjects by semester
- `GET /api/subjects/assigned` - Get assigned subjects (instructor)
- `POST /api/subjects` - Create subject (admin only)
- `POST /api/subjects/bulk` - Bulk create subjects (admin only)
- `PUT /api/subjects/:id` - Update subject (admin only)
- `DELETE /api/subjects/:id` - Delete subject (admin only)
- `POST /api/subjects/:id/assign-instructor` - Assign instructor (admin only)

**Sections:**
- `GET /api/section` - Get all sections
- `GET /api/section/instructor/my-sections` - Get instructor's sections
- `GET /api/section/subjects-with-multiple-instructors` - Get subjects with multiple instructors
- `POST /api/section` - Create section
- `PUT /api/section/:id` - Update section
- `DELETE /api/section/:id` - Delete section
- `POST /api/section/:id/recalculate-grades` - Recalculate section grades

## 🔐 Authentication API Module

### Base URL: `/api/auth`

**Response Codes:**
| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input provided |
| 401 | Unauthorized | Invalid or missing authentication token |
| 403 | Forbidden | Insufficient permissions |
| 423 | Locked | Account temporarily locked |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server encountered an error |

---

#### POST `/api/auth/login`
**Description:** Authenticate user with email and user type
**Access:** Public with brute-force protection
**Middleware:** `bruteForceProtection`, `universalAuditLogger`

**Request Body:**
```json
{
  "email": "user@student.buksu.edu.ph",
  "userType": "student"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "user@student.buksu.edu.ph",
    "role": "student",
    "fullName": "John Doe"
  }
}
```

**Error Response (423 Locked):**
```json
{
  "success": false,
  "message": "Account temporarily locked",
  "locked": true,
  "timeUntilUnlock": 7200000
}
```

---

#### POST `/api/auth/validate-email`
**Description:** Validate institutional email domain
**Access:** Public

**Request Body:**
```json
{
  "email": "user@student.buksu.edu.ph",
  "userType": "student"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email domain is valid",
  "domain": "@student.buksu.edu.ph"
}
```

---

#### GET `/api/auth/google`
**Description:** Initiate Google OAuth authentication
**Access:** Public

**Response:** 302 Redirect to Google OAuth consent screen

---

#### GET `/api/auth/google/callback`
**Description:** Handle Google OAuth callback
**Access:** Public (callback from Google)

**Query Parameters:**
- `code`: OAuth authorization code from Google
- `state`: CSRF protection state parameter

**Response:** 302 Redirect to dashboard with JWT token

---

#### GET `/api/auth/me`
**Description:** Get current authenticated user information
**Access:** Private (requires authentication)
**Middleware:** `verifyGoogleAuthToken`, `universalAuditLogger`

**Headers:**
```http
Authorization: Bearer your_jwt_token
```

**Response (200 OK):**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@domain.com",
    "role": "student",
    "fullName": "John Doe",
    "status": "Approved"
  }
}
```

---

#### POST `/api/auth/logout`
**Description:** Logout user and destroy session
**Access:** Private
**Middleware:** `universalAuditLogger`

**Request Body:**
```json
{
  "token": "jwt_token_to_invalidate"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

#### GET `/api/auth/status`
**Description:** Check current authentication status
**Access:** Public

**Response (200 OK):**
```json
{
  "success": true,
  "authenticated": true,
  "user": {
    "role": "student",
    "email": "user@domain.com"
  }
}
```

---

## 🛡️ Admin Management API Module

### Base URL: `/api/admin`

**Response Codes:**
| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input provided |
| 401 | Unauthorized | Invalid or missing admin token |
| 403 | Forbidden | Insufficient admin privileges |
| 409 | Conflict | Resource already exists |
| 423 | Locked | Account temporarily locked |
| 500 | Internal Server Error | Server encountered an error |

---

### Authentication Endpoints

#### POST `/api/admin/login`
**Description:** Admin authentication with brute-force protection
**Access:** Public with brute-force protection
**Middleware:** `bruteForceProtection`, `universalAuditLogger`

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "admin_id",
    "email": "admin@buksu.edu.ph",
    "fullName": "System Administrator",
    "role": "Admin"
  }
}
```

---

#### POST `/api/admin/refresh-token`
**Description:** Refresh admin JWT token
**Access:** Public (with valid refresh token)

**Request Body:**
```json
{
  "refreshToken": "refresh_token_here"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "accessToken": "new_jwt_token",
  "refreshToken": "new_refresh_token"
}
```

---

#### POST `/api/admin/logout`
**Description:** Admin logout and session termination
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### Profile Management

#### GET `/api/admin/profile`
**Description:** Get admin profile information
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "admin": {
    "id": "admin_id",
    "email": "admin@buksu.edu.ph",
    "fullName": "System Administrator",
    "role": "Admin",
    "lastLogin": "2024-11-26T10:30:00.000Z"
  }
}
```

---

### Dashboard

#### GET `/api/admin/dashboard/stats`
**Description:** Get comprehensive dashboard statistics
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "totalInstructors": 25,
    "totalSections": 30,
    "pendingApprovals": 5,
    "activeSemesters": 1,
    "totalSubjects": 45,
    "activeActivities": 120,
    "systemHealth": "Good"
  }
}
```

---

### Password Reset

#### POST `/api/admin/request-reset-password`
**Description:** Request password reset code
**Access:** Public

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Reset code sent to email"
}
```

---

#### POST `/api/admin/verify-reset-code`
**Description:** Verify password reset code
**Access:** Public

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph",
  "code": "123456"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Code verified successfully",
  "resetToken": "reset_token_here"
}
```

---

#### POST `/api/admin/reset-password`
**Description:** Reset admin password with verified code
**Access:** Public

**Request Body:**
```json
{
  "resetToken": "reset_token_here",
  "newPassword": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

---

### Instructor Management

#### POST `/api/admin/instructors/invite`
**Description:** Invite new instructor to platform
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "email": "instructor@gmail.com",
  "fullName": "Dr. Jane Smith",
  "college": "College of Engineering and Information Technology",
  "department": "Computer Science Department",
  "instructorid": "CEIT-CS-2024-001"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Instructor invited successfully",
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Dr. Jane Smith",
    "college": "College of Engineering and Information Technology",
    "department": "Computer Science Department",
    "status": "Active"
  }
}
```

---

#### POST `/api/admin/instructors/invite/bulk`
**Description:** Bulk invite multiple instructors
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "instructors": [
    {
      "email": "instructor1@gmail.com",
      "fullName": "Dr. John Doe",
      "college": "College of Engineering",
      "department": "Computer Science",
      "instructorid": "ENG-CS-001"
    },
    {
      "email": "instructor2@gmail.com",
      "fullName": "Dr. Jane Doe",
      "college": "College of Engineering",
      "department": "Information Technology",
      "instructorid": "ENG-IT-001"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Instructors invited successfully",
  "invited": 2,
  "failed": 0,
  "details": [...]
}
```

---

#### GET `/api/admin/instructors`
**Description:** Get all instructors with pagination and filtering
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (Active, Archived)
- `college`: Filter by college
- `search`: Search by name or email

**Response (200 OK):**
```json
{
  "success": true,
  "instructors": [
    {
      "id": "instructor_id",
      "email": "instructor@gmail.com",
      "fullName": "Dr. Jane Smith",
      "college": "College of Engineering",
      "department": "Computer Science",
      "status": "Active",
      "assignedSections": 3
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalItems": 25,
    "hasNextPage": true
  }
}
```

---

#### DELETE `/api/admin/instructors/:instructorId`
**Description:** Delete instructor account
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Instructor deleted successfully"
}
```

---

#### PUT `/api/admin/instructors/:instructorId/archive`
**Description:** Archive instructor account
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Instructor archived successfully"
}
```

---

#### PUT `/api/admin/instructors/:instructorId/unarchive`
**Description:** Unarchive instructor account
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Instructor unarchived successfully"
}
```

---

### Student Management

#### GET `/api/admin/students`
**Description:** Get all students with pagination and filtering
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (Approved, Pending, Rejected)
- `college`: Filter by college
- `yearLevel`: Filter by year level
- `search`: Search by name or student ID

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "2024-001",
      "email": "student@student.buksu.edu.ph",
      "fullName": "John Doe",
      "college": "College of Engineering",
      "course": "Computer Science",
      "yearLevel": "3rd Year",
      "status": "Approved"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 15,
    "totalItems": 150
  }
}
```

---

#### PUT `/api/admin/students/:studentId/status`
**Description:** Update student approval status
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "status": "Approved"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student status updated successfully",
  "student": {
    "id": "student_id",
    "status": "Approved"
  }
}
```

---

### Academic Structure Management

#### GET `/api/admin/semesters`
**Description:** Get all semesters with pagination
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (Active, Archived)

**Response (200 OK):**
```json
{
  "success": true,
  "semesters": [
    {
      "id": "semester_id",
      "semesterName": "First Semester 2024-2025",
      "academicYear": "2024-2025",
      "startDate": "2024-08-01T00:00:00.000Z",
      "endDate": "2024-12-15T23:59:59.000Z",
      "status": "Active"
    }
  ]
}
```

---

#### POST `/api/admin/semesters`
**Description:** Create new semester
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "semesterName": "Second Semester 2024-2025",
  "academicYear": "2024-2025",
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-05-31T23:59:59.000Z"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Semester created successfully",
  "semester": {
    "id": "new_semester_id",
    "semesterName": "Second Semester 2024-2025",
    "academicYear": "2024-2025",
    "status": "Active"
  }
}
```

---

#### PUT `/api/admin/semesters/:id`
**Description:** Update semester (with lock protection)
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `requireLock('semester')`, `universalAuditLogger`

**Request Body:**
```json
{
  "semesterName": "Updated Semester Name",
  "startDate": "2025-01-06T00:00:00.000Z",
  "endDate": "2025-05-31T23:59:59.000Z"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Semester updated successfully",
  "semester": {
    "id": "semester_id",
    "semesterName": "Updated Semester Name",
    "status": "Active"
  }
}
```

---

#### DELETE `/api/admin/semesters/:id`
**Description:** Delete semester (with lock protection)
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `requireLock('semester')`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Semester deleted successfully"
}
```

---

#### PUT `/api/admin/semesters/:id/archive`
**Description:** Archive semester (with lock protection)
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `requireLock('semester')`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Semester archived successfully"
}
```

---

#### PUT `/api/admin/semesters/:id/unarchive`
**Description:** Unarchive semester
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Semester unarchived successfully"
}
```

---

#### GET `/api/admin/subjects`
**Description:** Get all subjects with pagination and filtering
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Query Parameters:**
- `page`: Page number
- `limit`: Items per page
- `semesterId`: Filter by semester
- `status`: Filter by status

**Response (200 OK):**
```json
{
  "success": true,
  "subjects": [
    {
      "id": "subject_id",
      "subjectCode": "CS101",
      "subjectName": "Introduction to Programming",
      "credits": 3,
      "semester": {
        "id": "semester_id",
        "semesterName": "First Semester 2024-2025"
      },
      "assignedInstructors": []
    }
  ]
}
```

---

#### POST `/api/admin/subjects`
**Description:** Create new subject
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "subjectCode": "CS102",
  "subjectName": "Data Structures and Algorithms",
  "credits": 3,
  "semesterId": "semester_id",
  "description": "Introduction to fundamental data structures"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Subject created successfully",
  "subject": {
    "id": "new_subject_id",
    "subjectCode": "CS102",
    "subjectName": "Data Structures and Algorithms",
    "credits": 3
  }
}
```

---

#### PUT `/api/admin/subjects/:id`
**Description:** Update subject (with lock protection)
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `requireLock('subject')`, `universalAuditLogger`

---

#### DELETE `/api/admin/subjects/:id`
**Description:** Delete subject (with lock protection)
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `requireLock('subject')`, `universalAuditLogger`

---

#### POST `/api/admin/subjects/:subjectId/assign-instructor`
**Description:** Assign instructor to subject
**Access:** Private (Admin only)
**Middleware:** `adminAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "instructorId": "instructor_id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Instructor assigned to subject successfully"
}
```

---

## 🎓 Student Management API Module

### Base URL: `/api/student` and `/api/students`

**Response Codes:**
| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Student registered successfully |
| 400 | Bad Request | Invalid student data provided |
| 401 | Unauthorized | Invalid or missing student token |
| 403 | Forbidden | Student account not approved |
| 404 | Not Found | Student not found |
| 409 | Conflict | Student already exists |
| 500 | Internal Server Error | Server encountered an error |

---

### Student Registration and Profile

#### POST `/api/student/register`
**Description:** Register new student account
**Access:** Public
**Middleware:** `universalAuditLogger`

**Request Body:**
```json
{
  "email": "student@student.buksu.edu.ph",
  "studid": "BUKSU-2024-001234",
  "fullName": "Juan Miguel Dela Cruz",
  "college": "College of Engineering and Information Technology",
  "course": "Bachelor of Science in Computer Science",
  "yearLevel": "3rd Year"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student registration successful. Your account has been automatically approved.",
  "student": {
    "id": "student_id",
    "studid": "BUKSU-2024-001234",
    "email": "student@student.buksu.edu.ph",
    "fullName": "Juan Miguel Dela Cruz",
    "college": "College of Engineering and Information Technology",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year",
    "status": "Approved"
  }
}
```

**Error Response (409 Conflict):**
```json
{
  "success": false,
  "message": "Student with this email already exists"
}
```

---

#### POST `/api/student/register/bulk`
**Description:** Bulk register multiple students
**Access:** Public (or Admin)
**Middleware:** `universalAuditLogger`

**Request Body:**
```json
{
  "students": [
    {
      "email": "student1@student.buksu.edu.ph",
      "studid": "BUKSU-2024-001",
      "fullName": "Student One",
      "college": "College of Engineering",
      "course": "Computer Science",
      "yearLevel": "1st Year"
    },
    {
      "email": "student2@student.buksu.edu.ph",
      "studid": "BUKSU-2024-002",
      "fullName": "Student Two",
      "college": "College of Engineering",
      "course": "Information Technology",
      "yearLevel": "2nd Year"
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Bulk registration completed",
  "results": {
    "successful": 2,
    "failed": 0,
    "details": [...]
  }
}
```

---

#### GET `/api/student/profile`
**Description:** Get current student profile
**Access:** Private (Student only)
**Middleware:** `studentAuth`, `universalAuditLogger`

**Headers:**
```http
Authorization: Bearer student_jwt_token
```

**Response (200 OK):**
```json
{
  "success": true,
  "student": {
    "id": "student_id",
    "studid": "BUKSU-2024-001234",
    "email": "student@student.buksu.edu.ph",
    "fullName": "Juan Miguel Dela Cruz",
    "college": "College of Engineering and Information Technology",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year",
    "status": "Approved",
    "enrolledSections": 6,
    "lastLogin": "2024-11-26T09:15:00.000Z"
  }
}
```

---

#### PUT `/api/student/profile`
**Description:** Update student profile
**Access:** Private (Student only)
**Middleware:** `studentAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "fullName": "Juan Miguel B. Dela Cruz",
  "yearLevel": "4th Year"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "student": {
    "id": "student_id",
    "fullName": "Juan Miguel B. Dela Cruz",
    "yearLevel": "4th Year"
  }
}
```

---

### Student Academic Data

#### GET `/api/student/sections`
**Description:** Get student's enrolled sections
**Access:** Private (Student only)
**Middleware:** `studentAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_id",
      "sectionName": "CS101-A",
      "subject": {
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming",
        "credits": 3
      },
      "instructor": {
        "fullName": "Dr. Jane Smith",
        "email": "jane.smith@gmail.com"
      },
      "semester": "First Semester 2024-2025",
      "schedule": "MWF 8:00-9:00 AM",
      "isHidden": false
    }
  ]
}
```

---

#### GET `/api/student/grades`
**Description:** Get student's grades and activity scores
**Access:** Private (Student only)
**Middleware:** `studentAuth`, `universalAuditLogger`

**Query Parameters:**
- `sectionId`: Filter by specific section
- `semester`: Filter by semester

**Response (200 OK):**
```json
{
  "success": true,
  "grades": [
    {
      "section": {
        "id": "section_id",
        "sectionName": "CS101-A",
        "subject": "Introduction to Programming"
      },
      "activities": [
        {
          "id": "activity_id",
          "activityName": "Quiz 1",
          "activityType": "Quiz",
          "maxScore": 100,
          "score": 85,
          "percentage": 85,
          "feedback": "Good work!",
          "submittedAt": "2024-11-20T10:00:00.000Z"
        }
      ],
      "grades": {
        "quizzes": 87.5,
        "assignments": 92.0,
        "projects": 88.0,
        "finalExam": 85.0,
        "finalGrade": 88.1,
        "letterGrade": "B+"
      }
    }
  ]
}
```

---

#### GET `/api/student/available-subjects`
**Description:** Get available subjects for enrollment
**Access:** Private (Student only)
**Middleware:** `studentAuth`, `universalAuditLogger`

**Query Parameters:**
- `semesterId`: Filter by semester
- `yearLevel`: Filter by year level

**Response (200 OK):**
```json
{
  "success": true,
  "subjects": [
    {
      "id": "subject_id",
      "subjectCode": "CS102",
      "subjectName": "Data Structures and Algorithms",
      "credits": 3,
      "availableSections": [
        {
          "id": "section_id",
          "sectionName": "CS102-A",
          "instructor": "Dr. John Doe",
          "schedule": "TTh 10:00-11:30 AM",
          "enrolledStudents": 25,
          "maxStudents": 35
        }
      ]
    }
  ]
}
```

---

### Section Visibility Management

#### PUT `/api/student/sections/:id/hide`
**Description:** Hide section from student's view
**Access:** Private (Student only)
**Middleware:** `studentAuth`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Section hidden successfully"
}
```

---

#### PUT `/api/student/sections/:id/unhide`
**Description:** Unhide section for student's view
**Access:** Private (Student only)
**Middleware:** `studentAuth`

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Section unhidden successfully"
}
```

---

#### GET `/api/student/sections/hidden`
**Description:** Get list of hidden sections
**Access:** Private (Student only)
**Middleware:** `studentAuth`

**Response (200 OK):**
```json
{
  "success": true,
  "hiddenSections": [
    {
      "id": "section_id",
      "sectionName": "CS101-B",
      "subject": "Introduction to Programming",
      "hiddenAt": "2024-11-20T14:30:00.000Z"
    }
  ]
}
```

---

### Student Search (For Instructors)

#### GET `/api/students/search`
**Description:** Search students (for instructors to invite to sections)
**Access:** Private (Instructor/Admin)
**Middleware:** `auth`, `universalAuditLogger`

**Query Parameters:**
- `q`: Search query (name, email, student ID)
- `college`: Filter by college
- `course`: Filter by course
- `yearLevel`: Filter by year level
- `status`: Filter by status
- `page`: Page number
- `limit`: Results per page

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "BUKSU-2024-001234",
      "fullName": "Juan Dela Cruz",
      "email": "juan@student.buksu.edu.ph",
      "college": "College of Engineering",
      "course": "Computer Science",
      "yearLevel": "3rd Year",
      "status": "Approved"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalResults": 45
  }
}
```

---

## 👨‍🏫 Instructor Management API Module

### Base URL: `/api/instructor`

**Response Codes:**
| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid instructor data provided |
| 401 | Unauthorized | Invalid or missing instructor token |
| 403 | Forbidden | Instructor account not active |
| 404 | Not Found | Instructor or resource not found |
| 500 | Internal Server Error | Server encountered an error |

---

### Instructor Profile and Dashboard

#### GET `/api/instructor/profile`
**Description:** Get instructor profile information
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Response (200 OK):**
```json
{
  "success": true,
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Dr. Jane Smith",
    "college": "College of Engineering and Information Technology",
    "department": "Computer Science Department",
    "instructorid": "CEIT-CS-2024-001",
    "status": "Active",
    "assignedSections": 3,
    "lastLogin": "2024-11-26T08:30:00.000Z"
  }
}
```

---

#### PUT `/api/instructor/profile`
**Description:** Update instructor profile
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "fullName": "Dr. Jane Marie Smith",
  "department": "Computer Science and Information Technology"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "instructor": {
    "id": "instructor_id",
    "fullName": "Dr. Jane Marie Smith",
    "department": "Computer Science and Information Technology"
  }
}
```

---

#### GET `/api/instructor/dashboard/stats`
**Description:** Get instructor dashboard statistics
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "totalSections": 3,
    "totalStudents": 89,
    "totalActivities": 15,
    "pendingGrades": 8,
    "upcomingDeadlines": 2,
    "averageGrades": {
      "sections": [
        {
          "sectionName": "CS101-A",
          "averageGrade": 85.5,
          "studentsCount": 32
        }
      ]
    }
  }
}
```

---

### Section Management

#### GET `/api/instructor/sections`
**Description:** Get instructor's assigned sections
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Query Parameters:**
- `semester`: Filter by semester
- `status`: Filter by status (Active, Archived)

**Response (200 OK):**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_id",
      "sectionName": "CS101-A",
      "subject": {
        "id": "subject_id",
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming",
        "credits": 3
      },
      "semester": {
        "id": "semester_id",
        "semesterName": "First Semester 2024-2025"
      },
      "enrolledStudents": 32,
      "totalActivities": 8,
      "schedule": "MWF 8:00-9:00 AM",
      "status": "Active"
    }
  ]
}
```

---

#### GET `/api/instructor/sections/:sectionId/students`
**Description:** Get students enrolled in a specific section
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Query Parameters:**
- `page`: Page number
- `limit`: Students per page
- `search`: Search by name or student ID

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "BUKSU-2024-001",
      "fullName": "Juan Dela Cruz",
      "email": "juan@student.buksu.edu.ph",
      "course": "Computer Science",
      "yearLevel": "3rd Year",
      "enrolledAt": "2024-09-01T00:00:00.000Z",
      "grades": {
        "currentAverage": 87.5,
        "activitiesCompleted": 6,
        "totalActivities": 8
      }
    }
  ],
  "section": {
    "sectionName": "CS101-A",
    "subject": "Introduction to Programming"
  },
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalStudents": 32
  }
}
```

---

### Student Enrollment Management

#### POST `/api/instructor/sections/:sectionId/enroll-student`
**Description:** Enroll student to section
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "studentId": "student_id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student enrolled successfully",
  "enrollment": {
    "studentId": "student_id",
    "sectionId": "section_id",
    "enrolledAt": "2024-11-26T10:00:00.000Z"
  }
}
```

---

#### DELETE `/api/instructor/sections/:sectionId/remove-student`
**Description:** Remove student from section
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "studentId": "student_id"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Student removed from section successfully"
}
```

---

#### POST `/api/instructor/sections/:sectionId/invite-students`
**Description:** Invite multiple students to section
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "studentIds": ["student_id_1", "student_id_2", "student_id_3"]
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Students invited successfully",
  "results": {
    "invited": 3,
    "failed": 0,
    "alreadyEnrolled": 0
  }
}
```

---

#### GET `/api/instructor/available-students`
**Description:** Get students available for enrollment
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Query Parameters:**
- `sectionId`: Exclude already enrolled students
- `college`: Filter by college
- `course`: Filter by course
- `yearLevel`: Filter by year level

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "BUKSU-2024-002",
      "fullName": "Maria Santos",
      "college": "College of Engineering",
      "course": "Computer Science",
      "yearLevel": "3rd Year"
    }
  ]
}
```

---

#### GET `/api/instructor/search-students`
**Description:** Search students for enrollment
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Query Parameters:**
- `q`: Search query
- `college`: Filter by college
- `course`: Filter by course
- `excludeSection`: Exclude students from specific section

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "BUKSU-2024-003",
      "fullName": "Pedro Rodriguez",
      "email": "pedro@student.buksu.edu.ph",
      "college": "College of Engineering",
      "course": "Information Technology",
      "yearLevel": "2nd Year"
    }
  ]
}
```

---

#### PUT `/api/instructor/sections/:sectionId/grading-schema`
**Description:** Update section grading schema
**Access:** Private (Instructor only)
**Middleware:** `instructorAuth`, `universalAuditLogger`

**Request Body:**
```json
{
  "gradingSchema": {
    "quizzes": 30,
    "assignments": 25,
    "projects": 25,
    "finalExam": 20
  },
  "passingGrade": 75
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Grading schema updated successfully",
  "gradingSchema": {
    "quizzes": 30,
    "assignments": 25,
    "projects": 25,
    "finalExam": 20
  }
}
```

---

### 3.1 CAPTCHA Generation and Validation

#### 3.1.1 Generate CAPTCHA

**Version:** 1.0  
**Date:** November 16, 2025  
**Description:** Generates a new CAPTCHA challenge for user verification during registration or sensitive operations. Returns a base64 encoded image and session identifier.

**Endpoint:** `GET http://localhost:5000/api/captcha/generate`

**Method:** GET

**Configurations:** Public endpoint, no authentication required.

**Request Parameters:**

| Name | Required | Type | Location | Description |
|------|----------|------|----------|-------------|
| None | - | - | - | No parameters required |

**Response Parameters:**

| Name | Type | Description |
|------|------|-------------|
| success | Boolean | Indicates if CAPTCHA generation was successful |
| captchaImage | String | Base64 encoded CAPTCHA image |
| captchaId | String | Unique session identifier for CAPTCHA |
| expiresIn | Number | CAPTCHA expiration time in seconds |

**Response Format:** JSON

**Responses:**

Successful CAPTCHA Generation (200 OK):
```json
{
  "success": true,
  "captchaImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
  "captchaId": "captcha_session_id_123",
  "expiresIn": 300
}
```

---

#### 3.1.2 Validate CAPTCHA

**Version:** 1.0  
**Date:** November 16, 2025  
**Description:** Validates user input against the generated CAPTCHA challenge. Used during registration and other security-sensitive operations.

**Endpoint:** `POST http://localhost:5000/api/captcha/validate`

**Method:** POST

**Configurations:** Public endpoint, no authentication required.

**Request Parameters:**

| Name | Required | Type | Location | Description |
|------|----------|------|----------|-------------|
| captchaId | Yes | String | Body | CAPTCHA session identifier from generation |
| captchaValue | Yes | String | Body | User-entered CAPTCHA text value |

**Response Parameters:**

| Name | Type | Description |
|------|------|-------------|
| success | Boolean | Indicates if CAPTCHA validation was successful |
| message | String | Validation result message |
| valid | Boolean | Whether the CAPTCHA answer is correct |

**Requests:**

Valid CAPTCHA Validation Request:
```json
{
  "captchaId": "captcha_session_id_123",
  "captchaValue": "AB7K9"
}
```

**Response Format:** JSON

**Responses:**

Successful Validation (200 OK):
```json
{
  "success": true,
  "message": "CAPTCHA validation successful",
  "valid": true
}
```

Invalid CAPTCHA Error (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid CAPTCHA value",
  "valid": false
}
```

Expired CAPTCHA Error (410 Gone):
```json
{
  "success": false,
  "message": "CAPTCHA has expired, please generate a new one",
  "valid": false
}
```

---

## 4. Email Service Module API

### 4.1 Email Notifications

#### 4.1.1 Send Welcome Email

**Version:** 1.0  
**Date:** November 16, 2025  
**Description:** Sends a welcome email to newly registered students or invited instructors. Contains account activation details and platform information.

**Endpoint:** `POST http://localhost:5000/api/email/welcome`

**Method:** POST

**Configurations:** Private endpoint requiring system authentication.

**Request Parameters:**

| Name | Required | Type | Location | Description |
|------|----------|------|----------|-------------|
| Authorization | Yes | String | Header | Bearer token for system authentication |
| email | Yes | String | Body | Recipient's email address |
| userType | Yes | String | Body | Type of user ("student" or "instructor") |
| fullName | Yes | String | Body | Recipient's full name |
| tempPassword | No | String | Body | Temporary password (for instructors) |

**Response Parameters:**

| Name | Type | Description |
|------|------|-------------|
| success | Boolean | Indicates if email was sent successfully |
| message | String | Email sending status message |
| messageId | String | Email service message identifier |

**Requests:**

Student Welcome Email Request:
```json
{
  "email": "student@student.buksu.edu.ph",
  "userType": "student",
  "fullName": "John Doe"
}
```

Instructor Welcome Email Request:
```json
{
  "email": "instructor@gmail.com",
  "userType": "instructor",
  "fullName": "Jane Smith",
  "tempPassword": "temp123456"
}
```

**Response Format:** JSON

**Responses:**

Successful Email Sent (200 OK):
```json
{
  "success": true,
  "message": "Welcome email sent successfully",
  "messageId": "msg_id_12345"
}
```

Email Service Error (502 Bad Gateway):
```json
{
  "success": false,
  "message": "Failed to send email - service temporarily unavailable"
}
```

---

### 4.2 Student Management

#### GET `/api/admin/students`
**Description:** Get all students with filtering
**Access:** Admin only
**Query Parameters:** `page`, `limit`, `status`, `college`

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "2021-001",
      "email": "student@student.buksu.edu.ph",
      "fullName": "John Doe",
      "college": "College of Engineering",
      "course": "Computer Science",
      "yearLevel": "3rd Year",
      "status": "Approved"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalStudents": 150
  }
}
```

#### PUT `/api/admin/students/:studentId/status`
**Description:** Update student approval status
**Access:** Admin only

**Request Body:**
```json
{
  "status": "Approved"
}
```

---

## 2.3 STUDENT MANAGEMENT MODULE API

Student Management Module API handles all student-related operations including registration, profile management, academic tracking, and grade viewing. This module enables students to interact with the system and provides administrators with tools to manage student accounts, enrollment, and academic progress.

The API have the following endpoints:
- http://localhost:5000/api/student/register
- http://localhost:5000/api/student/profile
- http://localhost:5000/api/student/sections
- http://localhost:5000/api/student/grades
- http://localhost:5000/api/students/search

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Student registered successfully |
| 400 | Bad Request | Invalid student data provided |
| 401 | Unauthorized | Invalid or missing student token |
| 403 | Forbidden | Student account not approved |
| 404 | Not Found | Student not found |
| 409 | Conflict | Student already exists |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.3.1 Student Registration

#### 2.3.1.1 Register New Student Account

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint enables new student registration within the BUKSU Grading System through Google OAuth authentication integration. It creates comprehensive student profiles with institutional verification, academic information validation, and automatic approval workflow processing. The endpoint validates student email domains (@student.buksu.edu.ph), checks for duplicate registrations, creates complete academic profiles with course and year level details, and initializes student access permissions. Error responses handle invalid institutional data, duplicate accounts, missing required parameters, and domain validation failures to ensure proper student onboarding procedures.

**Endpoint:** http://localhost:5000/api/student/register

**Method:** POST

**Configurations:** Public endpoint with institutional domain validation for @student.buksu.edu.ph email addresses. The API implements duplicate detection and automatic approval workflows based on institutional policies.

**Parameters:**
➢ googleId (required) - Google OAuth unique identifier for authentication integration. Should be included in the request body and obtained from Google OAuth flow.
➢ studid (required) - Student institutional identification number for academic tracking. Should be included in the request body and must be unique across the system.
➢ email (required) - Student's institutional email address. Should be included in the request body and must use @student.buksu.edu.ph domain.
➢ fullName (required) - Complete student name for identification and academic records. Should be included in the request body with proper capitalization.
➢ college (required) - Student's college or major academic division affiliation. Should be included in the request body with official college designation.
➢ course (required) - Specific academic program or degree course of study. Should be included in the request body with exact course title.
➢ yearLevel (required) - Current academic year level for enrollment tracking. Should be included in the request body (e.g., "1st Year", "2nd Year", etc.).
➢ errorMessage (optional) - Returned in the response body to provide details about registration issues, such as "Email already exists," "Invalid course," or "Missing required fields."

**Requests:**

**Valid Request:**
```json
{
  "googleId": "google_oauth_12345abcdef",
  "studid": "BUKSU-CEIT-2024-001234",
  "email": "juan.delacruz@student.buksu.edu.ph",
  "fullName": "Juan Miguel Dela Cruz",
  "college": "College of Engineering and Information Technology",
  "course": "Bachelor of Science in Computer Science",
  "yearLevel": "3rd Year"
}
```

**Not Valid Request:**
```json
{
  "googleId": "google_oauth_duplicateId",
  "studid": "EXISTING-STUDID-001",
  "email": "existing.student@student.buksu.edu.ph",
  "fullName": "Already Registered Student",
  "college": "College of Engineering",
  "course": "Computer Science",
  "yearLevel": "2nd Year"
}
```

**Response Format:** JSON

**Response:**

The POST /api/student/register endpoint creates new student accounts with comprehensive academic profiles. A successful registration returns HTTP 201 Created with complete student information and approval status. For duplicate registrations, the server returns HTTP 409 Conflict with specific error details. For invalid institutional data or domain violations, appropriate error responses are generated with detailed error messages.

**Successful Student Registration (201 Created):**
```json
{
  "success": true,
  "message": "Student account created and pending approval",
  "student": {
    "id": "674abc123456789d",
    "studid": "BUKSU-CEIT-2024-001234",
    "email": "juan.delacruz@student.buksu.edu.ph",
    "fullName": "Juan Miguel Dela Cruz",
    "college": "College of Engineering and Information Technology",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year",
    "status": "Pending Approval",
    "registeredAt": "2024-11-16T10:30:00.000Z",
    "googleId": "google_oauth_12345abcdef"
  },
  "nextSteps": {
    "message": "Registration successful. Awaiting admin approval for system access.",
    "approvalProcess": "Admin will review and approve within 24-48 hours"
  }
}
```

**Duplicate Student ID Error (409 Conflict):**
```json
{
  "success": false,
  "message": "Student ID already registered",
  "errorMessage": "A student with ID 'BUKSU-CEIT-2024-001234' is already registered in the system"
}
```

**Duplicate Email Error (409 Conflict):**
```json
{
  "success": false,
  "message": "Email address already in use",
  "errorMessage": "A student account with email 'juan.delacruz@student.buksu.edu.ph' already exists"
}
```

**Invalid Domain Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email domain",
  "errorMessage": "Student email must use @student.buksu.edu.ph domain"
}
```

---

#### 2.3.1.2 Get Current Student Profile

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint retrieves the complete profile information for the currently authenticated student within the BUKSU Grading System. It provides comprehensive access to student academic records, personal information, enrollment status, and account details. The endpoint requires student authentication and validates JWT tokens to ensure data privacy and security. Error responses handle authentication failures, unauthorized access attempts, and inactive student accounts to maintain system integrity and user data protection.

**Endpoint:** http://localhost:5000/api/student/profile

**Method:** GET

**Configurations:** Private endpoint requiring valid student JWT authentication. The API validates student tokens and returns complete profile information with enrollment details.

**Parameters:**
➢ Authorization (required) - Student JWT token in Bearer format. Should be included in the request header as "Bearer {student_jwt_token}".
➢ includeEnrollment (optional) - Query parameter to include detailed enrollment information. Can be set to "true" for expanded profile data.
➢ errorMessage (optional) - Returned in the response body for authentication or profile retrieval errors.

**Requests:**

**Valid Request:**
```http
GET /api/student/profile HTTP/1.1
Host: localhost:5000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Not Valid Request:**
```http
GET /api/student/profile HTTP/1.1
Host: localhost:5000
```

**Response Format:** JSON

**Response:**

The GET /api/student/profile endpoint retrieves complete student profile information for authenticated users. A successful request returns HTTP 200 OK with comprehensive student data including academic details and enrollment status. For missing authentication, the server returns HTTP 401 Unauthorized. For inactive accounts, it returns HTTP 403 Forbidden with appropriate error details.

**Successful Profile Retrieval (200 OK):**
```json
{
  "success": true,
  "message": "Student profile retrieved successfully",
  "student": {
    "id": "674abc123456789d",
    "studid": "BUKSU-CEIT-2024-001234",
    "email": "juan.delacruz@student.buksu.edu.ph",
    "fullName": "Juan Miguel Dela Cruz",
    "college": "College of Engineering and Information Technology",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year",
    "status": "Approved",
    "registeredAt": "2024-09-15T08:00:00.000Z",
    "lastLogin": "2024-11-16T09:15:00.000Z",
    "profileComplete": true
  },
  "enrollment": {
    "totalSections": 8,
    "activeSections": 6,
    "currentSemester": "First Semester 2024-2025",
    "academicYear": "2024-2025"
  }
}
```

**Authentication Required Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Authentication required",
  "errorMessage": "Student token required to access profile information"
}
```

**Account Not Approved Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Account not approved",
  "errorMessage": "Student account pending admin approval - profile access restricted"
}
```

---

#### GET `/api/student/sections`
**Description:** Get student's enrolled sections
**Access:** Student only

**Response:**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_id",
      "sectionName": "CS101-A",
      "subject": {
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming"
      },
      "instructor": {
        "fullName": "Jane Smith",
        "email": "instructor@gmail.com"
      },
      "semester": "First Semester 2024-2025"
    }
  ]
}
```

#### GET `/api/student/grades`
**Description:** Get student's grades
**Access:** Student only

**Response:**
```json
{
  "success": true,
  "grades": [
    {
      "section": {
        "sectionName": "CS101-A",
        "subject": "Introduction to Programming"
      },
      "activities": [
        {
          "activityName": "Quiz 1",
          "type": "Quiz",
          "score": 85,
          "maxScore": 100,
          "percentage": 85
        }
      ],
      "finalGrade": 87.5,
      "letterGrade": "B+"
    }
  ]
}
```

---

## 2.4 INSTRUCTOR MANAGEMENT MODULE API

Instructor Management Module API provides comprehensive tools for instructors to manage their academic responsibilities including section management, student enrollment, grade input, and activity creation. This module enables instructors to effectively administer their courses and interact with students within the system.

The API have the following endpoints:
- http://localhost:5000/api/instructor/profile
- http://localhost:5000/api/instructor/sections
- http://localhost:5000/api/instructor/sections/:sectionId/students
- http://localhost:5000/api/instructor/dashboard/stats
- http://localhost:5000/api/instructor/search-students

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid instructor data provided |
| 401 | Unauthorized | Invalid or missing instructor token |
| 403 | Forbidden | Instructor account not active |
| 404 | Not Found | Instructor or resource not found |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.4.1 Instructor Profile Management

#### GET `/api/instructor/profile`
**Description:** Get instructor profile
**Access:** Instructor only
**Headers:** `Authorization: Bearer <instructor_token>`

**Response:**
```json
{
  "success": true,
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith",
    "college": "College of Engineering",
    "department": "Computer Science",
    "status": "Active"
  }
}
```

#### GET `/api/instructor/sections`
**Description:** Get instructor's assigned sections
**Access:** Instructor only

**Response:**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_id",
      "sectionName": "CS101-A",
      "subject": {
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming"
      },
      "enrolledStudents": 30,
      "semester": "First Semester 2024-2025"
    }
  ]
}
```

#### GET `/api/instructor/sections/:sectionId/students`
**Description:** Get students in a specific section
**Access:** Instructor only

**Response:**
```json
{
  "success": true,
  "students": [
    {
      "id": "student_id",
      "studid": "2021-001",
      "fullName": "John Doe",
      "email": "student@student.buksu.edu.ph",
      "course": "Computer Science",
      "yearLevel": "3rd Year"
    }
  ]
}
```

---

## 2.5 ACTIVITY MANAGEMENT MODULE API

Activity Management Module API enables instructors to create, manage, and monitor academic activities such as quizzes, assignments, projects, and exams within the BUKSU Grading System. This comprehensive module provides advanced tools for complete activity lifecycle management, flexible scoring configuration options, detailed student engagement tracking, and automated grading workflows. It supports multiple activity types including quizzes, assignments, projects, presentations, and examinations with customizable parameters for due dates, maximum scores, instructions, and visibility settings.

The API have the following endpoints:
- http://localhost:5000/api/instructor/subjects/:subjectId/activities
- http://localhost:5000/api/instructor/sections/:sectionId/activities  
- http://localhost:5000/api/instructor/activities/:activityId
- http://localhost:5000/api/instructor/activities/:activityId/toggle
- http://localhost:5000/api/instructor/activities/:activityId/scores
- http://localhost:5000/api/instructor/activities/:activityId/analytics

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Activity created successfully |
| 400 | Bad Request | Invalid activity data provided |
| 401 | Unauthorized | Invalid or missing instructor token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Activity not found |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.5.1 Activity Creation and Management

### Base URL: `/api/instructor`

#### POST `/api/instructor/subjects/:subjectId/activities`
**Description:** Create new activity
**Access:** Instructor only

**Request Body:**
```json
{
  "activityName": "Quiz 1",
  "activityType": "Quiz",
  "maxScore": 100,
  "dueDate": "2024-12-31T23:59:59.000Z",
  "instructions": "Complete all questions",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "activity": {
    "id": "activity_id",
    "activityName": "Quiz 1",
    "activityType": "Quiz",
    "maxScore": 100,
    "dueDate": "2024-12-31T23:59:59.000Z"
  }
}
```

#### GET `/api/instructor/sections/:sectionId/activities`
**Description:** Get activities for a section
**Access:** Academic users (Student/Instructor)

**Response:**
```json
{
  "success": true,
  "activities": [
    {
      "id": "activity_id",
      "activityName": "Quiz 1",
      "activityType": "Quiz",
      "maxScore": 100,
      "dueDate": "2024-12-31T23:59:59.000Z",
      "isActive": true,
      "subject": "Introduction to Programming"
    }
  ]
}
```

#### PUT `/api/instructor/activities/:activityId`
**Description:** Update activity
**Access:** Instructor only

**Request Body:**
```json
{
  "activityName": "Updated Quiz 1",
  "maxScore": 120,
  "instructions": "Updated instructions"
}
```

#### DELETE `/api/instructor/activities/:activityId`
**Description:** Delete activity
**Access:** Instructor only

**Response:**
```json
{
  "success": true,
  "message": "Activity deleted successfully"
}
```

---

## 2.6 GRADE MANAGEMENT MODULE API

Grade Management Module API handles comprehensive grading operations including score input, automated grade calculations, detailed feedback provision, and advanced academic performance tracking within the BUKSU Grading System. This critical module enables instructors to efficiently manage student assessments with flexible scoring systems, provides students with secure access to their academic progress and detailed performance analytics, and supports multiple grading scales including percentage-based, letter grades, and institutional standards with automatic GPA calculations.

The API have the following endpoints:
- http://localhost:5000/api/grade
- http://localhost:5000/api/grade/section/:sectionId
- http://localhost:5000/api/grade/student/:studentId/summary
- http://localhost:5000/api/activityScores
- http://localhost:5000/api/activityScores/bulk
- http://localhost:5000/api/student/grades
- http://localhost:5000/api/student/grades/analytics

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Grade recorded successfully |
| 400 | Bad Request | Invalid grade data provided |
| 401 | Unauthorized | Invalid or missing authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Student or activity not found |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.6.1 Grade Input and Management

### Base URL: `/api/grade`

#### POST `/api/grade`
**Description:** Add or update student grade
**Access:** Instructor only

**Request Body:**
```json
{
  "studentId": "student_id",
  "sectionId": "section_id",
  "activityId": "activity_id",
  "score": 85,
  "feedback": "Good work!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grade updated successfully",
  "grade": {
    "student": "John Doe",
    "activity": "Quiz 1",
    "score": 85,
    "maxScore": 100,
    "percentage": 85
  }
}
```

#### GET `/api/grade/section/:sectionId`
**Description:** Get all grades for a section
**Access:** Instructor only

**Response:**
```json
{
  "success": true,
  "grades": [
    {
      "student": {
        "id": "student_id",
        "fullName": "John Doe",
        "studid": "2021-001"
      },
      "activities": [
        {
          "activityName": "Quiz 1",
          "score": 85,
          "maxScore": 100
        }
      ]
    }
  ]
}
```

---

## 2.7 EXPORT MODULE API

Export Module API provides comprehensive data export capabilities for academic records, enabling instructors and administrators to export grades, student data, and detailed academic reports to multiple formats within the BUKSU Grading System. This powerful module supports seamless Google Sheets integration for real-time data analysis and collaborative sharing, CSV exports for spreadsheet compatibility, PDF generation for official documentation, and Excel format exports with advanced formatting options. The module includes automated report scheduling, bulk data export operations, and customizable export templates with institutional branding and formatting standards.

The API have the following endpoints:
- http://localhost:5000/api/export/google-sheets/:sectionId
- http://localhost:5000/api/export/google-sheets/:sectionId/formatted
- http://localhost:5000/api/export/csv/:sectionId
- http://localhost:5000/api/export/pdf/:sectionId
- http://localhost:5000/api/export/excel/:sectionId
- http://localhost:5000/api/export/bulk/sections
- http://localhost:5000/api/export/reports/semester/:semesterId

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Export successful |
| 400 | Bad Request | Invalid export parameters |
| 401 | Unauthorized | Invalid or missing authentication token |
| 403 | Forbidden | Insufficient export permissions |
| 404 | Not Found | Section or data not found |
| 502 | Bad Gateway | External service unavailable |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.7.1 Google Sheets Integration

### Base URL: `/api/export`

#### POST `/api/export/google-sheets/:sectionId`
**Description:** Export section grades to Google Sheets
**Access:** Instructor only

**Request Body:**
```json
{
  "spreadsheetName": "CS101-A Grades",
  "includeStatistics": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grades exported successfully",
  "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/...",
  "spreadsheetId": "spreadsheet_id"
}
```

---

## 2.8 AI SERVICE MODULE API

AI Service Module API integrates advanced Gemini AI capabilities into the BUKSU Grading System, providing sophisticated intelligent text generation, comprehensive academic assistance, automated content creation features, and smart educational analytics within the platform. This innovative module enhances the educational experience through AI-powered tools for both instructors and students, including automated feedback generation, content summarization, academic writing assistance, intelligent question generation, performance analysis, and personalized learning recommendations with natural language processing capabilities.

The API have the following endpoints:
- http://localhost:5000/api/ai/generate
- http://localhost:5000/api/ai/generate/questions
- http://localhost:5000/api/ai/analyze
- http://localhost:5000/api/ai/analyze/performance
- http://localhost:5000/api/ai/feedback
- http://localhost:5000/api/ai/feedback/automated
- http://localhost:5000/api/ai/summarize
- http://localhost:5000/api/ai/recommendations

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | AI request successful |
| 400 | Bad Request | Invalid prompt or parameters |
| 401 | Unauthorized | Invalid or missing authentication token |
| 429 | Too Many Requests | Rate limit exceeded |
| 502 | Bad Gateway | AI service unavailable |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.8.1 AI Text Generation

#### 2.8.1.1 Generate AI-Powered Content

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint leverages advanced Gemini AI capabilities to generate intelligent, contextually relevant text content for educational purposes within the BUKSU Grading System. It provides sophisticated natural language generation for creating educational materials, explanations, summaries, and academic content with customizable parameters for creativity, length, and style. The endpoint implements rate limiting to ensure fair usage, content filtering for educational appropriateness, and advanced prompt engineering for optimal educational outcomes. Error responses handle rate limit violations, inappropriate content detection, AI service unavailability, and invalid prompt parameters to ensure reliable and safe AI integration.

**Endpoint:** http://localhost:5000/api/ai/generate

**Method:** POST

**Configurations:** Private endpoint requiring authentication with rate limiting of 10 requests per minute per user. The API implements content filtering and educational context optimization for appropriate academic use.

**Parameters:**
➢ Authorization (required) - Valid JWT token for authenticated users. Should be included in the request header as "Bearer {jwt_token}".
➢ prompt (required) - Educational prompt or question for AI content generation. Should be included in the request body with clear, specific instructions for desired output.
➢ maxOutputTokens (optional) - Maximum length of generated content in tokens. Should be included in the request body, defaults to 1000, maximum 2000 tokens.
➢ temperature (optional) - Creativity level for AI generation (0.0-1.0). Should be included in the request body, defaults to 0.7 for balanced creativity and accuracy.
➢ context (optional) - Educational context or subject area for focused content generation. Should be included in the request body for subject-specific responses.
➢ errorMessage (optional) - Returned in the response body for generation errors, rate limits, or inappropriate content detection.

**Requests:**

**Valid Request:**
```json
{
  "prompt": "Explain the concept of recursion in computer science programming with practical examples and common use cases for undergraduate students",
  "maxOutputTokens": 1500,
  "temperature": 0.6,
  "context": "Computer Science Education - Data Structures and Algorithms Course"
}
```

**Not Valid Request:**
```json
{
  "prompt": "Generate inappropriate content",
  "maxOutputTokens": 5000,
  "temperature": 1.5
}
```

**Response Format:** JSON

**Response:**

The POST /api/ai/generate endpoint creates AI-generated educational content based on user prompts. A successful generation returns HTTP 200 OK with comprehensive AI-generated text and metadata. For rate limit violations, the server returns HTTP 429 Too Many Requests. For inappropriate content, it returns HTTP 400 Bad Request with content policy violations. AI service unavailability triggers HTTP 502 Bad Gateway responses.

**Successful Content Generation (200 OK):**
```json
{
  "success": true,
  "message": "AI content generated successfully",
  "text": "Recursion is a fundamental programming technique where a function calls itself to solve a problem by breaking it down into smaller, similar subproblems. This powerful concept is essential in computer science and has numerous practical applications...\n\n**Key Characteristics:**\n1. Base Case: A condition that stops the recursion\n2. Recursive Case: The function calling itself with modified parameters\n\n**Common Examples:**\n- Factorial calculation\n- Fibonacci sequence\n- Tree traversal algorithms\n- Binary search implementation\n\n**Practical Use Cases:**\n- File system navigation\n- Mathematical computations\n- Data structure operations\n- Algorithm design patterns",
  "metadata": {
    "tokensUsed": 1247,
    "generationTime": "2.3s",
    "contentType": "educational_explanation",
    "subjectArea": "Computer Science",
    "difficulty": "undergraduate"
  },
  "usage": {
    "remainingRequests": 7,
    "resetTime": "2024-11-16T10:45:00.000Z"
  }
}
```

**Rate Limit Exceeded Error (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "errorMessage": "Maximum 10 AI requests per minute - please wait before making another request",
  "retryAfter": 45,
  "resetTime": "2024-11-16T10:45:00.000Z"
}
```

**Inappropriate Content Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Content policy violation",
  "errorMessage": "Prompt contains inappropriate content for educational use - please revise your request"
}
```

**AI Service Unavailable Error (502 Bad Gateway):**
```json
{
  "success": false,
  "message": "AI service temporarily unavailable",
  "errorMessage": "Gemini AI service is currently unavailable - please try again later"
}
```

---

## 🚨 Common Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Invalid request data",
  "errors": ["Email is required", "Invalid email format"]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Authentication required",
  "code": "TOKEN_EXPIRED"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```

### 423 Locked (Brute Force Protection)
```json
{
  "success": false,
  "message": "Account temporarily locked due to failed login attempts",
  "locked": true,
  "timeUntilUnlock": 7200000
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many AI requests, please try again later"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## 📝 Example API Calls

### cURL Examples

#### 1. Student Login via Google OAuth
```bash
# Step 1: Initiate OAuth
curl -X GET "http://localhost:5000/api/auth/google"

# Step 2: After callback, use the token
curl -X GET "http://localhost:5000/api/auth/me" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Admin Login
```bash
curl -X POST "http://localhost:5000/api/admin/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@buksu.edu.ph",
    "password": "your_password"
  }'
```

#### 3. Get Student Grades
```bash
curl -X GET "http://localhost:5000/api/student/grades" \
  -H "Authorization: Bearer YOUR_STUDENT_TOKEN"
```

#### 4. Create Activity (Instructor)
```bash
curl -X POST "http://localhost:5000/api/instructor/subjects/SUBJECT_ID/activities" \
  -H "Authorization: Bearer YOUR_INSTRUCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "activityName": "Midterm Exam",
    "activityType": "Exam",
    "maxScore": 100,
    "dueDate": "2024-12-15T10:00:00.000Z",
    "instructions": "2-hour examination covering chapters 1-5"
  }'
```

### Postman Collection Example

```json
{
  "info": {
    "name": "BUKSU Grading System API",
    "description": "Complete API collection for BUKSU Grading System"
  },
  "auth": {
    "type": "bearer",
    "bearer": [
      {
        "key": "token",
        "value": "{{auth_token}}",
        "type": "string"
      }
    ]
  },
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:5000/api"
    },
    {
      "key": "auth_token",
      "value": ""
    }
  ],
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Google OAuth Login",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/auth/google"
          }
        },
        {
          "name": "Get Current User",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/auth/me",
            "header": [
              {
                "key": "Authorization",
                "value": "Bearer {{auth_token}}"
              }
            ]
          }
        }
      ]
    }
  ]
}
```

---

## 🔒 Security Features

### Brute Force Protection
- **Maximum Attempts:** 5 failed logins
- **Lockout Duration:** 2 hours
- **Applies to:** All user types (Admin, Instructor, Student)

### Rate Limiting
- **AI Service:** 10 requests per minute per IP
- **Login Attempts:** Protected by brute force middleware
- **General API:** Can be configured per endpoint

### JWT Security
- **Algorithm:** HS256
- **Expiration:** 7 days (students/instructors), 24 hours (admin)
- **Refresh:** Automatic token refresh available for admin

### Data Validation
- **Email Domains:** Strictly enforced institutional emails
- **Input Sanitization:** All inputs validated and sanitized
- **SQL Injection:** Protected via Mongoose ODM
- **XSS Protection:** Helmet.js security headers applied

---

## 📄 Pagination

Most list endpoints support pagination with these parameters:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `sort`: Sort field (e.g., "createdAt", "fullName")
- `order`: Sort order ("asc" or "desc")

**Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

---

## 🔄 API Versioning

**Current Version:** v1 (default)
**Base URL:** `http://localhost:5000/api/`

Future versions will use URL versioning:
- v2: `http://localhost:5000/api/v2/`
- v3: `http://localhost:5000/api/v3/`

---

## 🚀 Getting Started

1. **Set up environment variables:**
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/buksu_grading
   JWT_SECRET=your-jwt-secret
   JWT_ACCESS_SECRET=your-admin-jwt-secret
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   FRONTEND_URL=http://localhost:5173
   BACKEND_URL=http://localhost:5000
   ```

2. **Test the API:**
   ```bash
   # Health check
   curl http://localhost:5000/api/health
   ```

3. **Expected Response:**
   ```json
   {
     "success": true,
     "message": "BUKSU Grading System API is running",
     "timestamp": "2024-11-16T10:30:00.000Z"
   }
   ```

---

## 📞 Support and Contact

For technical support or questions about this API:
- **System Admin:** Contact your institution's IT department
- **Developer Issues:** Check the error logs and common error responses
- **Feature Requests:** Submit through proper institutional channels

**Last Updated:** November 16, 2024
**API Version:** 1.0.0
**System Version:** BUKSU Grading System v1.0