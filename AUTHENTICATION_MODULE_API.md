![alt text](image.png)# 2.1 AUTHENTICATION AND GENERAL MODULE API

## 2.1.1 Module Description

The BUKSU Grading System provides endpoints to manage user authentication, session operations, profile management, user verification, profile retrieval and updates, OTP generation and verification, and session termination. Each endpoint ensures secure and clear communication of request outcomes, using comprehensive response codes: 200 (OK) for successful operations, 201 (Created) for resource creation, 400 (Bad Request) for invalid input, 401 (Unauthorized) for missing or invalid tokens, 403 (Forbidden) for insufficient permissions, 404 (Not Found) for unavailable resources, 423 (Locked) for temporarily locked accounts, 429 (Too Many Requests) for rate limiting, and 500 (Internal Server Error) for server issues, ensuring secure and clear communication of request outcomes.

The API have the following endpoints:

**Authentication Routes:**
```
http://localhost:5000/api/auth/validate-email
http://localhost:5000/api/auth/login
http://localhost:5000/api/auth/google
http://localhost:5000/api/auth/google/callback
http://localhost:5000/api/auth/me
http://localhost:5000/api/auth/logout
http://localhost:5000/api/auth/status
```

**Admin Authentication Routes:**
```
http://localhost:5000/api/admin/login
http://localhost:5000/api/admin/refresh-token
http://localhost:5000/api/admin/request-reset-password
http://localhost:5000/api/admin/verify-reset-code
http://localhost:5000/api/admin/reset-password
http://localhost:5000/api/admin/profile
```

**Response codes of this API:**

| Code | Message | Description |
|------|---------|-------------|
| 500 | Internal Server Error | The server encountered an unexpected condition that prevented it from fulfilling the request. |
| 429 | Too Many Requests | The client sends too many requests within a certain period. |
| 423 | Locked | Account is temporarily locked due to too many failed login attempts. |
| 404 | Not Found | The requested resource could not be found. |
| 403 | Forbidden/Restricted | Invalid token or token expired / Insufficient permissions |
| 401 | Unauthorized | The request was not successful because it lacks valid authentication credentials. |
| 400 | Bad Request | The request was invalid. |
| 201 | Created | The request was successful, and a new resource has been created. |
| 200 | OK | The request is successful, the resource is in the message body. |

---

## 2.1.2 API Endpoints

### 2.1.2.1 Validate Institutional Email Domain

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint validates the institutional email domain before authentication to ensure that only users with valid BUKSU email addresses (@student.buksu.edu.ph for students or @gmail.com for instructors) can proceed with the login process. Error responses are generated for invalid email domains or missing parameters.

**Endpoint:** http://localhost:5000/api/auth/validate-email

**Method:** POST

**Configurations:**
This is a public endpoint and does not require authentication tokens.

**Parameters:**
➢ **email** – this is required to specify the institutional email address to validate. It should be a valid BUKSU student email (@student.buksu.edu.ph) or instructor email (@gmail.com). It should be included in the request body.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about validation issues, such as "Invalid email domain" or "Email is required."

**Requests:**

Valid Request:
```json
{
  "email": "student@student.buksu.edu.ph"
}
```

Not Valid Request:
```json
{
  "email": "invalid@example.com"
}
```

**Response Format:** JSON

**Responses:**

The API response validates the email domain and returns the user role.

Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Valid student email",
  "role": "student",
  "emailDomain": "@student.buksu.edu.ph"
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid email domain. Use @student.buksu.edu.ph for students or @buksu.edu.ph for instructors",
  "allowedDomains": [
    "@student.buksu.edu.ph (for students)",
    "@buksu.edu.ph (for instructors)"
  ]
}
```

---

### 2.1.2.2 Authenticate User and Create Session

**Endpoint:** POST /api/auth/login

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint enables the creation of login sessions for secure access to the BUKSU Grading System. It authenticates users based on their email and user type, with brute-force protection to prevent unauthorized access attempts. Error responses are generated for invalid login attempts, including incorrect credentials, unregistered users, unapproved accounts, or missing parameters. This ensures that only registered and approved students or instructors can access the system.

**Endpoint:** `http://localhost:5000/api/auth/login`

**Method:** POST

**Access:** Public

**Security:** Protected by brute-force middleware with rate limiting

