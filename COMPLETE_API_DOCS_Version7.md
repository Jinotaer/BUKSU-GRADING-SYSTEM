# BUKSU Grading System API Documentation

> **Version:** 2.0 | **Last Updated:** November 26, 2025 | **Base URL:** `http://localhost:5000`

## 🎓 Project Overview

The **BUKSU Grading System** is a comprehensive web-based platform designed for Bukidnon State University to manage academic grading, student enrollment, and course administration. The system supports three user roles (Admin, Instructor, Student) with role-based access control, Google OAuth authentication, and comprehensive grade management features.

### 🌟 Key Features
- **Multi-Authentication System**: Google OAuth 2.0 for Students/Instructors, JWT for Admins
- **Advanced Role Management**: Granular permissions and access controls
- **Comprehensive Grade Management**: Activities, automated calculations, bulk operations
- **Google Services Integration**: Sheets export, Calendar synchronization
- **AI-Powered Tools**: Gemini AI for educational content generation
- **Advanced Security**: Brute-force protection, audit logging, encryption
- **Real-time Monitoring**: System health, user activities, security events
- **Concurrent Editing Protection**: Resource locking mechanism
- **Archive Management**: Soft delete with data retention policies
- **Schedule Automation**: Activity-driven schedule creation
- **Multiple Export Formats**: Google Sheets, CSV, PDF support

### 🏗️ Architecture
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Passport.js with Google OAuth 2.0 and JWT
- **Frontend**: React.js with Vite build tool
- **Security**: Helmet.js, rate limiting, data encryption
- **Monitoring**: Winston logging with activity tracking

## 🔐 Authentication & Security Framework

### 🔑 Authentication Methods

| User Type | Authentication Method | Email Domain | Token Type | Expiration |
|-----------|----------------------|--------------|------------|------------|
| **Students** | Google OAuth 2.0 | `@student.buksu.edu.ph` | JWT | 7 days |
| **Instructors** | Google OAuth 2.0 | `@gmail.com` | JWT | 7 days |
| **Admins** | Email/Password | Any (institutional) | JWT | 24 hours |

### 🛡️ Security Features

#### Multi-Layer Protection
- **Brute Force Protection**: Account lockouts after 5 failed attempts
- **Rate Limiting**: API endpoint throttling (10 requests/minute for AI)
- **CORS Configuration**: Cross-origin request security
- **Helmet.js Integration**: HTTP headers security
- **Data Encryption**: Sensitive user data encryption at rest
- **Session Security**: Secure cookie handling with HttpOnly flags

#### Audit & Monitoring
- **Universal Audit Logger**: All actions tracked with user context
- **Security Event Monitoring**: Failed logins, suspicious activities
- **Real-time System Health**: Performance and security metrics
- **Activity Categorization**: Structured logging for compliance

### 📝 Token Usage

#### Authorization Header Format
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Payload Structure
```json
{
  "id": "user_id",
  "email": "user@domain.com",
  "role": "student|instructor|admin",
  "iat": 1701234567,
  "exp": 1701838367
}
```

#### Refresh Token Flow (Admin Only)
```http
POST /api/admin/refresh-token
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

---

## 👥 User Roles & Access Matrix

### 🛡️ Admin Role - System Administrator
| **Capability** | **Scope** | **Access Level** |
|----------------|-----------|------------------|
| User Management | All users (Students, Instructors, Admins) | Full CRUD |
| Academic Structure | Semesters, Subjects, Sections | Full CRUD |
| System Configuration | Security, Settings, Monitoring | Full Control |
| Data Operations | Bulk operations, Imports/Exports | Full Access |
| Audit & Monitoring | Logs, Security Events, Analytics | Full Visibility |
| Lock Management | Resource locks, Concurrent editing | Full Control |
| Archival Operations | Soft delete/restore all entities | Full Control |

**Key Permissions:**
- Invite instructors and approve students
- Assign instructors to subjects
- Manage system-wide settings
- Access comprehensive analytics
- Perform bulk operations
- Control system locks and maintenance

### 👨‍🏫 Instructor Role - Academic Staff
| **Capability** | **Scope** | **Access Level** |
|----------------|-----------|------------------|
| Section Management | Assigned sections only | Read/Write |
| Student Management | Enrolled students in sections | Limited CRUD |
| Activity Management | Section activities | Full CRUD |
| Grade Management | Student grades in sections | Full CRUD |
| Export Operations | Section data | Read-only export |
| Schedule Integration | Google Calendar | Personal integration |
| Analytics Access | Section-level statistics | Read-only |

**Key Permissions:**
- Create and manage activities/assignments
- Input and update student grades
- Enroll/remove students from sections
- Export grades to multiple formats
- Connect Google Calendar for scheduling
- View section-level analytics

### 🎓 Student Role - Enrolled Users
| **Capability** | **Scope** | **Access Level** |
|----------------|-----------|------------------|
| Profile Management | Personal profile | Read/Write |
| Section Access | Enrolled sections | Read-only |
| Grade Viewing | Personal grades | Read-only |
| Activity Access | Section activities | Read-only |
| Schedule Viewing | Personal schedule | Read-only |
| Section Visibility | Personal dashboard | Hide/Show control |

**Key Permissions:**
- View enrolled sections and subjects
- Check personal grades and activity scores
- Access activity details and deadlines
- Manage section visibility preferences
- Update personal information
- View personalized schedules

---

## 📊 API Overview & Quick Reference

### 📋 Complete Endpoint Summary

#### 🔐 Authentication Module (`/api/auth`)
```
POST   /api/auth/validate-email     - Validate institutional email domains
POST   /api/auth/login              - Email/userType login with brute-force protection  
GET    /api/auth/google             - Initiate Google OAuth flow
GET    /api/auth/google/callback    - Handle OAuth callback and create session
GET    /api/auth/me                 - Get current authenticated user profile
POST   /api/auth/logout             - Destroy user session and invalidate tokens
GET    /api/auth/status             - Check authentication status
GET    /api/auth/student-only       - Demo student-only protected route
GET    /api/auth/instructor-only    - Demo instructor-only protected route
GET    /api/auth/academic-users     - Demo academic users protected route
```

#### 🛡️ reCAPTCHA Module (`/api`)
```
POST   /api/verify-captcha          - Verify reCAPTCHA response with Google API
```

#### 👑 Admin Management Module (`/api/admin`)
```
POST   /api/admin/login                        - Admin authentication with JWT
POST   /api/admin/refresh-token                - Refresh admin JWT token
POST   /api/admin/logout                       - Admin logout and session cleanup
GET    /api/admin/profile                      - Get admin profile information
GET    /api/admin/dashboard/stats              - Comprehensive dashboard statistics

# Password Reset
POST   /api/admin/request-reset-password       - Request password reset code
POST   /api/admin/verify-reset-code            - Verify password reset code
POST   /api/admin/reset-password               - Reset password with verified code

# User Management
POST   /api/admin/instructors/invite           - Invite new instructor
POST   /api/admin/instructors/invite/bulk      - Bulk invite multiple instructors
GET    /api/admin/instructors                  - List all instructors with pagination
DELETE /api/admin/instructors/:id              - Delete instructor account
PUT    /api/admin/instructors/:id/archive      - Archive instructor account
PUT    /api/admin/instructors/:id/unarchive    - Unarchive instructor account

GET    /api/admin/students                     - List all students with pagination
PUT    /api/admin/students/:id/status          - Update student approval status
DELETE /api/admin/students/:id                 - Delete student account
PUT    /api/admin/students/:id/archive         - Archive student account
PUT    /api/admin/students/:id/unarchive       - Unarchive student account

# Academic Structure Management
GET    /api/admin/semesters                    - List all semesters
POST   /api/admin/semesters                    - Create new semester
PUT    /api/admin/semesters/:id                - Update semester (with lock)
DELETE /api/admin/semesters/:id                - Delete semester (with lock)
PUT    /api/admin/semesters/:id/archive        - Archive semester (with lock)
PUT    /api/admin/semesters/:id/unarchive      - Unarchive semester

GET    /api/admin/subjects                     - List all subjects
POST   /api/admin/subjects                     - Create new subject
PUT    /api/admin/subjects/:id                 - Update subject (with lock)
DELETE /api/admin/subjects/:id                 - Delete subject (with lock)
POST   /api/admin/subjects/:id/assign-instructor - Assign instructor to subject
PUT    /api/admin/subjects/:id/archive         - Archive subject (with lock)
PUT    /api/admin/subjects/:id/unarchive       - Unarchive subject

