**Bukidnon State University**  
**Malaybalay City**  
**College of Technologies**  
**Information Technology Department**  
**Bachelor of Science in Information Technology**  
**1st Semester SY: 2024 – 2025**

**IT137 – Integrative Programming and Technologies 2**  
**BukSU Grading System**

---

# API Documentation

---

## I. Overview

### 1.1 Project Name
**BukSU Grading System**

### 1.2 Client / Respondents of the System
Bukidnon State University – Malaybalay City, Bukidnon

### 1.3 Description
The Bukidnon State University (BukSU) Grading System is a comprehensive, web-based platform designed to streamline and enhance the management of academic grading, student performance tracking, and administrative tasks across the university. The system serves as the central hub for handling critical processes such as grade management, activity scoring, section management, instructor assignments, and academic performance analytics.

### 1.4 Key Features:
- **Role-Based Access Control**: Comprehensive authentication system supporting three user roles (Admin, Instructor, Student) with Google OAuth integration and JWT token-based security.
- **Grade Management**: Facilitates comprehensive grade tracking including preliminary, midterm, and final grades with automatic calculation of overall grades and letter grade assignments.
- **Activity and Assignment Tracking**: Enables instructors to create, publish, and manage activities with detailed scoring capabilities, supporting various activity categories such as quizzes, assignments, projects, and exams.
- **Section Management**: Provides complete section administration including student enrollment, instructor assignments, schedule management, and capacity tracking with real-time updates.
- **Schedule Management**: Automates class schedule generation with Google Calendar integration, allowing students and instructors to view, manage, and sync their academic schedules seamlessly.
- **Export Functionality**: Offers powerful export features to Google Sheets, enabling instructors to generate formatted grade reports with student information, activity scores, and comprehensive grading breakdowns.
- **AI-Powered Assistance**: Integrates Google Gemini API to provide intelligent assistance for grading insights, academic analytics, and automated feedback generation.
- **Resource Locking**: Implements concurrent edit protection through a sophisticated locking mechanism, ensuring data integrity when multiple users access shared resources.
- **Administrative Dashboard**: Provides administrators with comprehensive statistics, user management tools, semester and subject administration, and system-wide analytics.
- **Mobile Access**: Designed with responsive features, enabling students, instructors, and administrators to access the system on mobile devices for a more convenient and flexible experience.

### 1.5 Version
**1.0.0** – Latest (Production Ready)

### 1.6 Base URL
```
Development: http://localhost:5000/api
Production: [Your production URL]/api
```

### 1.7 Authentication
The Authentication System in the BukSU Grading System is secured using **JWT (JSON Web Token)** combined with **Google OAuth 2.0**, a robust and widely-used authentication method that ensures the secure exchange of user information between the client (user) and the server.

**Authentication Methods:**
- **Google OAuth 2.0**: Primary authentication method for students and instructors using institutional Google accounts
- **JWT Access Tokens**: Short-lived tokens (7 days) for API authorization
- **JWT Refresh Tokens**: Long-lived tokens for obtaining new access tokens
- **Admin Email/Password**: Secure bcrypt-hashed password authentication for administrators with brute-force protection

**Token Headers:**
```
Authorization: Bearer <access_token>
```

**Security Features:**
- Brute-force protection with account lockout (2-hour duration after failed attempts)
- OTP-based password reset (6-digit code with 15-minute expiration)
- Rate limiting on AI endpoints (10 requests per minute per IP)
- Resource locking for concurrent edit protection
- Helmet middleware for security headers
- CORS configuration for cross-origin requests

---

## II. Endpoints

The following are the detailed endpoints of BukSU Grading System API. These include HTTP methods used in the API calls, parameters, configurations, requests, and responses of the API.

---

## 2.1 AUTHENTICATION MODULE API

### 2.1.1 Module Description
The Authentication Module provides comprehensive authentication and authorization services for the BukSU Grading System. It supports multiple authentication methods including Google OAuth 2.0 for students and instructors, and email/password authentication for administrators. The module implements JWT (JSON Web Token) based security with access and refresh tokens, ensuring secure and stateless authentication across all API endpoints.

This module handles user session management, token generation and validation, password reset functionality with OTP verification, and role-based access control. It includes advanced security features such as brute-force protection, account lockout mechanisms, and institutional email domain validation to ensure only authorized users from Bukidnon State University can access the system.