**Configurations:**
The API implements brute-force protection to ensure secure access. Multiple failed login attempts will result in temporary IP blocking to prevent unauthorized access.

**Parameters:**
- `email` (required) - The user's institutional email address. Should be included in the request body.
- `userType` (required) - The type of user attempting to login (either "student" or "instructor"). Should be included in the request body.
- `errorMessage` (optional) - Returned in the response body to provide details about login issues, such as "Student not registered," "Account not approved yet," or "Too many login attempts."

**Request Body:**
```json
{
  "email": "student@student.buksu.edu.ph",
  "userType": "student"
}
```

**Response Format:** JSON

**Response:**

The API response creates a user session and returns user information with authentication token.

**Valid Response (200 OK):**
```json
{
  "success": true,
  "message": "Student login successful",
  "user": {
    "id": "6478abc123def456",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Doe",
    "role": "student",
    "status": "Approved",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 3
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Invalid Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Student not registered"
}
```

**Invalid Response (403 Forbidden):**
```json
{
  "success": false,
  "message": "Account not approved yet"
}
```

**Invalid Response (429 Too Many Requests):**
```json
{
  "success": false,
  "message": "Too many login attempts. Please try again later."
}
```

---

### 2.1.2.3 Initiate Google OAuth Authentication

**Endpoint:** GET /api/auth/google

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint initiates the Google OAuth 2.0 authentication flow for secure user login. It redirects users to Google's consent screen where they can select their BUKSU institutional account and grant permission for the system to access their profile and email information. This endpoint is the entry point for Google-based authentication in the BUKSU Grading System.

**Endpoint:** `http://localhost:5000/api/auth/google`

**Method:** GET

**Access:** Public

**Configurations:**
This endpoint does not require authentication tokens. It automatically redirects to Google's OAuth consent screen with the necessary scopes (profile and email) and forces account selection.

**Parameters:**
- `prompt` (automatic) - Set to "select_account" to force Google account selection screen.
- `scope` (automatic) - Includes "profile" and "email" permissions.

**Response Format:** JSON

**Responses:**

The API redirects to Google OAuth consent screen for user authentication.

**Valid Response:**
Redirects to Google OAuth consent screen at:
```
https://accounts.google.com/o/oauth2/v2/auth?...
```

---

### 2.1.2.4 Verify Google User Authentication

**Endpoint:** GET /api/auth/google/callback

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint handles the callback from Google OAuth after user authentication. It verifies the user's identity, checks their registration and approval status, creates a JWT session token, and redirects them to the appropriate dashboard based on their role. Error responses are generated for unregistered users, unapproved accounts, invalid email domains, or authentication failures.

**Endpoint:** `http://localhost:5000/api/auth/google/callback`

**Method:** GET

**Access:** Public (OAuth callback)

**Configurations:**
This endpoint is called automatically by Google OAuth after user authentication. It processes the authentication code, creates a session, and sets authentication cookies.

**Parameters:**
- `code` (automatic) - OAuth authorization code from Google. Sent by Google in the URL query.
- `token` (generated) - JWT token created after successful authentication. Included in the redirect URL and set as HTTP-only cookie.
- `errorMessage` (optional) - Returned in redirect URL to provide details about authentication issues.

**Response Format:** JSON

**Responses:**

The API verifies Google authentication and redirects to the appropriate dashboard.

**Valid Response:**
Redirects to frontend dashboard with token:
- Students: `http://localhost:5173/student/dashboard?token={JWT_TOKEN}`
- Instructors: `http://localhost:5173/instructor/dashboard?token={JWT_TOKEN}`

**Invalid Response:**
Redirects to login page with error parameters:
- `?error=unregistered_student&message=Student account not found. Please register first.`
- `?error=not_approved&message=Student account pending admin approval.`
- `?error=not_invited&message=Instructor not invited. Contact admin for access.`
- `?error=invalid_domain&message=Invalid email domain.`
- `?error=auth_failed&message=Authentication failed. Please try again.`

---

### 2.1.2.5 Retrieve Authenticated User Profile

**Endpoint:** GET /api/auth/me

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint retrieves the current authenticated user's profile information based on their JWT token. It returns user details including ID, email, full name, role, and role-specific information (college, course for students; college, department for instructors). Error responses are generated for missing or invalid authentication tokens.

**Endpoint:** `http://localhost:5000/api/auth/me`

**Method:** GET

**Access:** Private (Requires authentication)