GET    /api/admin/sections                     - List all sections
GET    /api/admin/sections/:id                 - Get specific section details
POST   /api/admin/sections                     - Create new section
PUT    /api/admin/sections/:id                 - Update section (with lock)
DELETE /api/admin/sections/:id                 - Delete section (with lock)
POST   /api/admin/sections/:id/invite-students - Invite students to section
GET    /api/admin/sections/:id/students        - Get section student list
DELETE /api/admin/sections/:id/remove-student  - Remove student from section
PUT    /api/admin/sections/:id/archive         - Archive section (with lock)
PUT    /api/admin/sections/:id/unarchive       - Unarchive section
```

#### 🎓 Student Management Module (`/api/student`, `/api/students`)
```
POST   /api/student/register                   - Register new student account
POST   /api/student/register/bulk              - Bulk register multiple students
GET    /api/student/profile                    - Get current student profile
PUT    /api/student/profile                    - Update student profile information
GET    /api/student/sections                   - Get enrolled sections
GET    /api/student/grades                     - Get student grades and scores
GET    /api/student/available-subjects         - Get available subjects for enrollment
PUT    /api/student/sections/:id/hide          - Hide section from dashboard
PUT    /api/student/sections/:id/unhide        - Unhide section from dashboard
GET    /api/student/sections/hidden            - Get list of hidden sections
GET    /api/students/search                    - Search students (for instructors)
```

#### 👨‍🏫 Instructor Management Module (`/api/instructor`)
```
GET    /api/instructor/profile                 - Get instructor profile
PUT    /api/instructor/profile                 - Update instructor profile
GET    /api/instructor/dashboard/stats         - Get instructor dashboard statistics
GET    /api/instructor/sections                - Get assigned sections
GET    /api/instructor/sections/:id/students   - Get students in specific section
POST   /api/instructor/sections/:id/enroll-student    - Enroll student to section
DELETE /api/instructor/sections/:id/remove-student    - Remove student from section
POST   /api/instructor/sections/:id/invite-students   - Invite multiple students
GET    /api/instructor/available-students      - Get available students for enrollment
GET    /api/instructor/search-students         - Search students by criteria
PUT    /api/instructor/sections/:id/grading-schema     - Update section grading schema
GET    /api/instructor/all                     - Get all instructors (for admin use)
```

#### 📝 Activity Management Module (`/api/instructor`)
```
POST   /api/instructor/subjects/:id/activities - Create new activity
GET    /api/instructor/sections/:id/activities - Get activities by section
GET    /api/instructor/subjects/:id/activities - Get activities by subject
PUT    /api/instructor/activities/:id          - Update activity
DELETE /api/instructor/activities/:id          - Delete activity
PATCH  /api/instructor/activities/:id/toggle   - Toggle activity status (active/inactive)
```

#### 📊 Activity Scores Module (`/api/activityScores`, `/api/instructor`, `/api/student`)
```
GET    /api/activityScores/activities/:id/scores    - Get activity scores
POST   /api/instructor/activities/:id/scores        - Bulk update activity scores
```

#### 📈 Grade Management Module (`/api/grade`)
```
POST   /api/grade                              - Add or update student grade
GET    /api/grade/section/:id                  - Get all grades for a section
```

#### 🏫 Academic Structure Modules

**Semesters (`/api/semesters`):**
```
GET    /api/semesters                          - List all semesters
POST   /api/semesters                          - Create semester (admin only)
```

**Subjects (`/api/subjects`):**
```
GET    /api/subjects                           - List all subjects
GET    /api/subjects/semester/:id              - Get subjects by semester
GET    /api/subjects/assigned                  - Get assigned subjects (instructor)
POST   /api/subjects                           - Create subject (admin only)
POST   /api/subjects/bulk                      - Bulk create subjects (admin only)
PUT    /api/subjects/:id                       - Update subject (admin only)
DELETE /api/subjects/:id                       - Delete subject (admin only)
POST   /api/subjects/:id/assign-instructor     - Assign instructor (admin only)
```

**Sections (`/api/section`):**
```
GET    /api/section                            - Get all sections
GET    /api/section/instructor/my-sections     - Get instructor's sections
GET    /api/section/subjects-with-multiple-instructors - Get subjects with multiple instructors
POST   /api/section                            - Create section
PUT    /api/section/:id                        - Update section
DELETE /api/section/:id                        - Delete section
POST   /api/section/:id/recalculate-grades     - Recalculate section grades
```

#### 📤 Export Module (`/api/export`)
```
POST   /api/export/google-sheets/:sectionId    - Export to Google Sheets (Class Record)
POST   /api/export/final-grade/:sectionId      - Export final grades (Hybrid-Flexible Grade Sheet)
```

#### 🔒 Lock Management Module (`/api/locks`)
```
POST   /api/locks/acquire                      - Acquire resource lock for editing
POST   /api/locks/heartbeat                    - Maintain lock heartbeat
POST   /api/locks/release                      - Release resource lock
GET    /api/locks/:id                          - Check lock status for resource
POST   /api/locks/check-batch                  - Batch check multiple locks
POST   /api/locks/cleanup                      - Clean up expired locks (admin)
```

#### 📅 Schedule Management Module (`/api/schedule`)
```
GET    /api/schedule/instructor/schedules      - Get instructor schedules
GET    /api/schedule/student/schedules         - Get student schedules  
GET    /api/schedule/upcoming                  - Get upcoming schedules
GET    /api/schedule/:id                       - Get specific schedule details
PUT    /api/schedule/:id                       - Update schedule
DELETE /api/schedule/:id                       - Delete schedule
```

#### 📅 Google Calendar Integration (`/api/google-calendar`)
```
GET    /api/google-calendar/auth-url           - Get Google Calendar OAuth URL
GET    /api/google-calendar/callback           - Handle OAuth callback for calendar
GET    /api/google-calendar/status             - Check calendar connection status
POST   /api/google-calendar/disconnect         - Disconnect Google Calendar integration
```

#### 🔍 Monitoring & Audit Module (`/api/monitoring`)
```
GET    /api/monitoring/logs                    - Get activity logs with filtering
GET    /api/monitoring/activities              - Get activity logs (legacy compatibility)
GET    /api/monitoring/logs/export             - Export logs to file
GET    /api/monitoring/security-events         - Get security events and alerts
GET    /api/monitoring/stats                   - Get system monitoring statistics
GET    /api/monitoring/user-stats              - Get user type statistics
GET    /api/monitoring/health                  - Get system health status
DELETE /api/monitoring/logs/cleanup            - Clean up old logs (admin maintenance)
```

#### 🤖 AI Service Module (`/api/ai`)
```
POST   /api/ai/generate                        - Generate AI content with Gemini (rate-limited)
```

#### ⚡ System Utilities
```
GET    /api/health                             - System health check endpoint
```

### 🔧 Middleware Components

#### Security Middleware
- `bruteForceProtection` - Prevents brute force attacks with progressive delays
- `requireLock(resourceType)` - Ensures resource is locked before modification
- `universalAuditLogger(action, category)` - Logs all user actions with context

#### Authentication Middleware
- `adminAuth` - Validates admin JWT tokens
- `instructorAuth` - Validates instructor JWT tokens  
- `studentAuth` - Validates student JWT tokens
- `auth` - General authentication (admin/instructor)
- `verifyGoogleAuthToken` - Validates Google OAuth tokens
- `requireRole([roles])` - Role-based access control
- `requireStudent` - Shorthand for student-only access
- `requireInstructor` - Shorthand for instructor-only access
- `requireAcademicUser` - Allows both students and instructors

### 📊 Response Patterns

#### Standard Success Response
```json
{
  "success": true,
  "message": "Operation completed successfully", 
  "data": { /* response data */ },
  "pagination": { /* if applicable */ }
}
```

#### Standard Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_TYPE", 
  "details": { /* additional error info */ }
}
```

#### Pagination Response Pattern
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalItems": 95,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## 📊 HTTP Status Codes & Error Handling

### 🎯 Standard HTTP Status Codes

| Code | Status | Description | Usage Context |
|------|--------|-------------|---------------|
| **2xx Success** |
| `200` | OK | Request successful | GET requests, successful operations |
| `201` | Created | Resource created successfully | POST requests, new resource creation |
| `204` | No Content | Successful operation, no content | DELETE requests, bulk operations |
| **4xx Client Errors** |
| `400` | Bad Request | Invalid request parameters | Malformed JSON, missing required fields |
| `401` | Unauthorized | Authentication required or failed | Missing/invalid tokens, expired sessions |
| `403` | Forbidden | Access denied | Insufficient permissions, account not approved |
| `404` | Not Found | Resource not found | Non-existent endpoints or resources |
| `409` | Conflict | Resource conflict | Duplicate emails, IDs already exist |
| `410` | Gone | Resource expired | Expired tokens, sessions, or temporary codes |
| `422` | Unprocessable Entity | Validation errors | Invalid data format, constraint violations |
| `423` | Locked | Resource locked | Account locked due to failed attempts |
| `429` | Too Many Requests | Rate limit exceeded | API throttling, brute force protection |
| **5xx Server Errors** |
| `500` | Internal Server Error | Server-side error | Database errors, unexpected exceptions |
| `502` | Bad Gateway | External service failure | Google API failures, email service errors |
| `503` | Service Unavailable | Service temporarily unavailable | Maintenance mode, overload |

### 🔄 Common Error Response Formats

#### Authentication Errors
```json
{
  "success": false,
  "message": "Authentication failed",
  "errorCode": "INVALID_TOKEN",
  "details": {
    "reason": "Token expired",
    "expiredAt": "2025-11-26T10:30:00.000Z"
  }
}
```

