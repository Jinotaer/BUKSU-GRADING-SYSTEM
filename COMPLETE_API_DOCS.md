# BUKSU Grading System API Documentation

## 🎓 Project Overview

The **BUKSU Grading System** is a comprehensive web-based platform designed for Bukidnon State University to manage academic grading, student enrollment, and course administration. The system supports three user roles (Admin, Instructor, Student) with role-based access control, Google OAuth authentication, and comprehensive grade management features including activity tracking, section management, and data export capabilities.

## 🔐 Authentication System

### Authentication Methods
- **Google OAuth 2.0**: Primary authentication method for Students and Instructors
- **JWT Tokens**: Used for session management and API authorization
- **Traditional Login**: Admin accounts use email/password authentication

### How Authentication Works

1. **Students** must use `@student.buksu.edu.ph` email domain
2. **Instructors** must use `@gmail.com` email domain (invited by admin)
3. **Admins** use email/password with JWT tokens

### Using JWT Tokens

After successful authentication, you'll receive a JWT token. Include it in all API requests:

```http
Authorization: Bearer your_jwt_token_here
```

### Token Expiration
- **Student/Instructor tokens**: 7 days
- **Admin tokens**: Configurable (default: 24 hours)

---

## 👥 User Roles and Permissions

### 🛡️ Admin Role
**Capabilities:**
- Manage all users (Students, Instructors)
- Create and manage semesters, subjects, sections
- Invite instructors to the platform
- Approve/reject student registrations
- Access system-wide statistics and reports
- Archive/unarchive records
- Manage system locks for data integrity

### 👨‍🏫 Instructor Role  
**Capabilities:**
- View assigned sections and students
- Create and manage activities/assignments
- Input and update student grades
- Export grades to Google Sheets
- Manage student enrollment in sections
- Connect Google Calendar for scheduling
- Search and invite students to sections

### 🎓 Student Role
**Capabilities:**
- Register for an account
- View enrolled sections and subjects
- Check grades and activity scores  
- View activity details and deadlines
- Hide/unhide sections from personal view
- Update personal profile information

---

## 📋 API Modules and Endpoints

## 2.1 AUTHENTICATION MODULE API

Authentication Module API is a crucial component of the system designed to securely authenticate users based on their credentials. This module verifies the identity of users by validating their login credentials (such as email and password) or other authentication factors, ensuring that only authorized users can access protected resources or services.

The API have the following endpoints:
- http://localhost:5000/api/auth/login
- http://localhost:5000/api/auth/logout
- http://localhost:5000/api/auth/google
- http://localhost:5000/api/auth/google/callback

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid input provided |
| 401 | Email or Password Incorrect | Invalid or missing authentication token |
| 403 | User not Activated | Users need to activate their membership before entering the system |
| 404 | User not Found | There are no user entries in the database |
| 423 | Account Locked | Account temporarily locked due to failed attempts |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.1.1.1 Authenticate User and Create Session

**Version:** 1.0

**Date:** October 22, 2024

**Description:** This API endpoint enables the creation of login sessions for secure access to the BUKSU Grading System. It authenticates users based on their email and user type, with brute-force protection to prevent unauthorized access attempts. Error responses are generated for invalid login attempts, including incorrect credentials, unregistered users, unapproved accounts, or missing parameters. This ensures that only registered and approved students or instructors can access the system.

**Endpoint:** http://localhost:5000/api/auth/login

**Method:** POST

**Configurations:** The API implements brute-force protection to ensure secure access. Multiple failed login attempts will result in temporary IP blocking to prevent unauthorized access.

**Parameters:**
➢ email (required) - The user's institutional email address. Should be included in the request body.
➢ userType (required) - The type of user attempting to login (either "student" or "instructor"). Should be included in the request body.
➢ errorMessage (optional) - Returned in the response body to provide details about login issues, such as "Student not registered," "Account not approved yet," or "Too many login attempts."

**Requests:**

**Valid Request:**
```json
{
  "email": "student@student.buksu.edu.ph",
  "userType": "student"
}
```

**Not Valid Request:**
```json
{
  "email": "unregistered@student.buksu.edu.ph",
  "userType": "student"
}
```

**Response Format:** JSON

**Response:**