**Configurations:**
The API request must be authenticated to ensure secure access. The request must include a valid JWT token in the Authorization header to verify the identity of the user making the request.

**Parameters:**
- `token` (required) - Valid JWT authentication token. Should be sent in the Authorization header as "Bearer {token}".
- `errorMessage` (optional) - Returned in the response body to provide details about authentication issues, such as "Not authenticated" or "Token expired."

**Response Format:** JSON

**Responses:**

The API response returns the authenticated user's profile information.

**Valid Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "6478abc123def456",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Doe",
    "role": "student",
    "status": "Approved",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 3
  }
}
```

**Invalid Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

### 2.1.2.6 Terminate User Session and Logout

**Endpoint:** POST /api/auth/logout

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint terminates the current user's session, destroys all session data, and clears authentication cookies to ensure secure logout from the BUKSU Grading System. Error responses are generated if the session destruction fails.

**Endpoint:** `http://localhost:5000/api/auth/logout`

**Method:** POST

**Access:** Private

**Configurations:**
The API request should include a valid JWT token in the Authorization header. The endpoint will clear authentication cookies and destroy the user's session data.

**Parameters:**
- `token` (optional) - Valid JWT authentication token. Should be sent in the Authorization header as "Bearer {token}".
- `errorMessage` (optional) - Returned in the response body to provide details about logout issues, such as "Error during logout" or "Error destroying session."

**Headers:**
```
Authorization: Bearer {access_token}
```

**Response Format:** JSON

**Responses:**

The API response confirms session termination and logout status.

**Valid Response (200 OK):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Invalid Response (500 Internal Server Error):**
```json
{
  "success": false,
  "message": "Error during logout"
}
```

---

### 2.1.2.7 Check Authentication Status

**Endpoint:** GET /api/auth/status

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint checks the current authentication status of a user without requiring authentication credentials. It returns information about whether the user is currently logged in and their role in the system. This is useful for frontend applications to determine the user's authentication state.

**Endpoint:** `http://localhost:5000/api/auth/status`

**Method:** GET

**Access:** Public

**Configurations:**
This is a public endpoint that does not require authentication. It checks for existing session tokens or JWT tokens in cookies/query parameters.

**Parameters:**
- `token` (optional) - JWT token from cookies or query parameters. Automatically checked by the system.
- `errorMessage` (optional) - Returned in the response body if there are issues checking authentication status.

**Response Format:** JSON

**Responses:**

The API response returns the current authentication status of the user.

**Valid Response (200 OK) - Authenticated:**
```json
{
  "success": true,
  "authenticated": true,
  "role": "student",
  "user": {
    "id": "6478abc123def456",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Doe"
  }
}
```

**Valid Response (200 OK) - Not Authenticated:**
```json
{
  "success": true,
  "authenticated": false,
  "role": null,
  "user": null
}
```

---

### 2.1.2.8 Authenticate Administrator and Create Admin Session

**Endpoint:** POST /api/admin/login

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint enables the creation of admin login sessions for secure access to the BUKSU Grading System administrative panel. It authenticates administrators based on their email and password credentials, with brute-force protection and account lockout mechanisms (2 hours after 5 failed attempts) to prevent unauthorized access. Error responses are generated for invalid login attempts, including incorrect credentials, inactive accounts, or locked accounts due to security measures.

**Endpoint:** `http://localhost:5000/api/admin/login`

**Method:** POST

**Access:** Public

**Security:** Protected by brute-force middleware with account lockout (2 hours after multiple failed attempts)

**Configurations:**
The API implements advanced brute-force protection with account lockout to ensure secure access. Failed login attempts are tracked, and after reaching the maximum threshold, the account is temporarily locked for 2 hours.

**Parameters:**
- `email` (required) - The administrator's email address. Should be included in the request body.
- `password` (required) - The administrator's password. Should be included in the request body for secure authentication.
- `errorMessage` (optional) - Returned in the response body to provide details about login issues, such as "Invalid credentials," "Account is temporarily locked," or "Account not active."

**Request Body:**
```json
{
  "email": "admin@buksu.edu.ph",
  "password": "securePassword123"
}
```

**Response Format:** JSON

**Responses:**

The API response creates an admin session and returns admin information with authentication tokens.