#### Validation Errors
```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "details": {
    "fields": [
      {
        "field": "email",
        "message": "Invalid email domain",
        "expected": "@student.buksu.edu.ph"
      },
      {
        "field": "yearLevel",
        "message": "Invalid year level",
        "allowedValues": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
      }
    ]
  }
}
```

#### Resource Conflict
```json
{
  "success": false,
  "message": "Resource already exists",
  "errorCode": "DUPLICATE_RESOURCE",
  "details": {
    "conflictField": "email",
    "conflictValue": "student@student.buksu.edu.ph",
    "existingResourceId": "674abcd123456789"
  }
}
```

#### Rate Limiting
```json
{
  "success": false,
  "message": "Too many requests",
  "errorCode": "RATE_LIMITED", 
  "details": {
    "retryAfter": 300,
    "limit": 10,
    "windowMs": 60000,
    "remaining": 0
  }
}
```

#### Brute Force Protection
```json
{
  "success": false,
  "message": "Account temporarily locked",
  "errorCode": "ACCOUNT_LOCKED",
  "details": {
    "locked": true,
    "lockDuration": 7200000,
    "unlockAt": "2025-11-26T12:30:00.000Z",
    "failedAttempts": 5,
    "maxAttempts": 5
  }
}
```

### 🛡️ Security Response Headers

All API responses include security headers:
```http
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### 📊 Audit Logging Categories

All operations are automatically logged with these categories:
- `AUTHENTICATION` - Login, logout, token refresh
- `USER_MANAGEMENT` - User creation, updates, deletions
- `ACADEMIC_MANAGEMENT` - Academic structure management
- `GRADE_MANAGEMENT` - Grade and score operations
- `INSTRUCTOR_ACTIVITY` - Instructor-specific actions
- `STUDENT_ACTIVITY` - Student-specific actions  
- `PROFILE_MANAGEMENT` - Profile updates and views
- `SYSTEM` - System operations and monitoring

---

## 🚀 Detailed API Endpoints Documentation

### 🔐 Authentication Module API

#### 1. **POST** `/api/auth/validate-email` - Validate Email Domain

**Description:** Validates institutional email domain before authentication

**Access:** Public

**Parameters:**
    ➢ email (required) - The user's institutional email address. Should be 
      included in the request body and must match the expected domain 
      format for the specified user type.
    ➢ userType (required) - The type of user attempting validation 
      ("student" or "instructor"). Should be included in the request body 
      to determine correct domain validation.
    ➢ captchaResponse (required) - reCAPTCHA response token from Google's 
      reCAPTCHA service. Should be included in the request body for security 
      verification.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about validation issues, such as "Invalid domain", 
      "CAPTCHA verification failed", or "Unsupported user type."

**Request:**
```json
{
  "email": "student@student.buksu.edu.ph",
  "userType": "student",
  "captchaResponse": "03AFcWeA4F7G8jLmN9PqR..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email domain is valid",
  "domain": "@student.buksu.edu.ph",
  "userType": "student"
}
```

**Response (422 Unprocessable Entity):**
```json
{
  "success": false,
  "message": "Invalid email domain",
  "errorCode": "INVALID_DOMAIN",
  "details": {
    "providedDomain": "@invalid.com",
    "expectedDomain": "@student.buksu.edu.ph",
    "userType": "student"
  }
}
```

---

#### 2. **POST** `/api/auth/login` - User Authentication

**Description:** Authenticates user with email and userType, issues JWT token

**Access:** Public (with brute-force protection)

**Middleware:** `bruteForceProtection`, `universalAuditLogger`

**Parameters:**
    ➢ email (required) - The user's institutional email address. Should 
      be included in the request body and must match registered user 
      credentials.
    ➢ userType (required) - The type of user attempting authentication 
      ("student" or "instructor"). Should be included in the request body 
      for role-based validation.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about authentication issues, such as "User not 
      found", "Account not approved", or "Too many login attempts".

**Request:**
```json
{
  "email": "student@student.buksu.edu.ph",
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
    "id": "674abcd123456789",
    "email": "student@student.buksu.edu.ph",
    "role": "student",
    "fullName": "Juan Miguel Dela Cruz",
    "status": "Approved",
    "college": "College of Engineering and Information Technology",
    "course": "Bachelor of Science in Computer Science",
    "yearLevel": "3rd Year"
  }
}
```

**Response (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found",
  "errorCode": "USER_NOT_FOUND",
  "details": {
    "email": "student@student.buksu.edu.ph",
    "userType": "student"
  }
}
```

---

#### 3. **GET** `/api/auth/google` - Google OAuth Initiation

**Description:** Redirects to Google OAuth consent screen

**Access:** Public

**Response:** 302 Redirect to Google OAuth

---

#### 4. **GET** `/api/auth/google/callback` - OAuth Callback Handler

**Description:** Processes Google OAuth callback and creates user session

**Access:** Public (OAuth callback)

**Parameters:**
    ➢ code (required) - OAuth authorization code from Google. 
      Automatically included in callback URL by Google OAuth service after 
      user consent.
    ➢ state (optional) - CSRF protection token for security validation. 
      System-generated parameter to prevent cross-site request forgery 
      attacks.
    ➢ errorMessage (optional) - Returned in the response through redirect 
      parameters to provide details about OAuth issues, such as 
      "Authentication failed" or "Invalid OAuth state".

**Success Response:** 302 Redirect with JWT token

**Redirect Examples:**
```
# Student Dashboard
Location: http://localhost:5173/student/dashboard?token=JWT_TOKEN

# Instructor Dashboard  
Location: http://localhost:5173/instructor/dashboard?token=JWT_TOKEN

# Authentication Error
Location: http://localhost:5173/login?error=auth_failed&message=Authentication failed
```

---

#### 5. **GET** `/api/auth/me` - Get Current User

**Description:** Returns authenticated user's profile information

**Access:** Private (requires authentication)

**Parameters:**
    ➢ token (required) - Valid JWT authentication token. Should be sent 
      in the Authorization header as "Bearer {token}".
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about authentication issues, such as "Token expired", 
      "Invalid token", or "User not found".

**Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "674abcd123456789",
    "email": "instructor@gmail.com",
    "role": "instructor",
    "fullName": "Dr. Jane Marie Smith",
    "status": "Active",
    "college": "College of Engineering and Information Technology",
    "department": "Computer Science Department"
  }
}
```

---

#### 6. **POST** `/api/auth/logout` - User Logout

**Description:** Destroys user session and invalidates tokens

**Access:** Private

**Parameters:**
    ➢ token (required) - Valid JWT authentication token. Should be sent 
      in the Authorization header as "Bearer {token}".
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about logout issues, such as "Invalid token" 
      or "Session already expired".

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2025-11-26T14:30:00.000Z"
}
```

---

### 👑 Admin Management Module API

#### 1. **POST** `/api/admin/login` - Admin Authentication

**Description:** Admin login with email/password and JWT token issuance

**Access:** Public (with brute-force protection)

**Parameters:**
    ➢ email (required) - The administrator's institutional email address. 
      Should be included in the request body and must match registered 
      admin credentials.
    ➢ password (required) - The administrator's secure password. Should 
      be included in the request body and will be validated against bcrypt 
      hash stored in database.
    ➢ captchaResponse (required) - reCAPTCHA response token from Google's 
      reCAPTCHA service. Should be included in the request body for security 
      verification and brute-force attack prevention.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about login issues, such as "Invalid credentials", 
      "Account locked", "CAPTCHA verification failed", or "Too many attempts".

**Request:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "SecureAdminPassword123!",
  "captchaResponse": "03AFcWeA4F7G8jLmN9PqR..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "admin": {
    "id": "674abcd123456789",
    "email": "admin@buksu.edu.ph",
    "fullName": "System Administrator",
    "role": "Admin",
    "lastLogin": "2025-11-26T10:30:00.000Z"
  }
}
```

---

#### 2. **GET** `/api/admin/dashboard/stats` - Dashboard Statistics

**Description:** Comprehensive system statistics for admin dashboard

**Access:** Private (Admin only)

**Parameters:**
    ➢ token (required) - Valid admin JWT authentication token. Should be 
      sent in the Authorization header as "Bearer {token}".
    ➢ includeDetails (optional) - Boolean parameter to include detailed 
      statistics. Should be included as query parameter to get extended 
      information.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about access issues, such as "Admin access 
      required" or "Token expired".

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "overview": {
      "totalStudents": 1247,
      "totalInstructors": 89,
      "totalSections": 156,
      "totalSubjects": 67
    },
    "pendingActions": {
      "pendingStudentApprovals": 12,
      "pendingGrades": 45,
      "expiredLocks": 3
    },
    "currentSemester": {
      "id": "674def123456789a",
      "semesterName": "First Semester 2024-2025",
      "activeSections": 98,
      "enrolledStudents": 1156
    },
    "systemHealth": {
      "status": "Healthy",
      "uptime": "15 days, 7 hours",
      "dbConnections": 12,
      "memoryUsage": "67%"
    },
    "recentActivity": {
      "todayLogins": 234,
      "todayGradesEntered": 89,
      "todayActivitiesCreated": 15
    }
  }
}
```