The POST /api/auth/login endpoint authenticates users and creates secure sessions. A successful login returns HTTP 200 OK with a JWT token and user information. For unregistered users, the server returns HTTP 404 Not Found with an appropriate error message. For unapproved accounts, it returns HTTP 403 Forbidden. Brute-force protection triggers HTTP 423 Locked after multiple failed attempts.

**Successful Authentication (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGFiY2QxMjM0NTY3ODkiLCJlbWFpbCI6InN0dWRlbnRAc3R1ZGVudC5idWtzdS5lZHUucGgiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTczMTc1NDgwMCwiZXhwIjoxNzMyMzU5NjAwfQ.Xx1vQw2yP8kL9mNr3oPqRs7tUv6zAa8bC4dE5fG6hI2jK",
  "user": {
    "id": "674abcd123456789",
    "email": "student@student.buksu.edu.ph",
    "role": "student",
    "fullName": "John Doe"
  }
}
```

**User Not Found Error (404 Not Found):**
```json
{
  "success": false,
  "message": "User not found",
  "errorMessage": "Student not registered"
}
```

**Account Not Approved Error (403 Forbidden):**
```json
{
  "success": false,
  "message": "Account not approved yet",
  "errorMessage": "Student account pending admin approval"
}
```

**Account Locked Error (423 Locked):**
```json
{
  "success": false,
  "message": "Account temporarily locked due to too many failed login attempts",
  "errorMessage": "Too many login attempts",
  "locked": true,
  "timeUntilUnlock": 7200000
}
```

---

### 2.1.1.2 User Logout and Session Termination

**Version:** 1.0

**Date:** October 22, 2024

**Description:** This API endpoint handles secure user logout by invalidating the current session and JWT token. It ensures proper session termination to maintain system security. The endpoint requires authentication and validates the user's token before proceeding with logout. Error responses are generated for invalid tokens, expired sessions, or missing parameters to ensure secure logout procedures.

**Endpoint:** http://localhost:5000/api/auth/logout

**Method:** POST

**Configurations:** Private endpoint requiring valid authentication token. The API validates the user's session before processing the logout request.

**Parameters:**
➢ token (required) - The JWT token provided during login. Should be included in the request body.
➢ userId (required) - The user ID to log out. Should be included in the request body.
➢ errorMessage (optional) - Returned in the response body to provide details about logout issues, such as "Invalid token" or "Session expired."

**Requests:**

**Valid Request:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGFiY2QxMjM0NTY3ODkiLCJlbWFpbCI6InN0dWRlbnRAc3R1ZGVudC5idWtzdS5lZHUucGgiLCJyb2xlIjoic3R1ZGVudCIsImlhdCI6MTczMTc1NDgwMCwiZXhwIjoxNzMyMzU5NjAwfQ.Xx1vQw2yP8kL9mNr3oPqRs7tUv6zAa8bC4dE5fG6hI2jK",
  "userId": "674abcd123456789"
}
```

**Not Valid Request:**
```json
{
  "token": "invalid_token_here",
  "userId": "674abcd123456789"
}
```

**Response Format:** JSON

**Response:**

The POST /api/auth/logout endpoint terminates user sessions securely. A successful logout returns HTTP 200 OK with confirmation message. For invalid tokens, the server returns HTTP 401 Unauthorized. For expired sessions, it returns HTTP 401 Unauthorized with appropriate error details. Missing parameters result in HTTP 400 Bad Request response.

**Successful Logout (200 OK):**
```json
{
  "success": true,
  "message": "Logout successful",
  "timestamp": "2024-10-22T14:30:00.000Z"
}
```

**Invalid Token Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid token",
  "errorMessage": "Token verification failed"
}
```

**Missing Parameters Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required parameters",
  "errorMessage": "Token and userId are required"
}
```

---

### 2.1.1.3 Google OAuth Authentication Initiation

**Version:** 1.0

**Date:** October 22, 2024

**Description:** This API endpoint initiates the Google OAuth authentication flow for institutional users within the BUKSU Grading System. It redirects users to Google's consent screen where they can authenticate using their institutional Google accounts. The endpoint validates email domains to ensure only authorized students (@student.buksu.edu.ph) and instructors (@gmail.com) can access the system. Error responses handle unauthorized domains and authentication failures.

**Endpoint:** http://localhost:5000/api/auth/google

**Method:** GET