The API has the following endpoints:
- `http://localhost:5000/api/auth/validate-email`
- `http://localhost:5000/api/auth/login`
- `http://localhost:5000/api/auth/google`
- `http://localhost:5000/api/auth/google/callback`
- `http://localhost:5000/api/auth/me`
- `http://localhost:5000/api/auth/logout`
- `http://localhost:5000/api/auth/status`
- `http://localhost:5000/api/admin/login`
- `http://localhost:5000/api/admin/refresh-token`
- `http://localhost:5000/api/admin/request-reset-password`
- `http://localhost:5000/api/admin/verify-reset-code`
- `http://localhost:5000/api/admin/reset-password`
- `http://localhost:5000/api/admin/profile`
- `http://localhost:5000/api/student/register`
- `http://localhost:5000/api/student/profile`
- `http://localhost:5000/api/instructor/profile`

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | The request was successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | The request was invalid or missing required parameters |
| 401 | Unauthorized | Authentication failed or token expired |
| 403 | Forbidden | Invalid token or insufficient permissions |
| 404 | Not Found | The requested resource could not be found |
| 409 | Conflict | Resource already exists (duplicate entry) |
| 423 | Locked | Account temporarily locked due to failed login attempts |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.1.2 API Endpoints

#### POST /validate-email
Validate institutional email domain.

**Request Body:**
```json
{
  "email": "student@buksu.edu.ph"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email domain validated",
  "valid": true
}
```

#### POST /login
Login with email and user type validation.

**Request Body:**
```json
{
  "email": "user@buksu.edu.ph",
  "userType": "student|instructor"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@buksu.edu.ph",
    "role": "student",
    "fullName": "John Doe"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### GET /google
Initiate Google OAuth authentication.

**Response:**
Redirects to Google OAuth consent screen.

#### GET /google/callback
Handle Google OAuth callback.

**Response:**
Redirects to frontend with authentication tokens.

#### GET /me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_id",
    "email": "user@buksu.edu.ph",
    "role": "student",
    "fullName": "John Doe",
    "profile": {
      // Additional profile data
    }
  }
}
```

#### POST /logout
Logout user and destroy session.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### GET /status
Check authentication status.

**Response:**
```json
{
  "authenticated": true,
  "user": {
    // User data if authenticated
  }
}
```

---

## Admin Routes

### Base Path: `/api/admin`

#### POST /login
Admin login with email and password.

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "admin_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "id": "admin_id",
    "email": "admin@buksu.edu.ph",
    "fullName": "Admin User",
    "role": "Admin",
    "status": "Active"
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /refresh-token
Refresh admin access token.

**Headers:**
```
Authorization: Bearer <refresh_token>
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "new_access_token"
}
```

#### POST /request-reset-password
Request password reset code.

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Reset code sent to email"
}
```

#### POST /verify-reset-code
Verify password reset code.

**Request Body:**
```json
{
  "passcode": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Code verified successfully"
}
```

#### POST /reset-password
Reset password using verified code.

**Request Body:**
```json
{
  "passcode": "123456",
  "newPassword": "new_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password successfully updated"
}
```

#### GET /profile
Get admin profile information.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "admin": {
    "id": "admin_id",
    "email": "admin@buksu.edu.ph",
    "fullName": "Admin User",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /dashboard/stats
Get dashboard statistics.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "students": {
      "total": 100,
      "pending": 0,
      "approved": 95,
      "rejected": 0
    },
    "instructors": {
      "total": 20,
      "active": 18,
      "invited": 0
    },
    "semesters": {
      "total": 5
    },
    "subjects": {
      "total": 50
    }
  },
  "recentActivities": {
    "students": [...],
    "instructors": [...]
  }
}
```

### Instructor Management

#### POST /instructors/invite
Invite a new instructor.