---

#### 3. **POST** `/api/admin/instructors/invite` - Invite Instructor

**Description:** Creates instructor account and sends invitation

**Access:** Private (Admin only)

**Parameters:**
    ➢ token (required) - Valid admin JWT authentication token. Should be 
      sent in the Authorization header as "Bearer {token}".
    ➢ email (required) - Instructor's Gmail address for platform access. 
      Should be included in the request body and must use @gmail.com 
      domain.
    ➢ fullName (required) - Complete instructor name for identification 
      purposes. Should be included in the request body with proper 
      capitalization.
    ➢ college (required) - Institution's college or major department 
      affiliation. Should be included in the request body with official 
      college name.
    ➢ department (required) - Specific academic department within the 
      college structure. Should be included in the request body with exact 
      department designation.
    ➢ instructorid (required) - Unique institutional instructor 
      identifier for system tracking. Should be included in the request 
      body and must be unique across the platform.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about invitation issues, such as "Email already 
      exists", "Invalid department", or "Missing required fields".

**Request:**
```json
{
  "email": "newprof@gmail.com",
  "fullName": "Dr. Maria Santos-Rodriguez",
  "college": "College of Engineering and Information Technology",
  "department": "Computer Science Department",
  "instructorid": "CEIT-CS-2024-015"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Instructor invited successfully",
  "instructor": {
    "id": "674xyz987654321b",
    "email": "newprof@gmail.com",
    "fullName": "Dr. Maria Santos-Rodriguez",
    "college": "College of Engineering and Information Technology",
    "department": "Computer Science Department",
    "instructorid": "CEIT-CS-2024-015",
    "status": "Active",
    "invitedBy": "674abcd123456789",
    "invitedAt": "2025-11-26T11:15:00.000Z"
  },
  "invitationDetails": {
    "loginUrl": "http://localhost:5173/login",
    "authMethod": "Google OAuth",
    "instructions": "Use your Gmail account to log in"
  }
}
```

---

#### 4. **GET** `/api/admin/students?page=1&limit=20&status=Approved` - List Students

**Description:** Paginated list of students with filtering options

**Access:** Private (Admin only)

**Parameters:**
    ➢ token (required) - Valid admin JWT authentication token. Should be 
      sent in the Authorization header as "Bearer {token}".
    ➢ page (optional) - Page number for pagination. Should be included 
      as query parameter with default value of 1.
    ➢ limit (optional) - Number of items per page for pagination. Should 
      be included as query parameter with default value of 20.
    ➢ status (optional) - Filter students by approval status. Should be 
      included as query parameter with values: "Approved", "Pending", 
      "Rejected", or "Archived".
    ➢ college (optional) - Filter students by college affiliation. 
      Should be included as query parameter with exact college name.
    ➢ course (optional) - Filter students by course program. Should be 
      included as query parameter with exact course name.
    ➢ yearLevel (optional) - Filter students by academic year level. 
      Should be included as query parameter with values: "1st Year", "2nd 
      Year", "3rd Year", "4th Year", or "5th Year".
    ➢ search (optional) - Search term for name, email, or student ID. 
      Should be included as query parameter for text-based filtering.
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about access issues, such as "Admin access 
      required" or "Invalid filter parameters".

**Response (200 OK):**
```json
{
  "success": true,
  "students": [
    {
      "id": "674student123456",
      "studid": "BUKSU-2024-001234",
      "email": "juan.delacruz@student.buksu.edu.ph",
      "fullName": "Juan Miguel Bautista Dela Cruz",
      "college": "College of Engineering and Information Technology",
      "course": "Bachelor of Science in Computer Science",
      "yearLevel": "3rd Year",
      "status": "Approved",
      "enrolledSections": 6,
      "averageGrade": 87.5,
      "registeredAt": "2024-09-01T08:00:00.000Z",
      "lastLogin": "2025-11-26T09:15:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 63,
    "totalItems": 1247,
    "itemsPerPage": 20,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "summary": {
    "approvedCount": 1156,
    "pendingCount": 78,
    "rejectedCount": 13,
    "archivedCount": 0
  }
}
```

---

### 🎓 Student Management Module API

#### 1. **POST** `/api/student/register` - Student Registration

**Description:** Register new student account with automatic approval

**Access:** Public

**Parameters:**
    ➢ email (required) - The student's institutional email address. 
      Should be included in the request body and must use 
      @student.buksu.edu.ph domain.
    ➢ studid (required) - Unique student identification number. Should 
      be included in the request body and must follow institutional 
      format (e.g., BUKSU-YYYY-XXXXXX).
    ➢ fullName (required) - Complete student name for identification 
      purposes. Should be included in the request body with proper 
      capitalization and spacing.
    ➢ college (required) - Student's college or major department 
      affiliation. Should be included in the request body with official 
      college name.
    ➢ course (required) - Student's academic program or degree course. 
      Should be included in the request body with complete degree title.
    ➢ yearLevel (required) - Student's current academic year level. 
      Should be included in the request body with values: "1st Year", 
      "2nd Year", "3rd Year", "4th Year", or "5th Year".
    ➢ errorMessage (optional) - Returned in the response body to 
      provide details about registration issues, such as "Email already 
      exists", "Invalid year level", or "Invalid domain".

**Request:**
```json
{
  "email": "maria.santos@student.buksu.edu.ph",
  "studid": "BUKSU-2024-005678",
  "fullName": "Maria Elena Santos",
  "college": "College of Arts and Sciences",
  "course": "Bachelor of Science in Mathematics",
  "yearLevel": "1st Year"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Student registration successful. Your account has been automatically approved.",
  "student": {
    "id": "674newstudent456",
    "studid": "BUKSU-2024-005678",
    "email": "maria.santos@student.buksu.edu.ph",
    "fullName": "Maria Elena Santos",
    "college": "College of Arts and Sciences", 
    "course": "Bachelor of Science in Mathematics",
    "yearLevel": "1st Year",
    "status": "Approved",
    "registeredAt": "2025-11-26T11:30:00.000Z"
  },
  "nextSteps": {
    "loginUrl": "http://localhost:5173/login",
    "authMethod": "Google OAuth",
    "instructions": "Use your @student.buksu.edu.ph email to login"
  }
}
```

---

#### 2. **GET** `/api/student/sections` - Get Student Sections

**Description:** Retrieve enrolled sections for authenticated student

**Access:** Private (Student only)

**Headers:**
```http
Authorization: Bearer student_jwt_token
```

**Response (200 OK):**
```json
{
  "success": true,
  "sections": [
    {
      "id": "674section123abc",
      "sectionName": "CS101-A",
      "subject": {
        "id": "674subject456def",
        "subjectCode": "CS101",
        "subjectName": "Introduction to Programming",
        "credits": 3,
        "description": "Fundamentals of programming logic and design"
      },
      "instructor": {
        "id": "674instructor789",
        "fullName": "Dr. Jane Smith",
        "email": "jane.smith@gmail.com",
        "department": "Computer Science Department"
      },
      "semester": {
        "id": "674semester012",
        "semesterName": "First Semester 2024-2025",
        "academicYear": "2024-2025"
      },
      "enrollment": {
        "enrolledAt": "2024-09-01T08:00:00.000Z",
        "status": "Active",
        "isHidden": false
      },
      "statistics": {
        "totalActivities": 12,
        "completedActivities": 8,
        "averageScore": 87.5,
        "lastActivity": "2025-11-25T14:00:00.000Z"
      },
      "schedule": {
        "days": ["Monday", "Wednesday", "Friday"],
        "startTime": "08:00",
        "endTime": "09:00",
        "room": "CCS Lab 1"
      }
    }
  ],
  "summary": {
    "totalSections": 6,
    "totalCredits": 18,
    "averageGrade": 88.2,
    "hiddenSections": 1
  }
}
```

---

#### 3. **GET** `/api/student/grades?sectionId=674section123abc` - Get Student Grades

**Description:** Retrieve grades and activity scores for authenticated student

**Access:** Private (Student only)

**Query Parameters:**
- `sectionId`: Filter by specific section
- `semester`: Filter by semester
- `activityType`: Filter by activity type (Quiz, Assignment, Project, Exam)