**Configurations:** Public endpoint with no authentication required. The API automatically redirects users to Google OAuth consent screen with appropriate scopes for profile and email access.

**Parameters:**
➢ scope (optional) - OAuth scopes automatically set to ["profile", "email"]. System-controlled parameter.
➢ prompt (optional) - Set to "select_account" to force account selection. System-controlled parameter.
➢ errorMessage (optional) - Returned in case of OAuth initialization errors.

**Requests:**

**Valid Request:**
```http
GET /api/auth/google HTTP/1.1
Host: localhost:5000
```

**Not Valid Request:**
```http
GET /api/auth/google HTTP/1.1
Host: localhost:5000
X-Forwarded-For: blocked_ip_address
```

**Response Format:** HTTP Redirect

**Response:**

The GET /api/auth/google endpoint initiates OAuth flow by redirecting to Google's consent screen. Successful initiation returns HTTP 302 Redirect to Google OAuth with proper parameters. For blocked IPs or system errors, it returns appropriate error responses.

**Successful OAuth Initiation (302 Redirect):**
```
HTTP/1.1 302 Found
Location: https://accounts.google.com/oauth/authorize?client_id=your_client_id&redirect_uri=http://localhost:5000/api/auth/google/callback&response_type=code&scope=profile%20email&prompt=select_account
```

---

### 2.1.1.4 Google OAuth Callback Handler

**Version:** 1.0

**Date:** October 22, 2024

**Description:** This API endpoint handles the callback from Google OAuth authentication and processes user verification for the BUKSU Grading System. It receives the authorization code from Google, validates user email domains, creates or authenticates existing users, and establishes secure sessions with JWT tokens. Error responses handle authentication failures, unauthorized domains, account approval status, and system errors during the OAuth process.

**Endpoint:** http://localhost:5000/api/auth/google/callback

**Method:** GET

**Configurations:** Public callback endpoint handled by Passport.js middleware. The API processes OAuth authorization codes and creates secure user sessions.

**Parameters:**
➢ code (required) - OAuth authorization code from Google. Automatically included by Google in callback URL.
➢ state (optional) - State parameter for CSRF protection. System-controlled parameter.
➢ errorMessage (optional) - Returned for authentication failures, domain validation errors, or account approval issues.

**Requests:**

**Valid Request:**
```http
GET /api/auth/google/callback?code=4/0AX4XfWjYX9Z8V7B6C5D4E3F2G1H0I9J8K7L6M5N4O3P2Q1R0S9T8U7V6W5X4Y3Z2A1B0&state=security_token HTTP/1.1
Host: localhost:5000
```

**Not Valid Request:**
```http
GET /api/auth/google/callback?error=access_denied&state=security_token HTTP/1.1
Host: localhost:5000
```

**Response Format:** HTTP Redirect

**Response:**

The GET /api/auth/google/callback endpoint processes OAuth responses and creates user sessions. Successful authentication redirects to appropriate dashboards with JWT tokens. Authentication failures redirect to login page with error parameters. Account approval issues redirect with specific error messages.

