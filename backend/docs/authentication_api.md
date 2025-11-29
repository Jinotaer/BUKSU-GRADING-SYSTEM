# Authentication Module API

Base URL: `http://localhost:5000` (default from `backend/server.js`)

This document describes the authentication-related endpoints implemented in the BUKSU Grading System backend. It reflects the actual routes, methods, request/response shapes, and status codes implemented in the server code.

## Overview
- Purpose: manage user authentication, session operations, profile retrieval, Google OAuth, email domain validation, and session termination.
- Authentication: endpoints use JWTs (in `Authorization: Bearer <token>` header or `auth_token` cookie) and Passport sessions for Google OAuth flows.

## Endpoints

- `POST /api/auth/validate-email`
  - Description: Validate institutional email domain and infer role (student/instructor).
  - Access: Public
  - Request body (JSON):
    - `email` (string) — required
  - Success response (200):
    {
      "success": true,
      "message": "Valid student email",
      "role": "student",
      "emailDomain": "@student.buksu.edu.ph"
    }
  - Error responses: 400 for missing/invalid email, 500 for server errors.

- `POST /api/auth/login`
  - Description: Login with email + inferred or provided `userType` (student|instructor). Protects against brute-force attempts.
  - Access: Public (protected by `bruteForceProtection` middleware which may return 423 if account locked)
  - Request body (JSON):
    - `email` (string) — required
    - `userType` (string) — `'student'` or `'instructor'`. If omitted, some flows may infer it.
    - `captchaResponse` (string) — required (reCAPTCHA verification)
  - Success response (200):
    {
      "success": true,
      "message": "Student login successful",
      "user": { /* decrypted user fields */ },
      "token": "<JWT>"
    }
  - Error responses:
    - 400 Bad Request — missing fields, invalid captcha, or invalid email domain
    - 404 Not Found — user (student/instructor) not registered
    - 403 Forbidden — account exists but not approved/active yet
    - 423 Locked — account temporarily locked due to too many failed attempts (brute-force protection)
    - 500 Internal Server Error

- `GET /api/auth/google`
  - Description: Initiate Google OAuth (redirects to Google consent screen).
  - Access: Public

- `GET /api/auth/google/callback`
  - Description: Google OAuth callback. On success sets an `auth_token` cookie and redirects to frontend with a token param; on failure redirects to frontend login with error query params.
  - Access: Public

- `GET /api/auth/me`
  - Description: Returns the currently authenticated user's profile.
  - Access: Private — requires valid JWT in `Authorization: Bearer <token>` or `auth_token` cookie (token is verified by `verifyGoogleAuthToken`/middleware)
  - Success (200):
    {
      "success": true,
      "data": {
        "id": "...",
        "email": "...",
        "fullName": "...",
        "role": "student|instructor",
        "status": "Approved|Active",
        // role-specific fields
      }
    }
  - Error responses: 401 Unauthorized when not authenticated; 500 on server error.

- `POST /api/auth/logout`
  - Description: Logout user; clears `auth_token` cookie, destroys session.
  - Access: Private (uses `universalAuditLogger` on route)
  - Success (200): `{ success: true, message: "Logged out successfully" }`

- `GET /api/auth/status`
  - Description: Lightweight status check — whether the user is authenticated (via session or JWT), and role information.
  - Access: Public
  - Success (200):
    - When not authenticated: `{ success: true, authenticated: false, role: null, user: null }`
    - When authenticated: `{ success: true, authenticated: true, role: "student", user: { id, email, ... } }`

- Example protected routes (used as examples in router):
  - `GET /api/auth/student-only` — students only
  - `GET /api/auth/instructor-only` — instructors only
  - `GET /api/auth/academic-users` — students and instructors

## Common Response Codes (as implemented)

- 200 OK — Request successful (standard success responses for login, validate-email, me, logout, status).
- 400 Bad Request — Missing or invalid input (e.g., missing email, missing captcha, invalid email domain).
- 401 Unauthorized — Missing or invalid authentication token, token expired, or user not authenticated.
- 403 Forbidden — User exists but account not approved/active for the required operation.
- 404 Not Found — User not registered (e.g., trying to login with unregistered email).
- 423 Locked — Account temporarily locked due to too many failed login attempts (brute-force protection middleware returns this).
- 500 Internal Server Error — Unhandled server-side error.

## Notes & Implementation Details
- The `login` route requires `captchaResponse` and validates the institutional email domain using the same logic in `loginController.js` — students must use `@student.buksu.edu.ph`, instructors use `@buksu.edu.ph` (and some flows accept `@gmail.com` for instructors).
- The server signs JWT tokens with `process.env.JWT_SECRET` (or fallback) and returns it in the JSON `token` field. Google OAuth flows additionally set an `auth_token` HTTP-only cookie.
- Brute-force protection is implemented in `middleware/bruteForceProtection.js` and will increment failed attempts, lock accounts after a threshold, and return status `423` with `timeUntilUnlock` when locked.
- Protected endpoints accept the JWT in either:
  - `Authorization: Bearer <JWT>` header, or
  - `auth_token` cookie, or
  - `?token=<JWT>` query param (used in some redirect flows).

If you'd like, I can:
- Add this as a docs file in another place (root `docs/` or project `README`), or
- Regenerate a short markdown table that mirrors the attachment's layout exactly.