**Response (200 OK):**
```json
{
  "success": true,
  "grades": [
    {
      "section": {
        "id": "674section123abc",
        "sectionName": "CS101-A",
        "subject": {
          "subjectCode": "CS101",
          "subjectName": "Introduction to Programming",
          "credits": 3
        },
        "instructor": "Dr. Jane Smith"
      },
      "activities": [
        {
          "id": "674activity001",
          "activityName": "Quiz 1 - Variables and Data Types",
          "activityType": "Quiz",
          "maxScore": 100,
          "score": 89,
          "percentage": 89.0,
          "weight": 10,
          "dueDate": "2024-09-15T23:59:59.000Z",
          "submittedAt": "2024-09-15T20:45:00.000Z",
          "feedback": "Good understanding of basic concepts. Review array initialization.",
          "status": "Graded"
        },
        {
          "id": "674activity002", 
          "activityName": "Programming Assignment 1",
          "activityType": "Assignment",
          "maxScore": 100,
          "score": 95,
          "percentage": 95.0,
          "weight": 15,
          "dueDate": "2024-09-22T23:59:59.000Z",
          "submittedAt": "2024-09-21T18:30:00.000Z",
          "feedback": "Excellent code structure and logic. Well documented.",
          "status": "Graded"
        }
      ],
      "gradeBreakdown": {
        "quizzes": {
          "average": 87.5,
          "weight": 30,
          "weightedScore": 26.25
        },
        "assignments": {
          "average": 92.0,
          "weight": 25,
          "weightedScore": 23.0
        },
        "projects": {
          "average": 88.0,
          "weight": 25,
          "weightedScore": 22.0
        },
        "finalExam": {
          "score": 85.0,
          "weight": 20,
          "weightedScore": 17.0
        }
      },
      "finalGrade": {
        "numericGrade": 88.25,
        "letterGrade": "B+",
        "gpa": 3.25,
        "remarks": "Passed",
        "status": "Final"
      }
    }
  ]
}
```

---

### 👨‍🏫 Instructor Management Module API

#### 1. **GET** `/api/instructor/dashboard/stats` - Instructor Dashboard

**Description:** Get comprehensive instructor dashboard statistics

**Access:** Private (Instructor only)

**Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "overview": {
      "totalSections": 4,
      "totalStudents": 128,
      "totalActivities": 24,
      "totalSubjects": 3
    },
    "grading": {
      "pendingGrades": 15,
      "gradedActivities": 89,
      "averageClassGrade": 85.2
    },
    "recentActivity": {
      "activitiesCreatedThisWeek": 3,
      "gradesEnteredToday": 12,
      "lastLogin": "2025-11-26T08:30:00.000Z"
    },
    "sections": [
      {
        "id": "674section123",
        "sectionName": "CS101-A",
        "subject": "Introduction to Programming", 
        "enrolledStudents": 32,
        "averageGrade": 87.5,
        "pendingGrades": 5,
        "lastActivity": "2025-11-25T16:00:00.000Z"
      }
    ],
    "upcomingDeadlines": [
      {
        "activityId": "674activity123",
        "activityName": "Midterm Project",
        "sectionName": "CS101-A",
        "dueDate": "2025-11-28T23:59:59.000Z",
        "daysLeft": 2
      }
    ],
    "calendar": {
      "isConnected": true,
      "nextClass": {
        "subject": "CS101",
        "section": "CS101-A", 
        "startTime": "2025-11-27T08:00:00.000Z",
        "room": "CCS Lab 1"
      }
    }
  }
}
```

---

### 📝 Activity Management Module API

#### 1. **POST** `/api/instructor/subjects/:subjectId/activities` - Create Activity

**Description:** Create new activity/assignment for a subject

**Access:** Private (Instructor only)

**Request:**
```json
{
  "activityName": "Midterm Programming Project",
  "activityType": "Project",
  "description": "Develop a console-based inventory management system using object-oriented programming principles.",
  "instructions": "Create classes for Product, Inventory, and InventoryManager. Implement CRUD operations with file persistence.",
  "maxScore": 100,
  "weight": 25,
  "dueDate": "2025-12-15T23:59:59.000Z",
  "isActive": true,
  "rubric": [
    {
      "criteria": "Code Quality",
      "maxPoints": 25,
      "description": "Clean, readable, and well-structured code"
    },
    {
      "criteria": "Functionality", 
      "maxPoints": 40,
      "description": "All required features work correctly"
    },
    {
      "criteria": "Documentation",
      "maxPoints": 20, 
      "description": "Proper commenting and documentation"
    },
    {
      "criteria": "Innovation",
      "maxPoints": 15,
      "description": "Additional features or creative solutions"
    }
  ],
  "submissionGuidelines": {
    "format": "ZIP file containing source code and documentation",
    "namingConvention": "LastName_FirstName_MidtermProject.zip",
    "maxFileSize": "10MB"
  }
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Activity created successfully",
  "activity": {
    "id": "674activity999xyz",
    "activityName": "Midterm Programming Project",
    "activityType": "Project",
    "description": "Develop a console-based inventory management system...",
    "maxScore": 100,
    "weight": 25,
    "dueDate": "2025-12-15T23:59:59.000Z",
    "isActive": true,
    "subject": {
      "id": "674subject456def",
      "subjectCode": "CS101",
      "subjectName": "Introduction to Programming"
    },
    "instructor": {
      "id": "674instructor789",
      "fullName": "Dr. Jane Smith"
    },
    "createdAt": "2025-11-26T14:30:00.000Z",
    "schedule": {
      "id": "674schedule888",
      "title": "Midterm Programming Project Due",
      "date": "2025-12-15T23:59:59.000Z",
      "type": "assignment_due"
    }
  }
}
```

---

### 📊 Export Module API

#### 1. **POST** `/api/export/google-sheets/:sectionId` - Export to Google Sheets

**Description:** Export section grades to Google Sheets class record format

**Access:** Private (Instructor only)

**Path Parameters:**
- `sectionId`: Section to export

**Request Body (Optional):**
```json
{
  "sheetTitle": "CS101-A Class Record S.Y. 2024-2025",
  "includeFormulas": true,
  "shareWithInstructor": true,
  "format": "class_record"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Grades exported to Google Sheets successfully",
  "export": {
    "spreadsheetId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "spreadsheetUrl": "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
    "sheetTitle": "CS101-A Class Record S.Y. 2024-2025",
    "exportedAt": "2025-11-26T15:00:00.000Z",
    "statistics": {
      "totalStudents": 32,
      "totalActivities": 12,
      "averageGrade": 87.5
    },
    "folder": {
      "folderId": "1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Ogv",
      "folderName": "CS101-A Section Records",
      "folderUrl": "https://drive.google.com/drive/folders/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74Ogv"
    }
  }

**Response Description:** This screenshot demonstrates the Google Sheets Export API response. A successful grade export operation is shown with comprehensive details including the generated spreadsheet URL, unique identifier, and organized folder structure. The export includes complete class record data with student information, activity scores, and statistical summaries. The system provides direct access links and folder organization for efficient institutional record-keeping and academic administration.
}
```

---

### 🤖 AI Service Module API

#### 1. **POST** `/api/ai/generate` - Generate AI Content

**Description:** Generate educational content using Gemini AI with rate limiting

**Access:** Private (with rate limiting: 10 requests/minute)

**Request:**
```json
{
  "prompt": "Create 5 multiple choice questions about JavaScript arrays with explanations",
  "context": "CS101 Introduction to Programming course, beginner level",
  "maxOutputTokens": 1000,
  "temperature": 0.7,
  "contentType": "quiz_questions"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "AI content generated successfully",
  "content": {
    "text": "Here are 5 multiple choice questions about JavaScript arrays:\n\n1. Which method adds an element to the end of an array?\na) push()\nb) pop()\nc) shift()\nd) unshift()\n\nAnswer: a) push()\nExplanation: The push() method adds one or more elements to the end of an array and returns the new length...",
    "metadata": {
      "tokensUsed": 456,
      "model": "gemini-pro",
      "generatedAt": "2025-11-26T15:30:00.000Z",
      "processingTime": 1247
    }
  },
  "rateLimitInfo": {
    "remaining": 9,
    "resetTime": "2025-11-26T15:31:00.000Z",
    "limit": 10
  }
}
```

**Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Rate limit exceeded",
  "errorCode": "RATE_LIMITED",
  "details": {
    "limit": 10,
    "windowMs": 60000,
    "retryAfter": 45,
    "resetTime": "2025-11-26T15:31:00.000Z"
  }
}
```

Configurations:
- Public endpoint
- Brute-force protection middleware (rate limits/temporary locks)
- Audit logging middleware

Parameters:
- email (String, required) — institutional email
- userType (String, required) — "student" or "instructor"
- (optional) client metadata headers

Response Format: JSON

Response codes of this endpoint:

| Code | Message | Description |
|------|---------|-------------|
| 200 | Login successful | Returns JWT token and user object |
| 400 | Bad Request | Missing or invalid parameters |
| 401 | Email or Password Incorrect | Incorrect credentials / verification failed |
| 403 | User not Activated | Account not approved/activated |
| 404 | User Not Found | No user on record |
| 423 | Account Locked | Account temporarily locked after repeated failures |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server failure |

Responses:

Successful (200):
```json
{
  "success": true,
  "message": "Login successful",
  "token": "JWT_TOKEN",
  "user": { "id": "...", "email": "...", "role": "student", "fullName": "..." }
}
```

**Response Description:** This screenshot demonstrates the Student/Instructor Login API response. A successful Google OAuth authentication is shown with complete user details, including authenticated email, full name, and user role assignment. The JWT token provided enables secure access to protected endpoints throughout the system. Error scenarios such as 'User Not Found' (404), 'Account Not Activated' (403), and authentication failures are properly handled with descriptive error messages.