**Successful Student Authentication (302 Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5173/student/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Successful Instructor Authentication (302 Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5173/instructor/dashboard?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Set-Cookie: auth_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
```

**Authentication Failed Error (302 Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5173/login?error=auth_failed&message=Authentication failed. Please try again.
```

**Account Not Approved Error (302 Redirect):**
```
HTTP/1.1 302 Found
Location: http://localhost:5173/login?error=not_approved&message=Student account pending admin approval.
```

---

## 2.2 ADMIN MANAGEMENT MODULE API

Admin Management Module API is a comprehensive component designed for system administrators to manage all aspects of the BUKSU Grading System. This module provides centralized control over user management, system configuration, and administrative oversight. It enables administrators to manage students, instructors, academic structures, and system-wide settings.

The API have the following endpoints:
- http://localhost:5000/api/admin/login
- http://localhost:5000/api/admin/dashboard/stats
- http://localhost:5000/api/admin/instructors/invite
- http://localhost:5000/api/admin/students
- http://localhost:5000/api/admin/students/:studentId/status

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input provided |
| 401 | Unauthorized | Invalid or missing admin token |
| 403 | Forbidden | Insufficient admin privileges |
| 409 | Conflict | Resource already exists |
| 423 | Locked | Account temporarily locked |
| 500 | Internal Server Error | The server encountered an error |

---

### 2.2.1 Admin Authentication

#### 2.2.1.1 Admin Login and Session Creation

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint enables secure admin authentication using email and password credentials for accessing the BUKSU Grading System administrative dashboard. It implements comprehensive brute-force protection that temporarily locks accounts after 5 consecutive failed login attempts for 2 hours to prevent unauthorized access. The endpoint validates admin credentials against the database, generates JWT tokens for session management, and returns complete admin profile information upon successful authentication. Error responses handle invalid credentials, account lockouts, missing parameters, and system errors to ensure robust security measures.

**Endpoint:** http://localhost:5000/api/admin/login

**Method:** POST

**Configurations:** Public endpoint with advanced brute-force protection middleware that monitors failed login attempts per IP address and email combination. The system implements progressive delays and temporary account lockouts to enhance security.

**Parameters:**
➢ email (required) - The administrator's institutional email address. Should be included in the request body and must match registered admin account.
➢ password (required) - The administrator's secure password. Should be included in the request body and will be validated against bcrypt hash stored in database.
➢ errorMessage (optional) - Returned in the response body to provide specific details about login issues, such as "Invalid credentials," "Account locked," or "Too many attempts."

**Requests:**

**Valid Request:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "SecureAdminPass123!"
}
```

**Not Valid Request:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "wrongpassword"
}
```

**Response Format:** JSON

**Response:**

The POST /api/admin/login endpoint authenticates administrators and creates secure admin sessions. A successful login returns HTTP 200 OK with a JWT token and complete admin information. For invalid credentials, the server returns HTTP 401 Unauthorized with an appropriate error message. Account lockouts trigger HTTP 423 Locked after multiple failed attempts. Missing parameters result in HTTP 400 Bad Request response.

**Successful Authentication (200 OK):**
```json
{
  "success": true,
  "message": "Admin login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NGFiY2QxMjM0NTY3ODkiLCJlbWFpbCI6ImFkbWluQGJ1a3N1LmVkdS5waCIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTczMTc1NDgwMCwiZXhwIjoxNzMyMzU5NjAwfQ.Xx1vQw2yP8kL9mNr3oPqRs7tUv6zAa8bC4dE5fG6hI2jK",
  "admin": {
    "id": "674abcd123456789",
    "email": "admin@buksu.edu.ph",
    "fullName": "System Administrator",
    "role": "Admin",
    "lastLogin": "2024-11-16T10:30:00.000Z"
  }
}
```

**Invalid Credentials Error (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorMessage": "Authentication failed - credentials do not match"
}
```

**Account Locked Error (423 Locked):**
```json
{
  "success": false,
  "message": "Account temporarily locked due to too many failed login attempts",
  "errorMessage": "Account locked for security - 5 failed attempts detected",
  "locked": true,
  "timeUntilUnlock": 7200000,
  "failedAttempts": 5,
  "lockoutExpiry": "2024-11-16T12:30:00.000Z"
}
```

**Missing Parameters Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Missing required parameters",
  "errorMessage": "Email and password are required for admin authentication"
}
```

#### 2.2.1.2 Get Administrative Dashboard Statistics

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint retrieves comprehensive administrative dashboard statistics providing a complete overview of the BUKSU Grading System's current operational status. It aggregates real-time data across all system modules including total registered students, active instructors, created sections, pending student approvals, active semesters, and various system metrics. The endpoint requires admin authentication and provides essential analytics for administrative decision-making, system monitoring, and operational oversight. Error responses handle authentication failures, insufficient permissions, and database connectivity issues to ensure reliable data access.

**Endpoint:** http://localhost:5000/api/admin/dashboard/stats

**Method:** GET

**Configurations:** Private endpoint requiring valid admin JWT authentication. The API aggregates data from multiple database collections and provides cached results for optimal performance.

**Request Parameters:**

| Name | Required | Type | Location | Description |
|------|----------|------|----------|-------------|
| Authorization | Yes | String | Header | Bearer token format: "Bearer {admin_jwt_token}" |

**Response Parameters:**

| Name | Type | Description |
|------|------|-------------|
| success | Boolean | Indicates if the request was successful |
| stats | Object | Statistics object containing dashboard data |
| stats.totalStudents | Number | Total number of registered students |
| stats.totalInstructors | Number | Total number of active instructors |
| stats.totalSections | Number | Total number of created sections |
| stats.pendingApprovals | Number | Number of students pending approval |
| stats.activeSemesters | Number | Number of currently active semesters |

**Response Format:** JSON

**Responses:**

Successful Response (200 OK):
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

---

### 2.2.2 Instructor Management

#### 2.2.2.1 Invite New Instructor to Platform

**Version:** 1.0

**Date:** November 16, 2025

**Description:** This API endpoint enables administrators to invite new instructors to join the BUKSU Grading System platform by creating their accounts and automatically activating their access. The endpoint validates instructor information, checks for duplicate accounts, creates complete instructor profiles with institutional affiliation details, and generates secure access credentials. It implements comprehensive validation for Gmail domain requirements, unique instructor ID constraints, and department authorization. Error responses handle duplicate emails, invalid institutional data, missing required parameters, and authentication failures to ensure proper instructor onboarding procedures.

**Endpoint:** http://localhost:5000/api/admin/instructors/invite

**Method:** POST

**Configurations:** Private endpoint requiring admin authentication with role validation. The API implements instructor ID uniqueness checks and email domain validation for Gmail accounts only.

**Parameters:**
➢ Authorization (required) - Admin JWT token in Bearer format. Should be included in the request header as "Bearer {admin_jwt_token}".
➢ email (required) - Instructor's Gmail address for platform access. Should be included in the request body and must use @gmail.com domain.
➢ fullName (required) - Complete instructor name for identification purposes. Should be included in the request body with proper capitalization.
➢ college (required) - Institution's college or major department affiliation. Should be included in the request body with official college name.
➢ department (required) - Specific academic department within the college structure. Should be included in the request body with exact department designation.
➢ instructorid (required) - Unique institutional instructor identifier for system tracking. Should be included in the request body and must be unique across the platform.
➢ errorMessage (optional) - Returned in the response body to provide details about invitation issues, such as "Email already exists," "Invalid department," or "Missing required fields."

**Requests:**

**Valid Request:**
```json
{
  "email": "jane.smith@gmail.com",
  "fullName": "Dr. Jane Marie Smith",
  "college": "College of Engineering and Information Technology",
  "department": "Computer Science Department",
  "instructorid": "CEIT-CS-2024-001"
}
```

**Not Valid Request:**
```json
{
  "email": "existing.instructor@gmail.com",
  "fullName": "Already Registered Instructor",
  "college": "College of Engineering",
  "department": "Computer Science",
  "instructorid": "EXISTING-ID-001"
}
```

**Response Format:** JSON

**Response:**

The POST /api/admin/instructors/invite endpoint creates new instructor accounts and activates platform access. A successful invitation returns HTTP 201 Created with complete instructor information and account details. For duplicate emails, the server returns HTTP 409 Conflict with specific error details. For invalid departments or missing authentication, appropriate error responses are generated with detailed error messages.

**Successful Instructor Invitation (201 Created):**
```json
{
  "success": true,
  "message": "Instructor invited and account created successfully",
  "instructor": {
    "id": "674def123456789a",
    "email": "jane.smith@gmail.com",
    "fullName": "Dr. Jane Marie Smith",
    "college": "College of Engineering and Information Technology",
    "department": "Computer Science Department",
    "instructorid": "CEIT-CS-2024-001",
    "status": "Active",
    "createdAt": "2024-11-16T10:30:00.000Z",
    "invitedBy": "674abcd123456789"
  },
  "credentials": {
    "loginUrl": "http://localhost:5173/login",
    "authMethod": "Google OAuth"
  }
}
```

**Duplicate Email Error (409 Conflict):**
```json
{
  "success": false,
  "message": "Instructor account already exists",
  "errorMessage": "An instructor with email 'jane.smith@gmail.com' is already registered in the system"
}
```

**Invalid Department Error (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid department specified",
  "errorMessage": "Department must be a valid institutional department within the specified college"
}
```

**Duplicate Instructor ID Error (409 Conflict):**
```json
{
  "success": false,
  "message": "Instructor ID already in use",
  "errorMessage": "Instructor ID 'CEIT-CS-2024-001' is already assigned to another instructor"
}
```

---

## 3. CAPTCHA Module API

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