**Request Body:**
```json
{
  "instructorid": "INST001",
  "email": "instructor@gmail.com",
  "fullName": "Jane Smith",
  "college": "College of Computing",
  "department": "Computer Science"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Instructor invited and automatically approved successfully",
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith",
    "college": "College of Computing",
    "department": "Computer Science",
    "status": "Active",
    "invitedBy": "admin@buksu.edu.ph",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### GET /instructors
Get all instructors with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status
- `college` (optional): Filter by college
- `department` (optional): Filter by department
- `includeArchived` (optional): Include archived instructors

**Response:**
```json
{
  "success": true,
  "instructors": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalInstructors": 50,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### DELETE /instructors/:instructorId
Delete an instructor.

**Response:**
```json
{
  "success": true,
  "message": "Instructor deleted successfully",
  "deletedInstructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith"
  }
}
```

#### PUT /instructors/:instructorId/archive
Archive an instructor.

**Response:**
```json
{
  "success": true,
  "message": "Instructor archived successfully",
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith",
    "isArchived": true,
    "archivedAt": "2024-01-01T00:00:00.000Z",
    "archivedBy": "admin@buksu.edu.ph"
  }
}
```

#### PUT /instructors/:instructorId/unarchive
Unarchive an instructor.

**Response:**
```json
{
  "success": true,
  "message": "Instructor unarchived successfully",
  "instructor": {
    "id": "instructor_id",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith",
    "isArchived": false
  }
}
```

### Student Management

#### GET /students
Get all students with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number
- `limit` (optional): Items per page
- `status` (optional): Filter by status
- `college` (optional): Filter by college
- `course` (optional): Filter by course
- `yearLevel` (optional): Filter by year level
- `search` (optional): Search by ID, email, or name
- `includeArchived` (optional): Include archived students

**Response:**
```json
{
  "success": true,
  "students": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 10,
    "totalStudents": 100,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

#### PUT /students/:studentId/status
Update student status (delete only).

**Request Body:**
```json
{
  "action": "delete"
}
```

#### DELETE /students/:studentId
Delete a student.

#### PUT /students/:studentId/archive
Archive a student.

#### PUT /students/:studentId/unarchive
Unarchive a student.

### Semester Management

#### GET /semesters
Get all semesters.

#### POST /semesters
Create a new semester.

**Request Body:**
```json
{
  "name": "First Semester",
  "schoolYear": "2024-2025",
  "startDate": "2024-08-01",
  "endDate": "2024-12-15",
  "isActive": true
}
```

#### PUT /semesters/:id
Update a semester (requires lock).

#### DELETE /semesters/:id
Delete a semester (requires lock).

#### PUT /semesters/:id/archive
Archive a semester (requires lock).

#### PUT /semesters/:id/unarchive
Unarchive a semester.

### Subject Management

#### GET /subjects
Get all subjects.

#### POST /subjects
Create a new subject.

**Request Body:**
```json
{
  "code": "CS101",
  "name": "Introduction to Computer Science",
  "description": "Basic concepts of computer science",
  "units": 3,
  "college": "College of Computing",
  "department": "Computer Science"
}
```

#### PUT /subjects/:id
Update a subject (requires lock).

#### DELETE /subjects/:id
Delete a subject (requires lock).

#### POST /subjects/:subjectId/assign-instructor
Assign instructor to subject.

**Request Body:**
```json
{
  "instructorId": "instructor_id"
}
```

#### PUT /subjects/:id/archive
Archive a subject (requires lock).

#### PUT /subjects/:id/unarchive
Unarchive a subject.

### Section Management

#### GET /sections
Get all sections.

#### GET /sections/:id
Get section by ID.

#### POST /sections
Create a new section.

**Request Body:**
```json
{
  "name": "CS101-A",
  "subjectId": "subject_id",
  "instructorId": "instructor_id",
  "semesterId": "semester_id",
  "schedule": {
    "day": "Monday",
    "startTime": "08:00",
    "endTime": "10:00",
    "room": "Room 101"
  },
  "maxStudents": 30
}
```

#### PUT /sections/:id
Update a section (requires lock).

#### DELETE /sections/:id
Delete a section (requires lock).

#### POST /sections/:id/invite-students
Invite students to section.

**Request Body:**
```json
{
  "studentIds": ["student_id_1", "student_id_2"]
}
```

#### GET /sections/:id/students
Get students in section.

#### DELETE /sections/:id/remove-student
Remove student from section.

**Request Body:**
```json
{
  "studentId": "student_id"
}
```

#### PUT /sections/:id/archive
Archive a section (requires lock).

#### PUT /sections/:id/unarchive
Unarchive a section.

---

## Student Routes

### Base Path: `/api/student`

#### POST /register
Register a new student.

**Request Body:**
```json
{
  "studid": "2024-001",
  "email": "student@buksu.edu.ph",
  "firstName": "John",
  "lastName": "Doe",
  "college": "College of Computing",
  "course": "Computer Science",
  "yearLevel": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Student registered successfully",
  "student": {
    "id": "student_id",
    "email": "student@buksu.edu.ph",
    "fullName": "John Doe",
    "studid": "2024-001",
    "status": "Active"
  }
}
```

#### GET /profile
Get current student's profile.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "success": true,
  "student": {
    "id": "student_id",
    "email": "student@buksu.edu.ph",
    "fullName": "John Doe",
    "studid": "2024-001",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 1,
    "status": "Active"
  }
}
```

#### PUT /profile
Update current student's profile.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "yearLevel": 2
}
```

#### GET /sections
Get student's enrolled sections.

**Response:**
```json
{
  "success": true,
  "sections": [
    {
      "id": "section_id",
      "name": "CS101-A",
      "subject": {
        "code": "CS101",
        "name": "Introduction to Computer Science",
        "units": 3
      },
      "instructor": {
        "fullName": "Jane Smith"
      },
      "semester": {
        "name": "First Semester",
        "schoolYear": "2024-2025"
      }
    }
  ]
}
```

#### GET /grades
Get student's grades.

**Response:**
```json
{
  "success": true,
  "grades": [
    {
      "section": {
        "name": "CS101-A",
        "subject": {
          "code": "CS101",
          "name": "Introduction to Computer Science"
        }
      },
      "preliminaryGrade": 85.5,
      "midtermGrade": 88.0,
      "finalGrade": 90.5,
      "overallGrade": 88.0,
      "letterGrade": "A"
    }
  ]
}
```

#### GET /subjects/available
Get available subjects for enrollment.

#### GET /search
Search students by ID or email.

**Query Parameters:**
- `q`: Search query

#### GET /sections/hidden
Get student's hidden sections.

#### PUT /sections/:id/hide
Hide a section (student perspective).

#### PUT /sections/:id/unhide
Unhide a section (student perspective).

---

## Instructor Routes

### Base Path: `/api/instructor`

#### GET /dashboard/stats
Get instructor dashboard statistics.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalSections": 5,
    "totalStudents": 150,
    "activeSections": 4,
    "pendingActivities": 3
  }
}
```