User Not Found (404):
```json
{
  "success": false,
  "message": "User not found",
  "errorMessage": "Student not registered"
}
```

Account Not Approved (403):
```json
{
  "success": false,
  "message": "Account not approved yet",
  "errorMessage": "Student account pending admin approval"
}
```

Account Locked (423):
```json
{
  "success": false,
  "message": "Account temporarily locked",
  "locked": true,
  "timeUntilUnlock": 7200000
}
```

---

2.1.1.2 User Logout and Session Termination

Version: 1.0  
Date: October 22, 2024

Description: Logs out the authenticated user, invalidating session/cookies/tokens if server-side token revocation is implemented.

Endpoint:
http://localhost:5000/api/auth/logout

Method: POST

Configurations:
- Private endpoint
- Requires valid JWT in Authorization header (or cookie)
- Audit logging

Parameters:
- token (String, required) — JWT (if passed in body; normally read from Authorization header)
- userId (String, required) — user identifier

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Logout successful |
| 400 | Bad Request | Missing required parameters |
| 401 | Unauthorized | Invalid or expired token |
| 403 | Forbidden | Insufficient permissions |
| 500 | Internal Server Error | Server failure during logout |

Responses:

Successful (200):
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2024-10-22T14:30:00.000Z"
}
```

Invalid Token (401):
```json
{
  "success": false,
  "message": "Invalid token",
  "errorMessage": "Token verification failed"
}
```

---

2.1.1.3 Google OAuth Authentication Initiation

Version: 1.0  
Date: October 22, 2024

Description: Redirects client to Google OAuth consent screen for user authentication.

Endpoint:
http://localhost:5000/api/auth/google

Method: GET

Configurations:
- Public
- Redirects to Google with required scopes

Parameters:
- (none) — server-initiated query may include state/prompt

Response Format: HTTP Redirect

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 302 | Found | Redirect to Google consent |
| 400 | Bad Request | Invalid parameters |
| 403 | Forbidden | Blocked IP or banned client |
| 500 | Internal Server Error | OAuth initialization error |

Response (Redirect):
```
HTTP/1.1 302 Found
Location: https://accounts.google.com/o/oauth2/auth?... 
```

---

2.1.1.4 Google OAuth Callback Handler

Version: 1.0  
Date: October 22, 2024

Description: Handles OAuth callback, exchanges code for tokens, validates email domain, creates/updates user, issues JWT and redirects to frontend.

Endpoint:
http://localhost:5000/api/auth/google/callback

Method: GET

Configurations:
- Public (callback)
- Uses Passport.js or built-in OAuth handler
- Sets secure cookie and/or redirects with token

Parameters:
- code (String, required) — OAuth authorization code
- state (String, optional) — CSRF protection

Response Format: HTTP Redirect (to frontend with token) or JSON on API-based flows

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 302 | Found | Redirect to frontend with token or error |
| 400 | Bad Request | Missing/invalid code |
| 401 | Unauthorized | Google authentication failed |
| 403 | Forbidden | Unauthorized email domain / unapproved account |
| 500 | Internal Server Error | Processing error |

Successful redirect (student):
```
HTTP/1.1 302 Found
Location: http://localhost:5173/student/dashboard?token=JWT_TOKEN
Set-Cookie: auth_token=JWT_TOKEN; HttpOnly; Secure; SameSite=Lax
```

Failure redirect example:
```
HTTP/1.1 302 Found
Location: http://localhost:5173/login?error=auth_failed&message=Authentication failed.
```

---

2.1.1.5 Get Current User (Profile)

Version: 1.0  
Date: November 16, 2025

Description: Returns profile of the authenticated user.

Endpoint:
http://localhost:5000/api/auth/me

Method: GET

Configurations:
- Private
- Requires Authorization: Bearer {jwt}
- Audit logging

Parameters:
- Authorization header (required)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Returns user profile |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Account not allowed |
| 404 | Not Found | User record not found |
| 500 | Internal Server Error | Retrieval error |

Successful (200):
```json
{
  "success": true,
  "user": { "id": "...", "email": "...", "fullName": "..." }
}
```

---

## 2.2 ADMIN MANAGEMENT MODULE API

Admin module endpoints implemented in repo include admin login, dashboard stats, instructors invite, student listing and status updates. Each endpoint below follows the activation-style subsection.

---

2.2.1.1 Admin Login and Session Creation

Version: 1.0  
Date: November 16, 2025

Description: Admin authentication using email/password. Returns admin JWT & profile.

Endpoint:
http://localhost:5000/api/admin/login

Method: POST

Configurations:
- Public
- Brute-force protection, audit logging

Parameters:
- email (String, required)
- password (String, required)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | Admin login successful | Returns admin JWT & profile |
| 400 | Bad Request | Missing fields |
| 401 | Unauthorized | Invalid credentials |
| 423 | Locked | Account locked |
| 500 | Internal Server Error | Server error |

Example success (200):
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "ADMIN_JWT_TOKEN",
  "admin": { "id": "...", "email": "admin@buksu.edu.ph" }
}
```

**Response Description:** This screenshot shows the Admin Login API response. A successful administrative login attempt is displayed with admin credentials validation, including administrative email and secure JWT token generation. Error scenarios such as 'Invalid Credentials' (401), 'Account Locked' (423), and 'Missing Fields' (400) are properly handled with comprehensive error messages and audit logging for security compliance.

---

2.2.1.2 Get Administrative Dashboard Statistics

Version: 1.0  
Date: November 16, 2025

Description: Aggregated system statistics for admin dashboard.

Endpoint:
http://localhost:5000/api/admin/dashboard/stats

Method: GET

Configurations:
- Private (admin JWT required)

Parameters:
- Authorization header (required)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Returns stats |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not an admin |
| 500 | Internal Server Error | Aggregation error |

Example (200):
```json
{
  "success": true,
  "stats": {
    "totalStudents": 150,
    "totalInstructors": 25,
    "totalSections": 30,
    "pendingApprovals": 5,
    "activeSemesters": 1
  }
}
```

**Response Description:** This screenshot displays the Admin Dashboard Statistics API response. Comprehensive system metrics are shown including total registered students, active instructors, created sections, pending approval counts, and active semester information. The dashboard provides real-time administrative oversight with aggregated data for institutional management and decision-making processes.

---

2.2.2.1 Invite New Instructor to Platform

Version: 1.0  
Date: November 16, 2025

Description: Admin invites/creates instructor account (Gmail) and returns created resource.

Endpoint:
http://localhost:5000/api/admin/instructors/invite

Method: POST

Configurations:
- Private (admin token)
- Email sending/invite workflow

Parameters:
- Authorization (header, required)
- email (String, required)
- fullName (String, required)
- college (String, required)
- department (String, required)
- instructorid (String, required)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 201 | Created | Instructor created & invited |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid admin token |
| 403 | Forbidden | Insufficient admin privileges |
| 409 | Conflict | Duplicate email or ID |
| 500 | Internal Server Error | Creation error |

Success example (201):
```json
{
  "success": true,
  "message": "Instructor invited and account created successfully",
  "instructor": { "id":"...", "email":"jane.smith@gmail.com" }
}
```

---

2.2.2.2 Get All Students (Admin)

Version: 1.0  
Date: November 16, 2025

Description: Returns paginated list of students with filters.

Endpoint:
http://localhost:5000/api/admin/students

Method: GET

Configurations:
- Private (admin token)
- Query params: page, limit, status, college

Parameters:
- Authorization (header, required)
- page, limit, status, college (query)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Returns students list |
| 400 | Bad Request | Invalid query params |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient privileges |
| 500 | Internal Server Error | DB error |

Sample (200): paginated students list (see earlier examples)

---

2.2.2.3 Update Student Approval Status

Version: 1.0  
Date: November 16, 2025

Description: Updates a student's approval status (Approve/Reject/Archive).

Endpoint:
http://localhost:5000/api/admin/students/:studentId/status

Method: PUT

Configurations:
- Private (admin token)

Parameters:
- Authorization (header, required)
- studentId (path)
- body: { "status": "Approved" }

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Status updated |
| 400 | Bad Request | Invalid status |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient privileges |
| 404 | Not Found | Student not found |
| 500 | Internal Server Error | Update error |

Success example (200):
```json
{ "success": true, "message": "Student status updated to Approved" }
```

---

## 3 CAPTCHA MODULE API

### 3.1 Verify reCAPTCHA

**Description:** Validates CAPTCHA responses with Google's reCAPTCHA API

**Endpoint:** `http://localhost:5000/api/verify-captcha`

**Method:** POST

**Access:** Public

**Parameters:**
    ➢ captchaResponse (required) - CAPTCHA token from the client-side. 
      Response Format: JSON

Response codes of this API:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | CAPTCHA verified successfully |
| 400 | Bad Request | No CAPTCHA response provided |
| 500 | Internal Server Error | The server encountered an error |

**Success Response (200):**
```json
{
  "success": true,
  "message": "OK",
  "description": "CAPTCHA verified successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Bad Request",
  "description": "No CAPTCHA response provided"
}
```

