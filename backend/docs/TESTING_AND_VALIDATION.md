# Testing and Validation Phase - BUKSU Grading System

## Overview
This document outlines the comprehensive testing and validation strategy for the BUKSU Grading System. It covers functional testing, security testing, and system validation procedures to ensure all features perform correctly and securely before deployment.

---

## Table of Contents
1. [Testing Objectives](#testing-objectives)
2. [Testing Scope](#testing-scope)
3. [Functional Testing](#functional-testing)
4. [Security Testing](#security-testing)
5. [Performance Testing](#performance-testing)
6. [Integration Testing](#integration-testing)
7. [Validation Procedures](#validation-procedures)
8. [Issue Management](#issue-management)
9. [Test Report Template](#test-report-template)

---

## Testing Objectives

### Primary Goals
- Verify all features function according to requirements
- Identify and document defects and vulnerabilities
- Ensure system meets performance and security standards
- Validate data integrity and consistency
- Confirm user experience and usability

### Success Criteria
- All critical and high-priority bugs are resolved
- Security vulnerabilities are patched
- System performance meets baseline requirements
- All authentication and access control mechanisms work correctly
- Data is properly encrypted and protected

---

## Testing Scope

### In Scope
- **Authentication Module** - Login, registration, Google OAuth, password reset
- **Access Control** - Role-based access (Student, Instructor, Admin)
- **Grade Management** - Grade entry, calculation, modification, and export
- **Activity Management** - Activity creation, scoring, tracking
- **Scheduling** - Schedule creation, Google Calendar integration
- **Monitoring & Logging** - Audit logs, activity logs, system monitoring
- **Data Export** - Excel export, Google Sheets integration
- **Encryption** - Data encryption/decryption, sensitive field protection
- **Brute Force Protection** - Account lockout mechanisms
- **Session Management** - Session creation, timeout, termination

### Out of Scope
- Frontend UI/UX testing (separate responsibility)
- Third-party library vulnerability audits
- Load testing beyond baseline requirements
- Mobile application testing

---

## Functional Testing

### 1. Authentication Testing

#### 1.1 User Registration & Email Validation
```
Test ID: FT-AUTH-001
Test Case: Email Validation with Institutional Domain
Steps:
  1. Attempt registration with valid BUKSU student email (@student.buksu.edu.ph)
  2. Verify email validation endpoint returns correct role
  3. Attempt registration with invalid domain
  4. Verify rejection with appropriate error message

Expected Results:
  - Valid emails are accepted with role 'student' or 'instructor'
  - Invalid domains are rejected (400 Bad Request)
  - Error message clearly indicates issue

Test ID: FT-AUTH-002
Test Case: Password Strength Validation
Steps:
  1. Attempt registration with weak password (<8 chars)
  2. Attempt with password lacking special characters
  3. Attempt with strong password (8+ chars, uppercase, lowercase, numbers, special)
  4. Verify strength validation works correctly

Expected Results:
  - Weak passwords are rejected
  - Strong passwords are accepted
  - Clear feedback on password requirements provided
```

#### 1.2 Login & Authentication
```
Test ID: FT-AUTH-003
Test Case: Successful Login Flow
Steps:
  1. Login with valid student credentials
  2. Verify JWT token is returned
  3. Verify user data is decrypted correctly
  4. Verify session is established
  5. Attempt access to protected route with token

Expected Results:
  - Login returns 200 status with token
  - User data matches database records
  - Protected routes accessible with valid token
  - Protected routes return 401 without token

Test ID: FT-AUTH-004
Test Case: Failed Login Attempts
Steps:
  1. Attempt login with non-existent email
  2. Attempt login with incorrect password
  3. Verify error message does not reveal user existence
  4. Count failed attempts

Expected Results:
  - Both scenarios return consistent error messages
  - Failed attempts are logged
  - Account shows appropriate locked status after threshold

Test ID: FT-AUTH-005
Test Case: Google OAuth Flow
Steps:
  1. Initiate Google OAuth login
  2. Complete consent flow with Google account
  3. Verify callback received and processed
  4. Verify JWT token generated
  5. Verify user profile linked correctly

Expected Results:
  - OAuth flow completes without errors
  - User created/linked in database
  - Session established correctly
  - User data accessible after OAuth login
```

#### 1.3 Session Management
```
Test ID: FT-AUTH-006
Test Case: Session Timeout
Steps:
  1. Login and establish session
  2. Wait for session timeout period (if configured)
  3. Attempt access to protected resource
  4. Verify session is invalidated

Expected Results:
  - Session expires after configured timeout
  - Access to protected routes returns 401
  - User must re-login

Test ID: FT-AUTH-007
Test Case: Logout Functionality
Steps:
  1. Login successfully
  2. Call logout endpoint
  3. Verify token/session invalidated
  4. Attempt access to protected route
  5. Verify access denied

Expected Results:
  - Logout clears session data
  - Protected routes return 401 after logout
```

### 2. Role-Based Access Control Testing

```
Test ID: FT-RBAC-001
Test Case: Student Access Restrictions
Steps:
  1. Login as student
  2. Attempt access to admin routes
  3. Attempt access to grade entry (instructor-only)
  4. Attempt access to student-specific routes
  5. Verify permissions enforced

Expected Results:
  - Student routes accessible (403 for admin/instructor routes)
  - Student can view own grades
  - Student cannot modify grades
  - Student cannot access admin panel

Test ID: FT-RBAC-002
Test Case: Instructor Access Restrictions
Steps:
  1. Login as instructor
  2. Attempt access to admin routes
  3. Attempt access to student list
  4. Attempt to create grades
  5. Attempt to create activities

Expected Results:
  - Instructor routes accessible
  - Admin routes return 403
  - Can manage own section grades
  - Cannot access other instructors' data
  - Can create activities for assigned sections

Test ID: FT-RBAC-003
Test Case: Admin Access Permissions
Steps:
  1. Login as admin
  2. Access all routes
  3. Verify capability to manage users
  4. Verify capability to view all grades
  5. Verify capability to access logs

Expected Results:
  - All routes accessible to admin
  - Admin can view and modify all system data
  - Admin has unrestricted access to reports
```

### 3. Grade Management Testing

```
Test ID: FT-GRADE-001
Test Case: Grade Entry & Validation
Steps:
  1. Login as instructor
  2. Navigate to grade entry for section
  3. Enter valid grade (0-100)
  4. Attempt to enter invalid grade (<0 or >100)
  5. Attempt to enter non-numeric value
  6. Save grades

Expected Results:
  - Valid grades accepted and saved
  - Invalid grades rejected with error message
  - Non-numeric entries rejected
  - Grades stored in database correctly

Test ID: FT-GRADE-002
Test Case: Grade Calculation
Steps:
  1. Set up activities with weights
  2. Enter activity scores for student
  3. Verify final grade calculated correctly
  4. Test with various grade distributions
  5. Test edge cases (all 100s, all 0s, mixed)

Expected Results:
  - Final grade = sum(activity_score * weight)
  - Calculations accurate to 2 decimal places
  - Totals match expected values

Test ID: FT-GRADE-003
Test Case: Grade Modification & Audit Trail
Steps:
  1. Enter initial grade
  2. Modify grade value
  3. Check audit log for modification
  4. Verify previous value recorded
  5. Verify timestamp accurate

Expected Results:
  - Grade modification allowed (with permissions)
  - Audit log records change with timestamp
  - Previous values preserved in audit trail
  - Who/when/why of change documented

Test ID: FT-GRADE-004
Test Case: Grade Export to Excel
Steps:
  1. Login as instructor
  2. Navigate to export section
  3. Select grades to export
  4. Choose Excel format
  5. Verify file generated and downloads

Expected Results:
  - Excel file generated successfully
  - File contains correct data
  - Formatting intact
  - All required columns present
```

### 4. Activity Management Testing

```
Test ID: FT-ACTIVITY-001
Test Case: Activity Creation
Steps:
  1. Login as instructor
  2. Create activity with:
     - Title, description
     - Points/weight
     - Due date
     - Rubric/criteria
  3. Save activity
  4. Verify activity visible to students

Expected Results:
  - Activity saved to database
  - Fields validated before saving
  - Activity appears in section
  - Students can view activity details

Test ID: FT-ACTIVITY-002
Test Case: Activity Scoring
Steps:
  1. Login as instructor
  2. Open activity scoring view
  3. Enter scores for multiple students
  4. Calculate aggregate scores
  5. Publish scores

Expected Results:
  - Scores accepted (0-max_points)
  - Invalid scores rejected
  - Aggregate calculation accurate
  - Students notified of scores

Test ID: FT-ACTIVITY-003
Test Case: Activity Tracking
Steps:
  1. Create activity with submission deadline
  2. Submit as student before deadline
  3. Submit after deadline (if allowed)
  4. Verify timestamp recorded
  5. View activity status in admin monitoring

Expected Results:
  - Submission timestamps recorded accurately
  - Late submissions marked appropriately
  - Tracking data visible in monitoring view
```

### 5. Schedule & Calendar Integration Testing

```
Test ID: FT-SCHED-001
Test Case: Schedule Creation
Steps:
  1. Login as admin
  2. Create schedule for term/semester
  3. Add class meetings with dates/times
  4. Assign instructors and sections
  5. Save schedule

Expected Results:
  - Schedule saved correctly
  - All meetings recorded
  - No date/time conflicts
  - Instructors can view assigned schedules

Test ID: FT-SCHED-002
Test Case: Google Calendar Integration
Steps:
  1. Sync schedule to Google Calendar
  2. Verify events appear in Google Calendar
  3. Modify event in system
  4. Verify update reflected in Google Calendar
  5. Delete event and verify removal

Expected Results:
  - Events sync to Google Calendar
  - Event details match system records
  - Bidirectional sync works correctly
  - Deletions propagate properly
```

---

## Security Testing

### 1. Authentication Security

```
Test ID: ST-AUTH-001
Test Case: Brute Force Protection
Steps:
  1. Attempt login with incorrect password 5+ times
  2. Verify account locked after threshold
  3. Verify lockout returns 423 status
  4. Wait for unlock period (or manual unlock)
  5. Verify login works after unlock

Expected Results:
  - Account locked after failed attempts
  - Correct HTTP 423 status returned
  - Lockout message displayed to user
  - Account unlocks after timeout

Test ID: ST-AUTH-002
Test Case: Session Hijacking Prevention
Steps:
  1. Login and capture JWT token
  2. Attempt to use token from different IP/device
  3. Attempt to modify token payload
  4. Attempt to use expired token
  5. Verify token validation

Expected Results:
  - Tokens validated for authenticity
  - Modified tokens rejected
  - Expired tokens invalid
  - Optional: IP/device binding enforced
```

### 2. Data Encryption

```
Test ID: ST-ENC-001
Test Case: Sensitive Field Encryption
Steps:
  1. Create student with personal data (name, ID, email)
  2. Inspect database directly
  3. Verify personal data is encrypted
  4. Query through API
  5. Verify decrypted data returned correctly

Expected Results:
  - Personal fields encrypted in database
  - Ciphertext not readable directly
  - API returns properly decrypted values
  - No plaintext stored

Test ID: ST-ENC-002
Test Case: Password Hashing
Steps:
  1. Register user with password
  2. Check password in database
  3. Verify password is hashed (not plaintext)
  4. Attempt login with correct password
  5. Verify hash comparison works

Expected Results:
  - Passwords stored as hashes only
  - Same password produces different hashes (salted)
  - Login verification uses hash comparison
  - Original password never stored or logged

Test ID: ST-ENC-003
Test Case: API Response Data Filtering
Steps:
  1. Query user list endpoint
  2. Verify passwords not in response
  3. Verify sensitive data properly encrypted
  4. Check error messages don't leak data
  5. Verify token payload contains only necessary claims

Expected Results:
  - No passwords returned in API responses
  - Sensitive data encrypted or excluded
  - Error messages generic (no user enumeration)
  - JWT contains minimal necessary claims
```

### 3. Access Control Security

```
Test ID: ST-ACCESS-001
Test Case: Authorization Bypass Attempts
Steps:
  1. Login as student
  2. Attempt to modify URL to access instructor routes
  3. Attempt to modify request body to escalate privileges
  4. Attempt to access /admin routes
  5. Attempt to modify other user's data

Expected Results:
  - All unauthorized access attempts blocked
  - 403 Forbidden returned consistently
  - User cannot modify own role/permissions
  - Cross-user data access prevented

Test ID: ST-ACCESS-002
Test Case: Token Manipulation
Steps:
  1. Login and capture JWT
  2. Attempt to decode and modify role claim
  3. Re-encode and use modified token
  4. Verify backend rejects modified token
  5. Test token signature validation

Expected Results:
  - Modified tokens rejected
  - Signature validation enforces token integrity
  - Claims validated against database
  - Cannot escalate privileges via token manipulation
```

### 4. Injection Attack Prevention

```
Test ID: ST-INJ-001
Test Case: SQL Injection Prevention
Steps:
  1. Attempt SQL injection in login email field
     Example: " OR 1=1 --"
  2. Attempt SQL injection in search fields
  3. Attempt injection in grade entry
  4. Monitor logs for attempted injections
  5. Verify legitimate queries still work

Expected Results:
  - Injection attempts fail safely
  - Input treated as literal string
  - Legitimate queries process normally
  - No database errors exposed

Test ID: ST-INJ-002
Test Case: XSS Prevention (API)
Steps:
  1. Submit grade comment with HTML/JavaScript
  2. Submit activity description with script tags
  3. Retrieve and verify rendering
  4. Check source of returned data
  5. Verify output encoding

Expected Results:
  - HTML tags not executed
  - Script tags stripped or escaped
  - Data safely encoded in responses
  - Frontend can safely render responses
```

### 5. CSRF Protection

```
Test ID: ST-CSRF-001
Test Case: CSRF Token Validation
Steps:
  1. Access form that modifies state
  2. Attempt to submit without CSRF token
  3. Attempt to submit with invalid CSRF token
  4. Submit with valid CSRF token
  5. Verify token invalidated after use

Expected Results:
  - Requests without CSRF token rejected
  - Invalid tokens rejected
  - Valid token accepted
  - State-changing operations protected
```

### 6. Logging & Monitoring Security

```
Test ID: ST-LOG-001
Test Case: Sensitive Data in Logs
Steps:
  1. Perform login
  2. Check system logs
  3. Perform password reset
  4. Check audit logs
  5. Verify no passwords, tokens, or PII in logs

Expected Results:
  - Passwords never logged
  - Tokens not logged (or masked)
  - Personal data not logged verbatim
  - Audit trails record actions, not sensitive values

Test ID: ST-LOG-002
Test Case: Audit Trail Integrity
Steps:
  1. Perform grade modification
  2. Check audit log entry
  3. Verify timestamp
  4. Verify user ID recorded
  5. Verify action details recorded
  6. Verify cannot modify audit log

Expected Results:
  - All state-changing actions logged
  - Correct user and timestamp recorded
  - Audit logs cannot be deleted/modified
  - Complete audit trail for compliance
```

---

## Performance Testing

### 1. Load Testing

```
Test ID: PT-LOAD-001
Test Case: Concurrent User Logins
Scenario: 100 simultaneous login attempts
Steps:
  1. Simulate 100 concurrent login requests
  2. Measure response time
  3. Verify all requests succeed (or fail gracefully)
  4. Check for race conditions
  5. Monitor database connection pool

Expected Results:
  - Response time <2000ms for 95th percentile
  - No requests result in errors due to concurrency
  - Database connections properly managed
  - No deadlocks or race conditions
```

### 2. Database Performance

```
Test ID: PT-DB-001
Test Case: Grade Query Performance
Scenario: Query grades for 500+ students
Steps:
  1. Populate database with test data (500 students)
  2. Query student grades
  3. Measure query execution time
  4. Add indexes if needed
  5. Re-test performance

Expected Results:
  - Query completes in <500ms
  - Indexes utilized properly
  - Database utilization reasonable
```

---

## Integration Testing

### 1. Google Sheets Integration

```
Test ID: IT-SHEETS-001
Test Case: Data Sync with Google Sheets
Steps:
  1. Export grades to Google Sheets
  2. Verify data in Sheets matches system
  3. Modify grades in Sheets
  4. Sync back to system
  5. Verify database updated

Expected Results:
  - Export creates properly formatted Sheet
  - Data matches exactly
  - Bidirectional sync works
  - Formatting preserved
```

### 2. Email Service Integration

```
Test ID: IT-EMAIL-001
Test Case: Email Notifications
Steps:
  1. Trigger notification event (grade posted)
  2. Verify email sent
  3. Check email content accuracy
  4. Test with multiple recipients
  5. Verify email logs

Expected Results:
  - Emails sent correctly
  - Content formatted properly
  - All required information included
  - Email delivery confirmed in logs
```

---

## Validation Procedures

### 1. Database Integrity Validation

```
Procedure: DB-VAL-001 - Referential Integrity Check
Execute:
  1. Query for orphaned records (no parent FK)
  2. Check for NULL values in required fields
  3. Validate data types match schema
  4. Verify constraints are enforced
  5. Run integrity check queries

Document:
  - Any orphaned records found
  - Constraint violations
  - Data type mismatches
  - Resolution for each issue
```

### 2. Data Consistency Validation

```
Procedure: DATA-VAL-001 - Grade Calculation Audit
Execute:
  1. Select 50 random students
  2. Calculate expected final grade (manually)
  3. Compare to database stored grade
  4. Check activity weights sum to 100%
  5. Verify no missing activity scores

Document:
  - Any discrepancies found
  - Root cause analysis
  - Corrective actions taken
```

### 3. Encryption Validation

```
Procedure: ENC-VAL-001 - Encryption Coverage Check
Execute:
  1. List all tables containing sensitive data
  2. Verify encryption enabled for each sensitive field
  3. Test encryption/decryption cycle
  4. Verify key management procedures
  5. Check for any plaintext storage

Document:
  - Encrypted fields verified
  - Key rotation procedures documented
  - Any plaintext fields found
  - Encryption algorithm versions
```

### 4. Configuration Validation

```
Procedure: CONFIG-VAL-001 - Security Settings Review
Execute:
  1. Review helmet.js security headers configuration
  2. Verify CORS settings are restrictive
  3. Check session timeout configured
  4. Verify password requirements set
  5. Confirm encryption keys in use
  6. Check rate limiting configured

Document:
  - All security settings documented
  - Production values confirmed
  - Any insecure settings identified
  - Recommended fixes for issues
```

---

## Issue Management

### Issue Severity Levels

| Severity | Definition | Example | Resolution Timeline |
|----------|-----------|---------|-------------------|
| Critical | System down or major feature unusable | Login broken, all grades lost | 24 hours |
| High | Important feature not working correctly | Grade calculations wrong | 72 hours |
| Medium | Feature works but with issues | Minor UI bug, slow query | 1 week |
| Low | Minor issue, minimal impact | Typo in error message | 2 weeks |

### Issue Tracking Template

```
Issue ID: TST-XXXX
Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Status: [Open/In Progress/Resolved/Verified]
Reporter: [Name]
Assignee: [Name]
Date Reported: [Date]
Date Resolved: [Date]

Description:
[Detailed description of issue]

Steps to Reproduce:
1. [Step 1]
2. [Step 2]
...

Expected Result:
[What should happen]

Actual Result:
[What actually happens]

Root Cause:
[Analysis of why issue occurred]

Resolution:
[How issue was fixed]

Testing:
- [ ] Issue reproduction verified
- [ ] Fix implemented
- [ ] Fix tested in development
- [ ] Fix tested in staging
- [ ] Issue closure verified
```

---

## Test Report Template

### Test Summary Report

```
Project: BUKSU Grading System
Reporting Period: [Start Date] to [End Date]
Prepared By: [Name]
Date: [Date]

Executive Summary
- Total Test Cases: [Number]
- Passed: [Number] ([Percentage]%)
- Failed: [Number] ([Percentage]%)
- Blocked: [Number] ([Percentage]%)
- Test Coverage: [Percentage]%

Test Results by Category
┌─────────────────────┬────────┬────────┬────────┬─────────┐
│ Test Category       │ Total  │ Passed │ Failed │ Blocked │
├─────────────────────┼────────┼────────┼────────┼─────────┤
│ Authentication      │        │        │        │         │
│ Authorization       │        │        │        │         │
│ Grade Management    │        │        │        │         │
│ Activity Mgmt       │        │        │        │         │
│ Security Testing    │        │        │        │         │
│ Performance Testing │        │        │        │         │
│ Integration Testing │        │        │        │         │
└─────────────────────┴────────┴────────┴────────┴─────────┘

Critical Issues Found
[List all critical/high severity issues]

Recommendations
[Recommendations for deployment readiness]

Approval Status
[ ] Ready for Production
[ ] Ready for Staging (with fixes)
[ ] Not Ready (requires fixes)

Sign-off
QA Lead: _____________ Date: _______
Project Manager: _______ Date: _______
```

---

## Pre-Deployment Checklist

Before deploying to production, verify:

- [ ] All critical and high-severity bugs resolved
- [ ] Security vulnerabilities patched
- [ ] Database integrity validated
- [ ] Encryption properly configured
- [ ] Backup procedures tested and documented
- [ ] Rollback procedures documented
- [ ] Monitoring and alerting configured
- [ ] Audit logging verified working
- [ ] Performance meets baseline
- [ ] Load testing completed successfully
- [ ] Documentation updated
- [ ] User training completed
- [ ] Support team briefed
- [ ] Stakeholder sign-off obtained

---

## Conclusion

This comprehensive testing and validation framework ensures the BUKSU Grading System is secure, functional, and ready for production deployment. All identified issues must be addressed and verified before system goes live.

For questions or issues related to testing, contact the QA team.