**Valid Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "admin": {
    "id": "6478abc123def456",
    "email": "admin@buksu.edu.ph",
    "fullName": "Admin User",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "status": "Active",
    "lastLogin": "2024-11-15T10:30:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Invalid Response (401 Unauthorized):**
```json
{
  "success": false,
  "message": "Invalid credentials. Please try again. 2 attempts remaining.",
  "remainingAttempts": 2,
  "locked": false
}
```

**Invalid Response (423 Locked):**
```json
{
  "success": false,
  "message": "Account is temporarily locked due to too many failed login attempts. Please try again in 2 hours.",
  "locked": true,
  "timeUntilUnlock": "2024-11-15T12:30:00.000Z",
  "failedAttempts": 5
}
```

---

### 2.1.2.9 Refresh Administrator Access Token

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint generates a new admin access token using a valid refresh token to maintain secure session continuity without requiring re-authentication. Error responses are generated for invalid or expired refresh tokens.

**Endpoint:** http://localhost:5000/api/admin/refresh-token

**Method:** POST

**Configurations:**
The API request must be authenticated using a valid refresh token. The request must include the refresh token in the Authorization header to verify the identity of the administrator.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The refresh token should be sent in the Authorization header as "Bearer {refresh_token}".
➢ **errorMessage** – this is optional and is returned in the response body to provide details about token refresh issues, such as "Invalid or expired refresh token."

**Requests:**

Valid Request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** JSON

**Responses:**

The API response returns a new access token for continued session access.

Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Error Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Invalid or expired refresh token"
}
```

---

### 2.1.2.10 Request Password Reset Code

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint initiates the password reset process by generating a 6-digit OTP code and sending it to the administrator's registered email address. The code expires after 15 minutes for security purposes. Returns success response regardless of whether the email exists to prevent email enumeration attacks.

**Endpoint:** http://localhost:5000/api/admin/request-reset-password

**Method:** POST

**Configurations:**
This is a public endpoint and does not require authentication tokens. The system generates a secure 6-digit OTP code with 15-minute expiration.

**Parameters:**
➢ **email** – this is required to specify the administrator's email address. It should be included in the request body.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about the password reset request, such as "Failed to send reset code email."

**Requests:**

Valid Request:
```json
{
  "email": "admin@buksu.edu.ph"
}
```

Not Valid Request:
```json
{
  "email": ""
}
```

**Response Format:** JSON

**Responses:**

The API response confirms the password reset code has been sent to the email.

Successful Response (200 OK):
```json
{
  "ok": true,
  "message": "Reset code sent to email"
}
```

**Note:** Returns success even if email doesn't exist (security measure to prevent email enumeration)

Error Response (500 Internal Server Error):
```json
{
  "error": "Failed to send reset code email"
}
```

---

### 2.1.2.11 Verify Password Reset Code

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint validates the 6-digit OTP code sent to the administrator's email during the password reset process. It checks if the code is valid and has not expired (15-minute validity). Error responses are generated for invalid codes, expired codes, or missing reset requests.

**Endpoint:** http://localhost:5000/api/admin/verify-reset-code

**Method:** POST

**Configurations:**
This is a public endpoint and does not require authentication tokens. The system validates the OTP code against stored reset requests.

**Parameters:**
➢ **passcode** – this is required to specify the 6-digit OTP code received via email. It should be included in the request body.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about code verification issues, such as "Invalid code," "Code expired," or "No reset request found."

**Requests:**

Valid Request:
```json
{
  "passcode": "123456"
}
```

Not Valid Request:
```json
{
  "passcode": "000000"
}
```

**Response Format:** JSON

**Responses:**

The API response confirms whether the password reset code is valid.

Successful Response (200 OK):
```json
{
  "ok": true,
  "message": "Code verified successfully"
}
```

Error Response (400 Bad Request):
```json
{
  "message": "Invalid code"
}
```

Error Response (400 Bad Request):
```json
{
  "message": "Code expired"
}
```

Error Response (400 Bad Request):
```json
{
  "message": "No reset request found"
}
```

---

### 2.1.2.12 Reset Administrator Password

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint completes the password reset process by updating the administrator's password after successful OTP verification. It validates the passcode, updates the password with bcrypt hashing, and cleans up all reset records. Error responses are generated for invalid codes, expired codes, or missing admin accounts.

**Endpoint:** http://localhost:5000/api/admin/reset-password

**Method:** POST

**Configurations:**
This is a public endpoint and does not require authentication tokens. The system validates the OTP code before allowing password reset.

**Parameters:**
➢ **passcode** – this is required to specify the 6-digit OTP code for verification. It should be included in the request body.
➢ **newPassword** – this is required to specify the new administrator password. It should be included in the request body and will be securely hashed using bcrypt.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about password reset issues, such as "Invalid code," "Code expired," or "Admin not found."

**Requests:**

Valid Request:
```json
{
  "passcode": "123456",
  "newPassword": "newSecurePassword123"
}
```

Not Valid Request:
```json
{
  "passcode": "123456",
  "newPassword": ""
}
```

**Response Format:** JSON

**Responses:**

The API response confirms the password has been successfully reset.

Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Password successfully updated"
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid code"
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "Code expired"
}
```