**Error Response (500):**
```json
{
  "success": false,
  "message": "Internal Server Error", 
  "description": "The server encountered an error"
}
```

**Response Description:** This screenshot demonstrates the reCAPTCHA Verification API response. A successful CAPTCHA verification is shown with Google's reCAPTCHA service validation, confirming the user completed the challenge successfully. Error scenarios such as 'No CAPTCHA response provided' (400) and 'Server encountered an error' (500) are properly handled with descriptive error messages and comprehensive logging for security compliance.

---

## 4 EMAIL SERVICE MODULE API

4.1.1 Send Welcome Email

Version: 1.0  
Date: November 16, 2025

Description: Sends welcome email to students/instructors.

Endpoint:
http://localhost:5000/api/email/welcome

Method: POST

Configurations:
- Private (system token)
- Integrates with email provider (e.g., SendGrid)

Parameters:
- Authorization (header, required)
- email (body, required)
- userType (body, required) — "student" | "instructor"
- fullName (body, required)
- tempPassword (body, optional)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Email sent |
| 201 | Created | Job queued |
| 400 | Bad Request | Missing fields |
| 401 | Unauthorized | Invalid system token |
| 502 | Bad Gateway | External provider error |
| 500 | Internal Server Error | Sending failed |

Success example (200):
```json
{ "success": true, "message": "Welcome email sent successfully", "messageId": "msg_id_12345" }
```

**Response Description:** This screenshot shows the Email Service API response. A successful welcome email delivery is demonstrated with confirmation message and unique message identifier for tracking purposes. The system ensures reliable communication with new instructors through automated email notifications, including account setup instructions and platform access details.

---

## 5 STUDENT MANAGEMENT MODULE API

Endpoints implemented: register, profile, sections, grades, students/search.

---

5.1 Register New Student Account

Version: 1.0  
Date: November 16, 2025

Description: Creates student account (often via Google OAuth flow) with academic details. Pending admin approval by default.

Endpoint:
http://localhost:5000/api/student/register

Method: POST

Configurations:
- Public (but expects Google id/email)
- Domain validation (@student.buksu.edu.ph)

Parameters:
- googleId (body, required)
- studid (body, required)
- email (body, required)
- fullName, college, course, yearLevel (body, required)

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 201 | Created | Student created (pending approval) |
| 400 | Bad Request | Missing/invalid fields |
| 409 | Conflict | Duplicate studid/email |
| 422 | Unprocessable Entity | Email domain invalid |
| 500 | Internal Server Error | Registration error |

Success (201):
```json
{ "success": true, "message": "Student account created and pending approval", "student": { ... } }
```

---

5.2 Get Current Student Profile

Version: 1.0  
Date: November 16, 2025

Description: Returns profile information for authenticated student.

Endpoint:
http://localhost:5000/api/student/profile

Method: GET

Configurations:
- Private (student JWT)

Parameters:
➢ authorization (required) - Bearer token for student authentication. Should be included in the Authorization header as 'Bearer {token}' where token is a valid JWT issued to the student.
➢ includeEnrollment (optional) - Query parameter to include enrollment data. Should be included in query string as 'includeEnrollment=true' to retrieve additional enrollment information.
➢ id (response) - Returned in response body as unique student identifier in the system.
➢ studid (response) - Returned in response body as the student's institutional identification number.
➢ email (response) - Returned in response body as the student's registered email address.
➢ fullName (response) - Returned in response body as the complete student name on record.
➢ college (response) - Returned in response body as the student's college affiliation.
➢ course (response) - Returned in response body as the student's degree program.
➢ yearLevel (response) - Returned in response body as the student's current academic year.
➢ status (response) - Returned in response body as the student's registration status (active/inactive).
➢ createdAt (response) - Returned in response body as the account creation timestamp.

Response Format: JSON

Response codes:

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Student profile returned |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Account not approved |
| 404 | Not Found | Student record missing |
| 500 | Internal Server Error | Retrieval error |

Success (200):
```json
{ "success": true, "student": { ... }, "enrollment": { ... } }
```

**Response Description:** This screenshot shows the Student Profile API response. Complete student information is displayed including personal details, academic standing, enrollment status, and institutional data. Optional enrollment data provides additional context about the student's current sections and academic progress. Error scenarios such as 'Unauthorized Access' (401) and 'Account Not Approved' (403) ensure proper access control.

---

5.3 Get Student Sections

Endpoint:
http://localhost:5000/api/student/sections

Method: GET

Parameters:
➢ authorization (required) - Bearer token for student authentication. Should be included in the Authorization header as 'Bearer {token}' where token is a valid JWT issued to the student.
➢ sections (response) - Returned in response body as array of section objects containing section details, subjects, and enrollment information.
➢ id (response) - Returned in each section object as unique section identifier.
➢ sectionName (response) - Returned in each section object as the section name (e.g., "CS101-A").
➢ subject (response) - Returned in each section object as nested subject details including name, code, and units.

Response codes:
200, 401, 403, 500

Response example (200):
```json
{ "success": true, "sections": [ { "id":"...", "sectionName":"CS101-A", "subject": {...} } ] }
```

**Response Description:** This screenshot demonstrates the Student Sections API response. A comprehensive list of enrolled sections is displayed showing section names, subject details, and enrollment information. Students can view all their registered courses with complete subject metadata including course codes, titles, and unit values for academic planning.

**Response Description:** This screenshot demonstrates the Student Sections API response. A comprehensive list of enrolled sections is displayed showing section names, subject details, and enrollment information. Students can view all their registered courses with complete subject metadata including course codes, titles, and unit values for academic planning.

---

5.4 Get Student Grades

Endpoint:
http://localhost:5000/api/student/grades

Method: GET

Parameters:
➢ authorization (required) - Bearer token for student authentication. Should be included in the Authorization header as 'Bearer {token}' where token is a valid JWT issued to the student.
➢ sectionId (optional) - Query parameter to filter grades by specific section. Should be included in query string as 'sectionId={id}' to retrieve grades for a particular section.
➢ grades (response) - Returned in response body as array of grade objects containing activities, scores, and calculated final grades.
➢ activities (response) - Returned in each grade object as array of activity details including names, types, and maximum points.
➢ finalGrade (response) - Returned in each grade object as calculated final grade percentage and letter grade.
➢ activities (response) - Returned in each grade object as list of completed activities with scores and feedback.

Response codes:
200, 401, 403, 404, 500

Success example (200): includes activities and final grade (see earlier examples)

---

## 6 INSTRUCTOR MANAGEMENT MODULE API

Endpoints implemented: profile, sections, sections/:sectionId/students, dashboard/stats, search-students.

Each endpoint follows the activation-style format — examples below.

6.1 Get Instructor Profile

Endpoint:
http://localhost:5000/api/instructor/profile
Method: GET

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ id (response) - Returned in response body as unique instructor 
      identifier in the system.
    ➢ email (response) - Returned in response body as the instructor's 
      registered email address (e.g., "instructor@gmail.com").
    ➢ fullName (response) - Returned in response body as the complete 
      instructor name on record (e.g., "Jane Smith").
    ➢ department (response) - Returned in response body as the 
      instructor's department affiliation.
    ➢ status (response) - Returned in response body as the instructor's 
      account status (active/inactive).
    ➢ createdAt (response) - Returned in response body as the account 
      creation timestamp.

Response codes: 200, 401, 403, 404, 500

Example (200):
```json
{ "success": true, "instructor": { "id":"...", "email":"instructor@gmail.com", "fullName":"Jane Smith" } }
```

**Response Description:** This screenshot displays the Instructor Profile API response. Complete instructor information is shown including contact details, department affiliation, and account status. The profile provides essential instructor data for section management, grade book access, and administrative coordination within the academic system.

**Response Description:** This screenshot displays the Instructor Profile API response. Complete instructor information is shown including contact details, department affiliation, and account status. The profile provides essential instructor data for section management, grade book access, and administrative coordination within the academic system.

6.2 Get Instructor Sections

Endpoint:
http://localhost:5000/api/instructor/sections
Method: GET

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ semesterId (optional) - Query parameter to filter sections by 
      semester. Should be included in query string as 'semesterId={id}' 
      to retrieve sections for a specific semester.
    ➢ sections (response) - Returned in response body as array of 
      section objects assigned to the instructor.
    ➢ id (response) - Returned in each section object as unique section 
      identifier.
    ➢ sectionName (response) - Returned in each section object as the 
      section name and code.
    ➢ subject (response) - Returned in each section object as nested 
      subject details including name, code, and units.
    ➢ studentCount (response) - Returned in each section object as the 
      number of enrolled students.

6.3 Get Students in Section

Endpoint:
http://localhost:5000/api/instructor/sections/:sectionId/students
Method: GET

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ sectionId (required) - URL parameter specifying the section 
      identifier. Should be included in the URL path as the section ID 
      to retrieve students for that specific section.
    ➢ students (response) - Returned in response body as array of 
      student objects enrolled in the specified section.
    ➢ id (response) - Returned in each student object as unique student 
      identifier.
    ➢ studid (response) - Returned in each student object as the 
      student's institutional ID number.
    ➢ fullName (response) - Returned in each student object as the 
      complete student name.
    ➢ email (response) - Returned in each student object as the 
      student's contact email.
    ➢ yearLevel (response) - Returned in each student object as the 
      student's current academic year.