#### GET /profile
Get current instructor's profile.

#### PUT /profile
Update current instructor's profile.

#### GET /all
Get all instructors (for section creation).

#### GET /sections
Get all sections assigned to instructor.

#### GET /sections/:sectionId/students
Get all students in a specific section.

#### GET /sections/:sectionId/available-students
Get available students for section invitation.

#### GET /search-students
Search for students by name, ID, or email.

#### POST /sections/:sectionId/students
Enroll a student to a section.

#### POST /sections/:sectionId/invite-students
Invite multiple students to a section.

#### DELETE /sections/:sectionId/students/:studentId
Remove a student from a section.

---

## Activity Routes

### Base Path: `/api/instructor`

#### POST /subjects/:subjectId/activities
Create new activity.

**Request Body:**
```json
{
  "title": "Quiz 1",
  "description": "First quiz on basic concepts",
  "category": "Quiz",
  "totalScore": 50,
  "dueDate": "2024-02-15T23:59:59.000Z",
  "isPublished": true
}
```

#### GET /sections/:sectionId/activities
Get activities by section.

#### GET /subjects/:subjectId/activities
Get activities by subject.

#### PUT /activities/:activityId
Update activity.

#### DELETE /activities/:activityId
Delete activity.

#### PATCH /activities/:activityId/toggle
Toggle activity status (published/unpublished).

---

## Activity Scores Routes

### Base Path: `/api/activityScores`

#### GET /activities/:activityId/scores
Get activity scores.

**Response:**
```json
{
  "success": true,
  "scores": [
    {
      "student": {
        "id": "student_id",
        "fullName": "John Doe",
        "studid": "2024-001"
      },
      "score": 45,
      "maxScore": 50,
      "percentage": 90.0,
      "submittedAt": "2024-02-15T10:30:00.000Z"
    }
  ]
}
```

#### POST /activities/:activityId/scores
Bulk upsert activity scores.

**Request Body:**
```json
{
  "scores": [
    {
      "studentId": "student_id_1",
      "score": 45
    },
    {
      "studentId": "student_id_2", 
      "score": 48
    }
  ]
}
```

---

## Grade Routes

### Base Path: `/api/grade`

#### POST /
Add or update grade.