Error Response (404 Not Found):
```json
{
  "success": false,
  "message": "Admin not found"
}
```

---

### 2.1.2.13 Retrieve Administrator Profile Information

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint retrieves the current authenticated administrator's profile information based on their JWT access token. It returns admin details including ID, email, full name, role, status, last login timestamp, and account creation date. Error responses are generated for missing or invalid authentication tokens.

**Endpoint:** http://localhost:5000/api/admin/profile

**Method:** GET

**Configurations:**
The API request must be authenticated to ensure secure access to admin profile data. The request must include a valid admin access token in the Authorization header to verify the identity of the administrator.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The access token should be sent in the Authorization header as "Bearer {access_token}".
➢ **errorMessage** – this is optional and is returned in the response body to provide details about authentication issues, such as "Admin not found" or "Token expired."

**Requests:**

Valid Request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** JSON

**Responses:**

The API response returns the administrator's profile information.

Successful Response (200 OK):
```json
{
  "success": true,
  "admin": {
    "id": "6478abc123def456",
    "email": "admin@buksu.edu.ph",
    "fullName": "Admin User",
    "firstName": "Admin",
    "lastName": "User",
    "role": "Admin",
    "status": "Active",
    "lastLogin": "2024-11-15T10:30:00.000Z",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Error Response (404 Not Found):
```json
{
  "success": false,
  "message": "Admin not found"
}
```

Error Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

---

### 2.1.2.14 Register New Student Account

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint registers a new student account with automatic approval. It creates a student record with all required information including student ID, institutional email, personal details, college, course, and year level. The account is automatically activated upon successful registration.

**Endpoint:** http://localhost:5000/api/student/register

**Method:** POST

**Configurations:**
This is a public endpoint and does not require authentication tokens. The system automatically approves the registration upon successful validation.

**Parameters:**
➢ **studid** – this is required to specify the student's unique identification number.
➢ **email** – this is required to specify the student's institutional email address (@student.buksu.edu.ph).
➢ **firstName** – this is required to specify the student's first name.
➢ **lastName** – this is required to specify the student's last name.
➢ **college** – this is required to specify the student's college.
➢ **course** – this is required to specify the student's course/program.
➢ **yearLevel** – this is required to specify the student's current year level (1-4).
➢ **googleId** – this is required to specify the unique Google account identifier.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about registration issues, such as "Student with this email or ID already exists" or "All fields are required."

**Requests:**

Valid Request:
```json
{
  "studid": "2024-00123",
  "email": "student@student.buksu.edu.ph",
  "firstName": "John",
  "lastName": "Doe",
  "college": "College of Computing",
  "course": "Computer Science",
  "yearLevel": 1,
  "googleId": "google_unique_id"
}
```

Not Valid Request:
```json
{
  "studid": "2024-00123",
  "email": "student@student.buksu.edu.ph"
}
```

**Response Format:** JSON

**Responses:**

The API response confirms successful student registration.

Successful Response (201 Created):
```json
{
  "success": true,
  "message": "Student registered successfully and automatically approved",
  "student": {
    "id": "6478abc123def456",
    "studid": "2024-00123",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Doe",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 1,
    "status": "Approved",
    "createdAt": "2024-11-15T10:30:00.000Z"
  }
}
```

Error Response (409 Conflict):
```json
{
  "success": false,
  "message": "Student with this email or ID already exists"
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "All fields are required: studid, email, firstName, lastName, college, course, yearLevel"
}
```

---

### 2.1.2.15 Retrieve Student Profile Information

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint retrieves the current authenticated student's profile information based on their JWT access token. It returns student details including ID, student number, email, full name, college, course, year level, status, and account creation date. Error responses are generated for missing or invalid student tokens.

**Endpoint:** http://localhost:5000/api/student/profile

**Method:** GET

**Configurations:**
The API request must be authenticated to ensure secure access to student profile data. The request must include a valid student access token in the Authorization header to verify the identity of the student.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The access token should be sent in the Authorization header as "Bearer {access_token}".
➢ **errorMessage** – this is optional and is returned in the response body to provide details about authentication issues, such as "Access denied. Student token required."

**Requests:**

Valid Request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** JSON

**Responses:**

The API response returns the student's profile information.

Successful Response (200 OK):
```json
{
  "success": true,
  "student": {
    "id": "6478abc123def456",
    "studid": "2024-00123",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Doe",
    "firstName": "John",
    "lastName": "Doe",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 3,
    "status": "Approved",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Error Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Access denied. Student token required."
}
```

---

### 2.1.2.16 Update Student Profile Information

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint allows authenticated students to update their profile information including first name, last name, and year level. The endpoint validates the student's identity through their JWT access token and updates the specified fields. Error responses are generated for invalid update data or authentication issues.

**Endpoint:** http://localhost:5000/api/student/profile

**Method:** PUT

**Configurations:**
The API request must be authenticated to ensure secure access to student profile updates. The request must include a valid student access token in the Authorization header to verify the identity of the student.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The access token should be sent in the Authorization header as "Bearer {access_token}".
➢ **firstName** – this is optional and can be updated in the request body.
➢ **lastName** – this is optional and can be updated in the request body.
➢ **yearLevel** – this is optional and can be updated in the request body (1-4).
➢ **errorMessage** – this is optional and is returned in the response body to provide details about update issues, such as "Invalid update data."

**Requests:**

Valid Request:
```json
{
  "firstName": "John",
  "lastName": "Smith",
  "yearLevel": 4
}
```

Not Valid Request:
```json
{
  "yearLevel": 10
}
```

**Response Format:** JSON

**Responses:**

The API response confirms successful profile update.

Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "student": {
    "id": "6478abc123def456",
    "studid": "2024-00123",
    "email": "student@student.buksu.edu.ph",
    "fullName": "John Smith",
    "firstName": "John",
    "lastName": "Smith",
    "college": "College of Computing",
    "course": "Computer Science",
    "yearLevel": 4,
    "status": "Approved"
  }
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid update data"
}
```

---

### 2.1.2.17 Retrieve Instructor Profile Information

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint retrieves the current authenticated instructor's profile information based on their JWT access token. It returns instructor details including ID, instructor number, email, full name, college, department, status, invited by, and account creation date. Error responses are generated for missing or invalid instructor tokens.

**Endpoint:** http://localhost:5000/api/instructor/profile

**Method:** GET

**Configurations:**
The API request must be authenticated to ensure secure access to instructor profile data. The request must include a valid instructor access token in the Authorization header to verify the identity of the instructor.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The access token should be sent in the Authorization header as "Bearer {access_token}".
➢ **errorMessage** – this is optional and is returned in the response body to provide details about authentication issues, such as "Access denied. Instructor token required."

**Requests:**

Valid Request:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Format:** JSON

**Responses:**

The API response returns the instructor's profile information.

Successful Response (200 OK):
```json
{
  "success": true,
  "instructor": {
    "id": "6478abc123def456",
    "instructorid": "INST-001",
    "email": "instructor@gmail.com",
    "fullName": "Jane Smith",
    "firstName": "Jane",
    "lastName": "Smith",
    "college": "College of Computing",
    "department": "Computer Science",
    "status": "Active",
    "invitedBy": "admin@buksu.edu.ph",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

Error Response (401 Unauthorized):
```json
{
  "success": false,
  "message": "Access denied. Instructor token required."
}
```

---

### 2.1.2.18 Update Instructor Profile Information

**Version:** 1.0  
**Date:** November 15, 2025  
**Description:** This API endpoint allows authenticated instructors to update their profile information including first name, last name, and department. The endpoint validates the instructor's identity through their JWT access token and updates the specified fields. Error responses are generated for invalid update data or authentication issues.

**Endpoint:** http://localhost:5000/api/instructor/profile

**Method:** PUT

**Configurations:**
The API request must be authenticated to ensure secure access to instructor profile updates. The request must include a valid instructor access token in the Authorization header to verify the identity of the instructor.

**Parameters:**
➢ **token** – this is required for handling the request of this API endpoint. The access token should be sent in the Authorization header as "Bearer {access_token}".
➢ **firstName** – this is optional and can be updated in the request body.
➢ **lastName** – this is optional and can be updated in the request body.
➢ **department** – this is optional and can be updated in the request body.
➢ **errorMessage** – this is optional and is returned in the response body to provide details about update issues, such as "Invalid update data."

**Requests:**

Valid Request:
```json
{
  "firstName": "Jane",
  "lastName": "Johnson",
  "department": "Information Technology"
}
```

Not Valid Request:
```json
{
  "firstName": "",
  "lastName": ""
}
```

**Response Format:** JSON

**Responses:**

The API response confirms successful profile update.

Successful Response (200 OK):
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "instructor": {
    "id": "6478abc123def456",
    "instructorid": "INST-001",
    "email": "instructor@gmail.com",
    "fullName": "Jane Johnson",
    "firstName": "Jane",
    "lastName": "Johnson",
    "college": "College of Computing",
    "department": "Information Technology",
    "status": "Active"
  }
}
```

Error Response (400 Bad Request):
```json
{
  "success": false,
  "message": "Invalid update data"
}
```

---

## 2.1.3 Security Features

### Authentication Methods
1. **Google OAuth 2.0**: Primary authentication for students and instructors
2. **JWT Tokens**: Stateless authentication with 7-day expiry
3. **Email/Password**: Admin authentication with bcrypt hashing
4. **Session Management**: Express sessions with Passport.js

### Security Measures
- **Brute Force Protection**: Rate limiting on login attempts
- **Account Lockout**: 2-hour lockout after multiple failed admin login attempts
- **Password Reset**: Time-limited OTP (15 minutes) with secure hashing
- **Token Expiry**: Access tokens expire in 7 days (configurable)
- **HTTPS Only Cookies**: Secure cookie transmission in production
- **Domain Validation**: Email domain verification before authentication
- **Role-Based Access Control**: Middleware-enforced authorization
- **Input Validation**: All inputs sanitized and validated

### Password Requirements
- Minimum 8 characters (recommended)
- Hashed using bcrypt with 12 salt rounds
- Stored passwords never exposed in responses

### Token Management
- **Access Token**: Used for API authentication (7 days)
- **Refresh Token**: Used to obtain new access tokens (7 days)
- **HTTP-Only Cookies**: Additional security layer
- **Bearer Token Header**: Standard Authorization header format

---

## 2.1.4 Error Handling

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error message",
  "error": "Detailed error information (development only)"
}
```

### Common Error Scenarios

**Invalid Token:**
```json
{
  "success": false,
  "message": "Invalid token",
  "code": "INVALID_TOKEN"
}
```

**Expired Token:**
```json
{
  "success": false,
  "message": "Token expired",
  "code": "TOKEN_EXPIRED"
}
```

**Account Locked:**
```json
{
  "success": false,
  "message": "Account is temporarily locked due to too many failed login attempts. Please try again in 2 hours.",
  "locked": true,
  "timeUntilUnlock": "2024-11-15T12:30:00.000Z"
}
```

---

## 2.1.5 Environment Variables

Required environment variables for authentication module:

```bash
# JWT Configuration
JWT_SECRET=your-jwt-secret-key
JWT_ACCESS_SECRET=your-admin-jwt-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=1d
REFRESH_TOKEN_EXPIRES_IN=7d

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# URLs
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000

# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

## 2.1.6 Best Practices

### For Frontend Developers
1. Always include `Authorization: Bearer {token}` header for protected routes
2. Handle 401 responses by redirecting to login page
3. Store tokens securely (localStorage or httpOnly cookies)
4. Implement automatic token refresh before expiry
5. Clear all authentication data on logout

### For API Consumers
1. Validate email domain before attempting login
2. Handle all error codes appropriately
3. Implement retry logic with exponential backoff for rate-limited requests
4. Never log or expose tokens in client-side code
5. Use HTTPS in production environments

### For System Administrators
1. Regularly rotate JWT secrets
2. Monitor failed login attempts
3. Review account lockout logs
4. Keep password reset OTP expiry short (15 minutes)
5. Enable HTTPS-only cookies in production

---

*This documentation was generated for BUKSU Grading System v1.0.0*