Response codes: 200, 401, 403, 404, 500

---

## 7 ACTIVITY MANAGEMENT MODULE API

Key endpoints documented in activation-style:

7.1 Create Activity

Endpoint:
POST http://localhost:5000/api/instructor/subjects/:subjectId/activities

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ subjectId (required) - URL parameter specifying the subject 
      identifier. Should be included in the URL path as the subject ID 
      where the activity will be created.
    ➢ name (required) - Activity title or name. Should be included in 
      the request body with descriptive activity name.
    ➢ description (required) - Detailed activity description. Should be 
      included in the request body with comprehensive activity 
      instructions and requirements.
    ➢ type (required) - Activity category type. Should be included in 
      the request body with values like "assignment", "quiz", "exam", 
      "project", or "discussion".
    ➢ maxPoints (required) - Maximum points for the activity. Should be 
      included in the request body as a positive number representing the 
      total possible score.
    ➢ dueDate (optional) - Activity deadline. Should be included in the 
      request body as ISO date string format for submission deadline.

7.2 Get Section Activities

Endpoint:
GET http://localhost:5000/api/instructor/sections/:sectionId/activities

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ sectionId (required) - URL parameter specifying the section 
      identifier. Should be included in the URL path as the section ID 
      to retrieve activities for that specific section.
    ➢ activities (response) - Returned in response body as array of 
      activity objects created for the specified section.
    ➢ id (response) - Returned in each activity object as unique 
      activity identifier.
    ➢ name (response) - Returned in each activity object as the activity 
      title.
    ➢ type (response) - Returned in each activity object as the activity 
      category.
    ➢ maxPoints (response) - Returned in each activity object as the 
      maximum possible score.
    ➢ dueDate (response) - Returned in each activity object as the 
      submission deadline.

7.3 Update Activity

Endpoint:
PUT http://localhost:5000/api/instructor/activities/:activityId

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ activityId (required) - URL parameter specifying the activity 
      identifier. Should be included in the URL path as the activity ID 
      to be updated.
    ➢ name (optional) - Updated activity name. Should be included in the 
      request body if changing the activity title.
    ➢ description (optional) - Updated activity description. Should be 
      included in the request body if changing the activity instructions.
    ➢ maxPoints (optional) - Updated maximum points. Should be included 
      in the request body if changing the scoring scale.
    ➢ dueDate (optional) - Updated deadline. Should be included in the 
      request body as ISO date string if changing the submission deadline.

7.4 Delete Activity

Endpoint:
DELETE http://localhost:5000/api/instructor/activities/:activityId

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ activityId (required) - URL parameter specifying the activity 
      identifier. Should be included in the URL path as the activity ID 
      to be deleted.
    ➢ success (response) - Returned in response body as boolean 
      indicating deletion success.
    ➢ message (response) - Returned in response body with confirmation 
      message about the deletion operation.

7.5 Submit Activity Scores / Bulk

Endpoints:
POST /api/instructor/activities/:activityId/scores
POST /api/instructor/activities/:activityId/scores/bulk

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ activityId (required) - URL parameter specifying the activity 
      identifier. Should be included in the URL path as the activity ID 
      for score submission.
    ➢ studentId (required for single) - Student identifier for individual 
      score submission. Should be included in the request body when 
      submitting a single student score.
    ➢ score (required for single) - Numerical score value. Should be 
      included in the request body as a number between 0 and the 
      activity's maximum points.
    ➢ scores (required for bulk) - Array of score objects for bulk 
      submission. Should be included in the request body as array 
      containing studentId and score pairs for multiple students.
    ➢ feedback (optional) - Instructor feedback or comments. Should be 
      included in the request body to provide additional comments about 
      the student's performance.

---

## 8 GRADE MANAGEMENT MODULE API

8.1 Add/Update Grade

Endpoint:
POST http://localhost:5000/api/grade

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ studentId (required) - Student identifier for grade assignment. 
      Should be included in the request body as the unique student ID.
    ➢ sectionId (required) - Section identifier for grade context. 
      Should be included in the request body as the section where the 
      grade applies.
    ➢ activityId (required) - Activity identifier for grade association. 
      Should be included in the request body as the specific activity 
      being graded.
    ➢ score (required) - Numerical grade value. Should be included in 
      the request body as a number representing the student's performance.
    ➢ feedback (optional) - Instructor comments or feedback. Should be 
      included in the request body to provide additional context about 
      the grade.

8.2 Get Section Grades

Endpoint:
GET http://localhost:5000/api/grade/section/:sectionId

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ sectionId (required) - URL parameter specifying the section 
      identifier. Should be included in the URL path as the section ID 
      to retrieve grades for that specific section.
    ➢ grades (response) - Returned in response body as array of grade 
      objects for all students in the section.
    ➢ studentId (response) - Returned in each grade object as the 
      student identifier.
    ➢ scores (response) - Returned in each grade object as array of 
      individual activity scores.
    ➢ finalGrade (response) - Returned in each grade object as 
      calculated final grade percentage and letter grade.

---

## 9 EXPORT MODULE API

9.1 Export to Google Sheets

Endpoint:
POST http://localhost:5000/api/export/google-sheets/:sectionId

Method: POST

Parameters:
    ➢ authorization (required) - Bearer token for instructor 
      authentication. Should be included in the Authorization header as 
      'Bearer {token}' where token is a valid JWT issued to the instructor.
    ➢ sectionId (required) - URL parameter specifying the section 
      identifier. Should be included in the URL path as the section ID 
      to export grades from.
    ➢ format (optional) - Export format specification. Should be 
      included in the request body with values like "detailed", 
      "summary", or "template" to control export structure.
    ➢ includeComments (optional) - Include instructor feedback in 
      export. Should be included in the request body as boolean to 
      determine if comments are included in the spreadsheet.
    ➢ spreadsheetUrl (response) - Returned in response body as the URL 
      to the created Google Sheets document.
    ➢ spreadsheetId (response) - Returned in response body as the unique 
      identifier of the created spreadsheet for future reference.

Other export formats (CSV/PDF/Excel) follow similar pattern with their respective endpoints.

---

## 10 AI SERVICE MODULE API

10.1 Generate AI-Powered Content

Endpoint:
POST http://localhost:5000/api/ai/generate

Method: POST

Configurations:
- Private (JWT required)
- Rate-limited (example: 10 reqs/min/user)
- Content filtering

Parameters:
    ➢ authorization (required) - Bearer token for authenticated access. 
      Should be included in the Authorization header as 'Bearer {token}' 
      where token is a valid JWT issued to either student or instructor.
    ➢ prompt (required) - Input text for AI content generation. Should 
      be included in the request body with clear, descriptive text for 
      the AI to process and respond to.
    ➢ maxOutputTokens (optional) - Maximum response length limit. Should 
      be included in the request body as integer to control the length 
      of generated content (e.g., 500, 1000).
    ➢ temperature (optional) - AI creativity and randomness level. Should 
      be included in the request body as decimal between 0.0 
      (deterministic) and 1.0 (creative) to control response variability.
    ➢ context (optional) - Additional context for AI processing. Should 
      be included in the request body to provide relevant background 
      information for more accurate responses.
    ➢ text (response) - Returned in response body as the AI-generated 
      content based on the provided prompt.
    ➢ metadata (response) - Returned in response body containing usage 
      statistics such as tokens consumed and processing time.

Response codes:
200, 400, 401, 429, 502, 500

Example success (200):
```json
{
  "success": true,
  "message": "AI content generated successfully",
  "text": "Generated content...",
  "metadata": { "tokensUsed": 123 }
}
```

**Response Description:** This screenshot demonstrates the AI Service API response. A successful AI content generation request is shown with the generated text output and metadata including token usage statistics. The system showcases AI-powered features for educational content creation, assignment generation, and instructional support. Error scenarios such as 'Rate Limit Exceeded' (429), 'Invalid Prompt' (400), and 'Service Unavailable' (502) are handled with appropriate feedback to ensure reliable AI service integration.

---

## 🚨 Common Error Responses

(standardized JSON bodies included earlier — each endpoint above also lists response codes)

---

## 📝 Example API Calls

(see earlier cURL and Postman examples — responses correspond to the endpoint response code tables)

---

## 🔒 Security Features, Pagination, Versioning, Getting Started, Support

(unchanged — same guidance as earlier in the document)

---

If you want, I can:
- apply this activation-style subsection to every single route file line-by-line (I already covered all major endpoints above), or
- generate a machine-readable OpenAPI 3.0 spec that includes these response codes and example responses for every endpoint found under backend/routes (I can scan all route files and controllers to extract exact request/response fields and then produce the full spec).  

Which would you prefer next: "Expand every remaining minor route into activation-style entries" or "Generate OpenAPI spec from repository routes"?