**Request Body:**
```json
{
  "studentId": "student_id",
  "sectionId": "section_id",
  "preliminaryGrade": 85.5,
  "midtermGrade": 88.0,
  "finalGrade": 90.5
}
```

#### GET /section/:sectionId
Get grades by section.

---

## Schedule Routes

### Base Path: `/api/schedule`

#### GET /instructor/schedules
Get instructor schedules.

#### GET /student/schedules
Get student schedules.

#### GET /upcoming
Get upcoming schedules.

#### GET /:id
Get schedule by ID.

#### PUT /:id
Update schedule (instructors only).

#### DELETE /:id
Delete schedule (instructors only).

---

## Export Routes

### Base Path: `/api/export`

#### POST /google-sheets/:sectionId
Export grades to Google Sheets.

**Request Body:**
```json
{
  "includeStudentInfo": true,
  "includeActivities": true,
  "sheetTitle": "CS101-A Grades"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Grades exported successfully",
  "sheetUrl": "https://docs.google.com/spreadsheets/d/sheet_id",
  "sheetId": "sheet_id"
}
```

---

## Lock Routes

### Base Path: `/api/locks`

#### POST /acquire
Acquire resource lock for editing.

**Request Body:**
```json
{
  "resourceId": "resource_id",
  "resourceType": "semester|subject|section"
}
```

#### POST /heartbeat
Send heartbeat to keep lock alive.

**Request Body:**
```json
{
  "resourceId": "resource_id",
  "resourceType": "semester"
}
```

#### POST /release
Release resource lock.

**Request Body:**
```json
{
  "resourceId": "resource_id",
  "resourceType": "semester"
}
```

#### GET /:id
Check if resource is locked.

#### POST /check-batch
Batch check for multiple resource locks.

**Request Body:**
```json
{
  "resources": [
    {
      "resourceId": "id1",
      "resourceType": "semester"
    },
    {
      "resourceId": "id2", 
      "resourceType": "subject"
    }
  ]
}
```

#### POST /cleanup
Clean up expired locks.

---

## Google Calendar Routes

### Base Path: `/api/google-calendar`

#### GET /auth-url
Get OAuth URL for Google Calendar connection.

**Response:**
```json
{
  "success": true,
  "authUrl": "https://accounts.google.com/oauth2/auth?..."
}
```

#### GET /callback
Handle Google Calendar OAuth callback.

#### GET /status
Check Google Calendar connection status.

**Response:**
```json
{
  "success": true,
  "connected": true,
  "email": "instructor@gmail.com"
}
```

#### POST /disconnect
Disconnect Google Calendar.

---

## AI Routes

### Base Path: `/api/ai`

#### POST /generate
Generate AI response using Gemini.

**Rate Limit:** 10 requests per minute per IP

**Request Body:**
```json
{
  "prompt": "Explain the concept of variables in programming",
  "maxOutputTokens": 1000,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "ok": true,
  "text": "Variables in programming are...",
  "raw": {
    // Raw Gemini API response
  }
}
```

**Error Response:**
```json
{
  "error": "AI service failed",
  "detail": "Error details (development only)"
}
```

---

## Health Check

#### GET /health
Check API health status.

**Response:**
```json
{
  "success": true,
  "message": "BUKSU Grading System API is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Security Features

### Middleware Protection
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: Request throttling
- **Brute Force Protection**: Login attempt limiting
- **Authentication**: JWT token validation
- **Role-based Authorization**: Access control by user role

### Resource Locking
The system implements resource locking to prevent concurrent edits:
- Acquire lock before editing
- Send periodic heartbeats to maintain lock
- Release lock after editing
- Automatic cleanup of expired locks

### Data Validation
All endpoints include:
- Input validation
- Type checking
- Required field verification
- Business rule validation

---

## Environment Configuration

Required environment variables:
- `MONGO_URI`: MongoDB connection string
- `JWT_ACCESS_SECRET`: JWT access token secret
- `JWT_REFRESH_SECRET`: JWT refresh token secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GEMINI_API_KEY`: Google Gemini API key
- `SMTP_*`: Email configuration
- Additional configuration as needed

---

## Changelog

### Version 1.0.0
- Initial API release
- Complete CRUD operations for all entities
- Google OAuth integration
- AI assistance features
- Export functionality
- Resource locking system

---

This documentation provides comprehensive coverage of the Buksu Grading System API. For additional support or questions, please contact the development team.