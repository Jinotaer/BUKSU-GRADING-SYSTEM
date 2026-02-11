# Buksu Grading System - Test Case Scenarios

## Test Case Document
**Project:** Buksu Grading System  
**Version:** 1.0  
**Date:** February 4, 2026  
**Document Type:** Test Case Specifications

---

## 1. AUTHENTICATION & LOGIN MODULE

### TC_AUTH_01: Student Login - Valid Credentials
**Description:** Verify that a student can successfully log in with valid credentials.

**Pre-conditions:**
- Student account exists in the database
- Application is running and accessible

**Test Steps:**
1. Navigate to student login page
2. Enter valid student ID
3. Enter valid password
4. Click "Login" button

**Expected Result:**
- Login successful
- User redirected to student dashboard
- Session token generated
- Audit log entry created

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_02: Student Login - Invalid Credentials
**Description:** Verify that login fails with incorrect credentials and appropriate error message is displayed.

**Pre-conditions:**
- Application is running and accessible

**Test Steps:**
1. Navigate to student login page
2. Enter invalid student ID or password
3. Click "Login" button

**Expected Result:**
- Login fails
- Error message displayed: "Invalid credentials"
- User remains on login page
- Failed login attempt logged

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_03: Instructor Login - Valid Credentials
**Description:** Verify that an instructor can successfully log in with valid credentials.

**Pre-conditions:**
- Instructor account exists in the database
- Application is running and accessible

**Test Steps:**
1. Navigate to instructor login page
2. Enter valid instructor ID
3. Enter valid password
4. Click "Login" button

**Expected Result:**
- Login successful
- User redirected to instructor dashboard
- Session token generated with instructor role
- Audit log entry created

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_04: Admin Login - Valid Credentials
**Description:** Verify that an admin can successfully log in with valid credentials.

**Pre-conditions:**
- Admin account exists in the database
- Application is running and accessible

**Test Steps:**
1. Navigate to admin login page
2. Enter valid admin username
3. Enter valid password
4. Click "Login" button

**Expected Result:**
- Login successful
- User redirected to admin dashboard
- Session token generated with admin role
- Audit log entry created

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_05: Brute Force Protection
**Description:** Verify that the system blocks login attempts after multiple failed attempts.

**Pre-conditions:**
- Application is running
- Brute force protection is enabled

**Test Steps:**
1. Navigate to login page
2. Attempt login with incorrect credentials 5 times consecutively
3. Observe system response

**Expected Result:**
- After 5 failed attempts, account is temporarily locked
- Error message: "Too many failed attempts. Please try again later."
- Login blocked for configured time period
- Admin notification sent (if configured)

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_06: CAPTCHA Verification
**Description:** Verify that CAPTCHA verification works correctly during login.

**Pre-conditions:**
- CAPTCHA is enabled in the system
- Application is running

**Test Steps:**
1. Navigate to login page
2. Enter valid credentials
3. Complete CAPTCHA verification
4. Click "Login" button

**Expected Result:**
- CAPTCHA verified successfully
- Login proceeds normally
- If CAPTCHA fails, appropriate error message shown

**Priority:** Medium  
**Status:** Pending

---

### TC_AUTH_07: Password Reset - Request
**Description:** Verify that users can request a password reset.

**Pre-conditions:**
- User account exists with valid email
- Email service is configured

**Test Steps:**
1. Navigate to login page
2. Click "Forgot Password" link
3. Enter registered email address
4. Click "Submit" button

**Expected Result:**
- Reset password email sent to user
- Confirmation message displayed
- Reset token generated and stored
- Token expires after configured time

**Priority:** High  
**Status:** Pending

---

### TC_AUTH_08: Session Timeout
**Description:** Verify that user session expires after inactivity period.

**Pre-conditions:**
- User is logged in
- Session timeout is configured

**Test Steps:**
1. Log in as any user type
2. Leave the application idle for configured timeout period
3. Attempt to perform any action

**Expected Result:**
- Session expires after timeout period
- User redirected to login page
- Error message: "Session expired. Please login again."

**Priority:** Medium  
**Status:** Pending

---

## 2. STUDENT MODULE

### TC_STUD_01: View Student Dashboard
**Description:** Verify student can view their centralized dashboard after login.

**Pre-conditions:**
- Student is logged in successfully

**Test Steps:**
1. Log in as a student
2. Observe the landing page

**Expected Result:**
- Dashboard displays academic info
- Summary of grades visible
- Navigation menu accessible
- Personal information displayed correctly

**Priority:** High  
**Status:** Pending

---

### TC_STUD_02: View Personal Grades
**Description:** Verify student can view their grades for all enrolled subjects.

**Pre-conditions:**
- Student is logged in
- Student has enrolled subjects with grades

**Test Steps:**
1. Navigate to "My Grades" section
2. Select a semester
3. View grades for all subjects

**Expected Result:**
- All enrolled subjects displayed
- Grades shown for each subject (if available)
- Activity scores visible
- Final grade calculated correctly
- GPA/Average displayed

**Priority:** High  
**Status:** Pending

---

### TC_STUD_03: View Subject Details
**Description:** Verify student can view detailed breakdown of grades for a specific subject.

**Pre-conditions:**
- Student is logged in
- Student has enrolled subjects

**Test Steps:**
1. Navigate to "My Grades" section
2. Click on a specific subject
3. View detailed grade breakdown

**Expected Result:**
- Subject information displayed
- Activity breakdown shown (quizzes, exams, projects, etc.)
- Individual activity scores visible
- Percentage calculation correct
- Final grade computation accurate

**Priority:** High  
**Status:** Pending

---

### TC_STUD_04: View Schedule
**Description:** Verify student can view their class schedule.

**Pre-conditions:**
- Student is logged in
- Student has enrolled classes

**Test Steps:**
1. Navigate to "My Schedule" section
2. View weekly schedule

**Expected Result:**
- All enrolled classes displayed
- Time slots shown correctly
- Room assignments visible
- Instructor names displayed
- Days of week properly formatted

**Priority:** Medium  
**Status:** Pending

---

### TC_STUD_05: Access Student Portal Without Login
**Description:** Verify that unauthorized access to student portal is prevented.

**Pre-conditions:**
- User is not logged in

**Test Steps:**
1. Attempt to access student dashboard URL directly
2. Observe system response

**Expected Result:**
- Access denied
- User redirected to login page
- Error message: "Please login to access this page"

**Priority:** High  
**Status:** Pending

---

## 3. INSTRUCTOR MODULE

### TC_INST_01: View Instructor Dashboard
**Description:** Verify instructor can access their dashboard with class overview.

**Pre-conditions:**
- Instructor is logged in successfully

**Test Steps:**
1. Log in as an instructor
2. Observe the dashboard

**Expected Result:**
- Dashboard displays assigned classes
- Quick access to grade entry
- Schedule overview visible
- Navigation menu accessible

**Priority:** High  
**Status:** Pending

---

### TC_INST_02: Create Activity
**Description:** Verify instructor can create a new graded activity for a subject.

**Pre-conditions:**
- Instructor is logged in
- Instructor has assigned subjects

**Test Steps:**
1. Navigate to subject management
2. Select a subject
3. Click "Create Activity"
4. Enter activity details (name, type, max score, date)
5. Click "Save"

**Expected Result:**
- Activity created successfully
- Activity appears in activity list
- Confirmation message displayed
- Activity log entry created

**Priority:** High  
**Status:** Pending

---

### TC_INST_03: Edit Activity
**Description:** Verify instructor can edit an existing activity.

**Pre-conditions:**
- Instructor is logged in
- Activity exists for the subject

**Test Steps:**
1. Navigate to activity list
2. Select an activity
3. Click "Edit"
4. Modify activity details
5. Click "Save"

**Expected Result:**
- Activity updated successfully
- Changes reflected in activity list
- Confirmation message displayed
- Update logged in audit trail

**Priority:** Medium  
**Status:** Pending

---

### TC_INST_04: Delete Activity
**Description:** Verify instructor can delete an activity.

**Pre-conditions:**
- Instructor is logged in
- Activity exists without student scores

**Test Steps:**
1. Navigate to activity list
2. Select an activity
3. Click "Delete"
4. Confirm deletion

**Expected Result:**
- Activity deleted successfully
- Activity removed from list
- Confirmation message displayed
- Deletion logged in audit trail

**Priority:** Medium  
**Status:** Pending

---

### TC_INST_05: Enter Student Grades
**Description:** Verify instructor can enter grades for students in an activity.

**Pre-conditions:**
- Instructor is logged in
- Activity exists
- Students are enrolled in the class

**Test Steps:**
1. Navigate to activity grade entry
2. Select an activity
3. Enter scores for each student
4. Click "Save Grades"

**Expected Result:**
- Grades saved successfully
- Validation applied (scores within max limit)
- Confirmation message displayed
- Students can view their grades
- Final grades recalculated automatically

**Priority:** High  
**Status:** Pending

---

### TC_INST_06: Bulk Import Grades
**Description:** Verify instructor can import grades from a file (CSV/Excel).

**Pre-conditions:**
- Instructor is logged in
- Valid grade file prepared
- Activity exists

**Test Steps:**
1. Navigate to bulk import section
2. Select activity
3. Upload grade file
4. Click "Import"
5. Review preview
6. Confirm import

**Expected Result:**
- File uploaded successfully
- Data validated before import
- Grades imported for all students
- Errors reported if any
- Confirmation message displayed

**Priority:** Medium  
**Status:** Pending

---

### TC_INST_07: View Class Roster
**Description:** Verify instructor can view list of students enrolled in their class.

**Pre-conditions:**
- Instructor is logged in
- Students enrolled in instructor's class

**Test Steps:**
1. Navigate to class management
2. Select a class/section
3. View student roster

**Expected Result:**
- All enrolled students listed
- Student information displayed (ID, name, etc.)
- List can be sorted/filtered
- Export option available

**Priority:** Medium  
**Status:** Pending

---

### TC_INST_08: Generate Grade Report
**Description:** Verify instructor can generate and export grade reports for their classes.

**Pre-conditions:**
- Instructor is logged in
- Grades exist for students

**Test Steps:**
1. Navigate to reports section
2. Select class and semester
3. Choose report format (PDF/Excel/CSV)
4. Click "Generate Report"

**Expected Result:**
- Report generated successfully
- File downloaded automatically
- Report contains all required data
- Formatting is correct
- Export logged in audit trail

**Priority:** High  
**Status:** Pending

---

### TC_INST_09: Lock/Finalize Grades
**Description:** Verify instructor can lock grades to prevent further modifications.

**Pre-conditions:**
- Instructor is logged in
- All grades entered for the term

**Test Steps:**
1. Navigate to grade management
2. Select class and semester
3. Click "Lock Grades"
4. Confirm action

**Expected Result:**
- Grades locked successfully
- No further modifications allowed
- Confirmation message displayed
- Lock status visible to instructor
- Students can still view grades

**Priority:** High  
**Status:** Pending

---

### TC_INST_10: Google Calendar Integration
**Description:** Verify instructor can sync class schedules with Google Calendar.

**Pre-conditions:**
- Instructor is logged in
- Google Calendar integration configured
- Instructor has authorized Google account

**Test Steps:**
1. Navigate to calendar settings
2. Click "Sync with Google Calendar"
3. Authorize Google account
4. Confirm synchronization

**Expected Result:**
- Google authentication successful
- Class schedules synced to Google Calendar
- Events created with correct details
- Confirmation message displayed

**Priority:** Low  
**Status:** Pending

---

## 4. ADMIN MODULE

### TC_ADM_01: View Admin Dashboard
**Description:** Verify admin can access comprehensive system dashboard.

**Pre-conditions:**
- Admin is logged in successfully

**Test Steps:**
1. Log in as admin
2. Observe the dashboard

**Expected Result:**
- System overview displayed
- Statistics visible (total students, instructors, classes)
- Quick access to all management sections
- Navigation menu accessible

**Priority:** High  
**Status:** Pending

---

### TC_ADM_02: Create New Student Account
**Description:** Verify admin can create a new student account.

**Pre-conditions:**
- Admin is logged in

**Test Steps:**
1. Navigate to student management
2. Click "Add New Student"
3. Enter student details (ID, name, email, program, etc.)
4. Click "Save"

**Expected Result:**
- Student account created successfully
- Student can login with generated credentials
- Confirmation message displayed
- Welcome email sent to student
- Activity logged

**Priority:** High  
**Status:** Pending

---

### TC_ADM_03: Create New Instructor Account
**Description:** Verify admin can create a new instructor account.

**Pre-conditions:**
- Admin is logged in

**Test Steps:**
1. Navigate to instructor management
2. Click "Add New Instructor"
3. Enter instructor details (ID, name, email, department, etc.)
4. Click "Save"

**Expected Result:**
- Instructor account created successfully
- Instructor can login with generated credentials
- Confirmation message displayed
- Welcome email sent to instructor
- Activity logged

**Priority:** High  
**Status:** Pending

---

### TC_ADM_04: Edit Student Information
**Description:** Verify admin can modify student account information.

**Pre-conditions:**
- Admin is logged in
- Student account exists

**Test Steps:**
1. Navigate to student management
2. Search for student
3. Click "Edit"
4. Modify student details
5. Click "Save"

**Expected Result:**
- Student information updated successfully
- Changes reflected immediately
- Confirmation message displayed
- Update logged in audit trail

**Priority:** Medium  
**Status:** Pending

---

### TC_ADM_05: Delete Student Account
**Description:** Verify admin can delete a student account.

**Pre-conditions:**
- Admin is logged in
- Student account exists

**Test Steps:**
1. Navigate to student management
2. Search for student
3. Click "Delete"
4. Confirm deletion

**Expected Result:**
- Student account deleted/deactivated
- Student cannot login
- Associated data handled appropriately
- Confirmation message displayed
- Deletion logged

**Priority:** Medium  
**Status:** Pending

---

### TC_ADM_06: Create New Section
**Description:** Verify admin can create a new class section.

**Pre-conditions:**
- Admin is logged in
- Subject exists

**Test Steps:**
1. Navigate to section management
2. Click "Create Section"
3. Enter section details (subject, code, schedule, room, instructor)
4. Click "Save"

**Expected Result:**
- Section created successfully
- Section appears in section list
- Assigned instructor notified
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ADM_07: Assign Instructor to Section
**Description:** Verify admin can assign or reassign an instructor to a section.

**Pre-conditions:**
- Admin is logged in
- Section exists
- Instructor exists

**Test Steps:**
1. Navigate to section management
2. Select a section
3. Click "Assign Instructor"
4. Select instructor from list
5. Click "Save"

**Expected Result:**
- Instructor assigned successfully
- Instructor can access the section
- Previous instructor removed (if reassigning)
- Confirmation message displayed
- Notification sent to instructor

**Priority:** High  
**Status:** Pending

---

### TC_ADM_08: Enroll Student to Section
**Description:** Verify admin can enroll a student into a class section.

**Pre-conditions:**
- Admin is logged in
- Section exists with available slots
- Student exists

**Test Steps:**
1. Navigate to section management
2. Select a section
3. Click "Enroll Students"
4. Select student(s)
5. Click "Enroll"

**Expected Result:**
- Student enrolled successfully
- Student appears in class roster
- Student can view section in their schedule
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ADM_09: Create Semester/Term
**Description:** Verify admin can create a new academic semester/term.

**Pre-conditions:**
- Admin is logged in

**Test Steps:**
1. Navigate to semester management
2. Click "Create Semester"
3. Enter semester details (name, start date, end date, academic year)
4. Click "Save"

**Expected Result:**
- Semester created successfully
- Semester appears in semester list
- Can be set as active semester
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ADM_10: Set Active Semester
**Description:** Verify admin can set which semester is currently active.

**Pre-conditions:**
- Admin is logged in
- Multiple semesters exist

**Test Steps:**
1. Navigate to semester management
2. Select a semester
3. Click "Set as Active"
4. Confirm action

**Expected Result:**
- Selected semester set as active
- Previous active semester deactivated
- System displays active semester data
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ADM_11: View Audit Logs
**Description:** Verify admin can view system audit logs for monitoring.

**Pre-conditions:**
- Admin is logged in
- System has logged activities

**Test Steps:**
1. Navigate to monitoring/audit section
2. Select date range
3. Apply filters (user, action type, etc.)
4. View logs

**Expected Result:**
- Audit logs displayed with details
- Can filter and search logs
- Timestamps accurate
- User actions traceable
- Export option available

**Priority:** Medium  
**Status:** Pending

---

### TC_ADM_12: Manage Subjects
**Description:** Verify admin can create, edit, and delete subjects.

**Pre-conditions:**
- Admin is logged in

**Test Steps:**
1. Navigate to subject management
2. Click "Add Subject"
3. Enter subject details (code, title, units, description)
4. Click "Save"

**Expected Result:**
- Subject created successfully
- Subject appears in subject list
- Can be assigned to sections
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ADM_13: Export System Data
**Description:** Verify admin can export various system data (students, grades, etc.).

**Pre-conditions:**
- Admin is logged in
- Data exists in the system

**Test Steps:**
1. Navigate to export section
2. Select data type to export
3. Choose format (CSV, Excel, PDF)
4. Set filters/parameters
5. Click "Export"

**Expected Result:**
- Export file generated successfully
- File contains correct data
- Formatting is proper
- File downloads automatically
- Export logged

**Priority:** Medium  
**Status:** Pending

---

### TC_ADM_14: Manage Admin Accounts
**Description:** Verify admin can create and manage other admin accounts.

**Pre-conditions:**
- Admin is logged in with appropriate permissions

**Test Steps:**
1. Navigate to admin management
2. Click "Add Admin"
3. Enter admin details
4. Set permissions
5. Click "Save"

**Expected Result:**
- New admin account created
- Admin can login with credentials
- Permissions applied correctly
- Confirmation message displayed
- Activity logged

**Priority:** Medium  
**Status:** Pending

---

### TC_ADM_15: Reset User Password
**Description:** Verify admin can reset password for any user account.

**Pre-conditions:**
- Admin is logged in
- User account exists

**Test Steps:**
1. Navigate to user management
2. Search for user
3. Click "Reset Password"
4. Generate or enter new password
5. Click "Save"

**Expected Result:**
- Password reset successfully
- User notified via email
- User can login with new password
- Confirmation message displayed
- Reset logged

**Priority:** High  
**Status:** Pending

---

## 5. GRADE MANAGEMENT MODULE

### TC_GRADE_01: Calculate Final Grade - Formula Validation
**Description:** Verify that final grades are calculated correctly based on activity percentages.

**Pre-conditions:**
- Activity scores exist for students
- Grade computation rules configured

**Test Steps:**
1. Enter scores for all activities
2. Set percentage weights for each activity type
3. System calculates final grade
4. Verify calculation manually

**Expected Result:**
- Final grade calculated correctly
- Formula: (Sum of weighted activity scores) = Final Grade
- Rounding applied correctly
- Letter grade assigned accurately
- Pass/Fail status determined correctly

**Priority:** Critical  
**Status:** Pending

---

### TC_GRADE_02: Grade Encryption
**Description:** Verify that grades are encrypted in the database.

**Pre-conditions:**
- Encryption is enabled
- Grades exist in system

**Test Steps:**
1. Enter grades for students
2. Save grades to database
3. Query database directly
4. Verify data is encrypted

**Expected Result:**
- Grades stored in encrypted format
- Cannot read grades directly from database
- Decryption works correctly when retrieving grades
- No performance degradation

**Priority:** High  
**Status:** Pending

---

### TC_GRADE_03: Grade Decryption
**Description:** Verify that encrypted grades are correctly decrypted when displayed.

**Pre-conditions:**
- Encrypted grades exist in database
- User has permission to view grades

**Test Steps:**
1. Request grade data from system
2. System decrypts grades
3. Display grades to user

**Expected Result:**
- Grades decrypted successfully
- Displayed values match original entered values
- Decryption transparent to user
- No errors during decryption

**Priority:** High  
**Status:** Pending

---

### TC_GRADE_04: Grade Input Validation
**Description:** Verify that grade input validation works correctly.

**Pre-conditions:**
- Instructor is entering grades
- Activity has maximum score defined

**Test Steps:**
1. Attempt to enter score greater than maximum
2. Attempt to enter negative score
3. Attempt to enter non-numeric value
4. Observe system response

**Expected Result:**
- Scores exceeding maximum rejected
- Negative scores rejected
- Non-numeric values rejected
- Appropriate error messages displayed
- No invalid data saved

**Priority:** High  
**Status:** Pending

---

### TC_GRADE_05: Grade History Tracking
**Description:** Verify that grade modifications are tracked in history.

**Pre-conditions:**
- Grades exist for students
- Instructor modifies a grade

**Test Steps:**
1. View existing grade
2. Modify the grade
3. Save changes
4. View grade history

**Expected Result:**
- Grade modification recorded
- History shows old and new values
- Timestamp of change recorded
- User who made change identified
- History accessible to authorized users

**Priority:** Medium  
**Status:** Pending

---

### TC_GRADE_06: Final Grade Lock
**Description:** Verify that locked grades cannot be modified.

**Pre-conditions:**
- Grades are finalized and locked
- Instructor attempts to modify grade

**Test Steps:**
1. Attempt to edit a locked grade
2. Observe system response

**Expected Result:**
- Modification prevented
- Error message: "Grades are locked and cannot be modified"
- UI indicates locked status
- Admin can unlock if needed

**Priority:** High  
**Status:** Pending

---

### TC_GRADE_07: Bulk Grade Entry
**Description:** Verify that multiple grades can be entered simultaneously.

**Pre-conditions:**
- Instructor is logged in
- Multiple students in class

**Test Steps:**
1. Navigate to bulk grade entry
2. Enter grades for all students
3. Click "Save All"

**Expected Result:**
- All grades saved simultaneously
- Validation applied to each entry
- Success/failure reported per student
- Transaction rollback if any error
- Confirmation message displayed

**Priority:** Medium  
**Status:** Pending

---

### TC_GRADE_08: Grade Distribution Analysis
**Description:** Verify that grade distribution statistics are calculated correctly.

**Pre-conditions:**
- Multiple grades exist for a class
- Statistics feature is available

**Test Steps:**
1. Navigate to grade analytics
2. Select a class/activity
3. View grade distribution

**Expected Result:**
- Distribution chart displayed
- Mean, median, mode calculated correctly
- Passing rate shown
- Highest and lowest scores identified
- Standard deviation calculated

**Priority:** Low  
**Status:** Pending

---

## 6. ACTIVITY MANAGEMENT MODULE

### TC_ACT_01: Create Quiz Activity
**Description:** Verify that a quiz activity can be created with all required properties.

**Pre-conditions:**
- Instructor is logged in
- Subject/section selected

**Test Steps:**
1. Click "Create Activity"
2. Select activity type: "Quiz"
3. Enter name, date, max score, percentage weight
4. Click "Save"

**Expected Result:**
- Quiz activity created
- Appears in activity list
- Properties saved correctly
- Students can view activity (if visible)

**Priority:** High  
**Status:** Pending

---

### TC_ACT_02: Create Exam Activity
**Description:** Verify that an exam activity can be created.

**Pre-conditions:**
- Instructor is logged in
- Subject/section selected

**Test Steps:**
1. Click "Create Activity"
2. Select activity type: "Exam"
3. Enter required details
4. Click "Save"

**Expected Result:**
- Exam activity created
- Higher weight than quiz (if configured)
- All properties saved
- Confirmation message displayed

**Priority:** High  
**Status:** Pending

---

### TC_ACT_03: Create Project Activity
**Description:** Verify that a project activity can be created.

**Pre-conditions:**
- Instructor is logged in
- Subject/section selected

**Test Steps:**
1. Click "Create Activity"
2. Select activity type: "Project"
3. Enter details including deadline
4. Click "Save"

**Expected Result:**
- Project activity created
- Deadline enforced
- All properties saved
- Students notified (if configured)

**Priority:** Medium  
**Status:** Pending

---

### TC_ACT_04: Set Activity Visibility
**Description:** Verify that activity visibility can be controlled (visible/hidden to students).

**Pre-conditions:**
- Activity exists

**Test Steps:**
1. Edit activity
2. Toggle visibility setting
3. Save changes
4. Verify from student perspective

**Expected Result:**
- Visibility setting saved
- Hidden activities not visible to students
- Visible activities appear in student view
- Instructor can always see all activities

**Priority:** Medium  
**Status:** Pending

---

### TC_ACT_05: Set Activity Deadline
**Description:** Verify that activity deadlines work correctly.

**Pre-conditions:**
- Activity with deadline exists

**Test Steps:**
1. Create activity with future deadline
2. Wait until deadline passes
3. Attempt late submission (if applicable)

**Expected Result:**
- Deadline displayed to students
- Late submissions flagged
- Notifications sent before deadline
- System enforces deadline rules

**Priority:** Medium  
**Status:** Pending

---

### TC_ACT_06: Activity Score Validation
**Description:** Verify that activity score entries are validated against maximum score.

**Pre-conditions:**
- Activity has maximum score set

**Test Steps:**
1. Enter student score
2. Attempt to enter score > maximum
3. Observe validation

**Expected Result:**
- Valid scores accepted
- Scores exceeding maximum rejected
- Error message displayed
- No invalid scores saved

**Priority:** High  
**Status:** Pending

---

## 7. SCHEDULE MANAGEMENT MODULE

### TC_SCHED_01: Create Class Schedule
**Description:** Verify that a class schedule can be created.

**Pre-conditions:**
- Admin is logged in
- Section and instructor exist

**Test Steps:**
1. Navigate to schedule management
2. Click "Create Schedule"
3. Enter time, days, room, section
4. Click "Save"

**Expected Result:**
- Schedule created successfully
- No time conflicts
- Instructor notified
- Students can view schedule

**Priority:** High  
**Status:** Pending

---

### TC_SCHED_02: Detect Schedule Conflicts
**Description:** Verify that the system detects scheduling conflicts.

**Pre-conditions:**
- Existing schedule in place

**Test Steps:**
1. Attempt to create schedule with same instructor, time, day
2. Attempt to create schedule with same room, time, day
3. Observe system response

**Expected Result:**
- Conflict detected
- Error message displayed
- Schedule not created
- Suggested alternatives shown

**Priority:** High  
**Status:** Pending

---

### TC_SCHED_03: Modify Schedule
**Description:** Verify that existing schedules can be modified.

**Pre-conditions:**
- Schedule exists

**Test Steps:**
1. Select existing schedule
2. Modify time/room/days
3. Save changes

**Expected Result:**
- Schedule updated
- Conflicts checked
- All parties notified
- Changes reflected immediately

**Priority:** Medium  
**Status:** Pending

---

### TC_SCHED_04: Delete Schedule
**Description:** Verify that schedules can be deleted.

**Pre-conditions:**
- Schedule exists

**Test Steps:**
1. Select schedule
2. Click "Delete"
3. Confirm deletion

**Expected Result:**
- Schedule deleted
- Instructor and students notified
- Removed from all views
- Deletion logged

**Priority:** Medium  
**Status:** Pending

---

### TC_SCHED_05: View Weekly Schedule
**Description:** Verify that users can view schedules in weekly format.

**Pre-conditions:**
- Schedules exist

**Test Steps:**
1. Navigate to schedule view
2. Select weekly view
3. Observe schedule layout

**Expected Result:**
- Schedules displayed in calendar format
- Color-coded by subject/section
- Easy to read and navigate
- Can switch between weeks

**Priority:** Low  
**Status:** Pending

---

## 8. SECTION MANAGEMENT MODULE

### TC_SEC_01: Create Section
**Description:** Verify that a new section can be created.

**Pre-conditions:**
- Admin is logged in
- Subject exists

**Test Steps:**
1. Navigate to section management
2. Click "Create Section"
3. Enter section code, subject, capacity
4. Click "Save"

**Expected Result:**
- Section created successfully
- Unique section code assigned
- Capacity limit set
- Available for enrollment

**Priority:** High  
**Status:** Pending

---

### TC_SEC_02: Set Section Capacity
**Description:** Verify that section enrollment capacity is enforced.

**Pre-conditions:**
- Section exists with capacity set

**Test Steps:**
1. Enroll students up to capacity
2. Attempt to enroll one more student
3. Observe system response

**Expected Result:**
- Enrollment allowed until capacity reached
- Additional enrollments rejected
- Error message: "Section is full"
- Waitlist option (if available)

**Priority:** High  
**Status:** Pending

---

### TC_SEC_03: Merge Sections
**Description:** Verify that two sections can be merged.

**Pre-conditions:**
- Two or more sections of same subject exist

**Test Steps:**
1. Select sections to merge
2. Click "Merge Sections"
3. Confirm merge

**Expected Result:**
- Sections merged successfully
- All students combined
- Grades preserved
- One section remains active

**Priority:** Low  
**Status:** Pending

---

### TC_SEC_04: Clone Section
**Description:** Verify that a section can be cloned to new term.

**Pre-conditions:**
- Section exists in previous term

**Test Steps:**
1. Select section to clone
2. Click "Clone to New Term"
3. Select destination term
4. Confirm action

**Expected Result:**
- Section cloned successfully
- Same configuration applied
- Students not carried over
- Ready for new enrollment

**Priority:** Medium  
**Status:** Pending

---

## 9. EXPORT MODULE

### TC_EXP_01: Export Grades to Excel
**Description:** Verify that grades can be exported to Excel format.

**Pre-conditions:**
- Grades exist in system
- User has export permission

**Test Steps:**
1. Navigate to export section
2. Select section and semester
3. Choose format: Excel
4. Click "Export"

**Expected Result:**
- Excel file generated
- Contains all grade data
- Proper formatting applied
- File downloads automatically
- Export logged

**Priority:** High  
**Status:** Pending

---

### TC_EXP_02: Export Grades to PDF
**Description:** Verify that grades can be exported to PDF format.

**Pre-conditions:**
- Grades exist in system

**Test Steps:**
1. Navigate to export section
2. Select section and semester
3. Choose format: PDF
4. Click "Export"

**Expected Result:**
- PDF file generated
- Professional formatting
- All data included
- File downloads automatically

**Priority:** Medium  
**Status:** Pending

---

### TC_EXP_03: Export to Google Sheets
**Description:** Verify that grades can be exported directly to Google Sheets.

**Pre-conditions:**
- Google Sheets integration configured
- User authorized Google account

**Test Steps:**
1. Navigate to export section
2. Select "Export to Google Sheets"
3. Authorize Google account
4. Confirm export

**Expected Result:**
- Google Sheets created
- Data transferred correctly
- Formatting preserved
- Shareable link provided

**Priority:** Medium  
**Status:** Pending

---

### TC_EXP_04: Export Student List
**Description:** Verify that student roster can be exported.

**Pre-conditions:**
- Students exist in system

**Test Steps:**
1. Navigate to student management
2. Apply filters if needed
3. Click "Export"
4. Choose format

**Expected Result:**
- Student list exported
- Includes all relevant fields
- Format is correct
- File downloads successfully

**Priority:** Low  
**Status:** Pending

---

### TC_EXP_05: Export Final Grades Report
**Description:** Verify that comprehensive final grades report can be generated.

**Pre-conditions:**
- Final grades calculated
- Semester completed

**Test Steps:**
1. Navigate to final grade export
2. Select semester and sections
3. Click "Generate Report"

**Expected Result:**
- Comprehensive report generated
- Includes all sections
- Final grades accurate
- Ready for submission
- Meets institutional format

**Priority:** High  
**Status:** Pending

---

## 10. SECURITY MODULE

### TC_SEC_01: SQL Injection Prevention
**Description:** Verify that the system is protected against SQL injection attacks.

**Pre-conditions:**
- Application is running

**Test Steps:**
1. Attempt SQL injection in login fields
2. Attempt SQL injection in search fields
3. Attempt SQL injection in any input field

**Expected Result:**
- All injection attempts fail
- No unauthorized data access
- Input sanitized properly
- Errors logged for security monitoring

**Priority:** Critical  
**Status:** Pending

---

### TC_SEC_02: XSS Prevention
**Description:** Verify that the system prevents Cross-Site Scripting attacks.

**Pre-conditions:**
- Application is running

**Test Steps:**
1. Attempt to inject JavaScript in input fields
2. Submit data with HTML tags
3. Observe output rendering

**Expected Result:**
- Scripts not executed
- HTML tags escaped
- Content displayed safely
- No XSS vulnerabilities

**Priority:** Critical  
**Status:** Pending

---

### TC_SEC_03: CSRF Protection
**Description:** Verify that Cross-Site Request Forgery protection is active.

**Pre-conditions:**
- Application is running
- User is logged in

**Test Steps:**
1. Attempt to submit form without CSRF token
2. Attempt to submit with invalid token
3. Observe system response

**Expected Result:**
- Requests without token rejected
- Invalid tokens rejected
- Legitimate requests processed
- CSRF tokens generated per session

**Priority:** High  
**Status:** Pending

---

### TC_SEC_04: Password Encryption
**Description:** Verify that passwords are properly hashed and not stored in plain text.

**Pre-conditions:**
- User accounts exist

**Test Steps:**
1. Create new user account
2. Query database directly
3. Verify password storage

**Expected Result:**
- Passwords hashed using bcrypt/similar
- Original password not retrievable
- Salt added to hash
- Strong hashing algorithm used

**Priority:** Critical  
**Status:** Pending

---

### TC_SEC_05: Session Management
**Description:** Verify secure session management.

**Pre-conditions:**
- User can log in

**Test Steps:**
1. Log in to application
2. Capture session token
3. Attempt to reuse token after logout
4. Test session fixation

**Expected Result:**
- Tokens expire after logout
- Sessions timeout appropriately
- Session fixation prevented
- Secure cookies used (HttpOnly, Secure flags)

**Priority:** High  
**Status:** Pending

---

### TC_SEC_06: Authorization Checks
**Description:** Verify that authorization checks prevent unauthorized access.

**Pre-conditions:**
- Multiple user roles exist

**Test Steps:**
1. Log in as student
2. Attempt to access instructor functions
3. Attempt to access admin functions
4. Observe system response

**Expected Result:**
- Access denied to unauthorized functions
- Appropriate error message shown
- User redirected or blocked
- Attempt logged

**Priority:** Critical  
**Status:** Pending

---

### TC_SEC_07: Audit Logging
**Description:** Verify that all critical actions are logged.

**Pre-conditions:**
- System is running
- Users perform various actions

**Test Steps:**
1. Perform login
2. Modify grades
3. Create/delete records
4. Check audit logs

**Expected Result:**
- All actions logged
- Log includes: timestamp, user, action, details
- Logs immutable
- Logs accessible to admin

**Priority:** High  
**Status:** Pending

---

### TC_SEC_08: Rate Limiting
**Description:** Verify that rate limiting prevents API abuse.

**Pre-conditions:**
- Rate limiting configured

**Test Steps:**
1. Make multiple rapid API requests
2. Exceed rate limit threshold
3. Observe system response

**Expected Result:**
- Requests accepted up to limit
- Excess requests rejected
- Error 429: Too Many Requests
- User notified of limit

**Priority:** Medium  
**Status:** Pending

---

## 11. PERFORMANCE MODULE

### TC_PERF_01: Page Load Time
**Description:** Verify that page load times are within acceptable limits.

**Pre-conditions:**
- Application is running
- Normal data volume

**Test Steps:**
1. Navigate to various pages
2. Measure load time for each
3. Record results

**Expected Result:**
- Dashboard loads in < 2 seconds
- Grade lists load in < 3 seconds
- All pages responsive
- No timeout errors

**Priority:** Medium  
**Status:** Pending

---

### TC_PERF_02: Large Dataset Handling
**Description:** Verify system handles large datasets efficiently.

**Pre-conditions:**
- Large number of records exist (>1000 students)

**Test Steps:**
1. Load page with large dataset
2. Filter/search through records
3. Export large dataset
4. Measure performance

**Expected Result:**
- Pages load without errors
- Pagination works correctly
- Search is fast (<2 seconds)
- Export completes successfully

**Priority:** Medium  
**Status:** Pending

---

### TC_PERF_03: Concurrent Users
**Description:** Verify system handles multiple concurrent users.

**Pre-conditions:**
- Multiple users available for testing

**Test Steps:**
1. Have 20+ users log in simultaneously
2. Perform various operations
3. Monitor system performance

**Expected Result:**
- All users can access system
- No significant slowdown
- No errors or crashes
- Database handles load

**Priority:** High  
**Status:** Pending

---

### TC_PERF_04: Database Query Optimization
**Description:** Verify that database queries are optimized.

**Pre-conditions:**
- Database contains realistic data volume

**Test Steps:**
1. Perform common operations
2. Monitor database query execution time
3. Check for slow queries

**Expected Result:**
- Queries execute in < 100ms
- Indexes used properly
- No N+1 query problems
- Connection pooling works

**Priority:** Medium  
**Status:** Pending

---

## 12. INTEGRATION MODULE

### TC_INT_01: Google Calendar Sync
**Description:** Verify Google Calendar integration works correctly.

**Pre-conditions:**
- Google Calendar API configured
- User has Google account

**Test Steps:**
1. Connect Google account
2. Sync class schedule
3. Verify events in Google Calendar
4. Modify schedule and sync again

**Expected Result:**
- Events created in Google Calendar
- Updates synced correctly
- Deletions reflected
- No duplicate events

**Priority:** Low  
**Status:** Pending

---

### TC_INT_02: Google Sheets Export
**Description:** Verify data can be exported to Google Sheets.

**Pre-conditions:**
- Google Sheets API configured
- User authorized

**Test Steps:**
1. Select data to export
2. Choose "Export to Google Sheets"
3. Verify sheet creation
4. Check data accuracy

**Expected Result:**
- Sheet created successfully
- Data transferred correctly
- Formatting preserved
- Share link generated

**Priority:** Medium  
**Status:** Pending

---

### TC_INT_03: Email Notifications
**Description:** Verify email notifications are sent correctly.

**Pre-conditions:**
- Email service configured
- Valid recipient addresses

**Test Steps:**
1. Trigger notification event (grade posted, password reset, etc.)
2. Check email delivery
3. Verify email content

**Expected Result:**
- Emails sent successfully
- Content is correct
- Formatting is proper
- Links work correctly
- No spam classification

**Priority:** Medium  
**Status:** Pending

---

## 13. DATA VALIDATION MODULE

### TC_VAL_01: Email Format Validation
**Description:** Verify that email addresses are validated.

**Pre-conditions:**
- Form with email input exists

**Test Steps:**
1. Enter invalid email format
2. Submit form
3. Observe validation

**Expected Result:**
- Invalid emails rejected
- Error message shown
- Valid emails accepted
- Format: user@domain.com

**Priority:** Medium  
**Status:** Pending

---

### TC_VAL_02: Student ID Format Validation
**Description:** Verify that student IDs follow required format.

**Pre-conditions:**
- Student ID format defined

**Test Steps:**
1. Attempt to enter invalid student ID
2. Submit form
3. Observe validation

**Expected Result:**
- Invalid IDs rejected
- Format enforced
- Error message clear
- Valid IDs accepted

**Priority:** Medium  
**Status:** Pending

---

### TC_VAL_03: Date Range Validation
**Description:** Verify that date inputs are validated correctly.

**Pre-conditions:**
- Forms with date fields exist

**Test Steps:**
1. Enter end date before start date
2. Enter date in past when future required
3. Submit form

**Expected Result:**
- Invalid date ranges rejected
- Clear error messages
- Calendar widget enforces rules
- Valid dates accepted

**Priority:** Medium  
**Status:** Pending

---

### TC_VAL_04: Required Field Validation
**Description:** Verify that required fields cannot be left empty.

**Pre-conditions:**
- Forms with required fields exist

**Test Steps:**
1. Leave required field empty
2. Attempt to submit form
3. Observe validation

**Expected Result:**
- Form submission blocked
- Required fields highlighted
- Error message displayed
- Validation on client and server

**Priority:** High  
**Status:** Pending

---

## 14. UI/UX MODULE

### TC_UI_01: Responsive Design - Mobile
**Description:** Verify that the application works on mobile devices.

**Pre-conditions:**
- Application accessible

**Test Steps:**
1. Access application on mobile device
2. Test all major functions
3. Check layout and navigation

**Expected Result:**
- Layout adapts to screen size
- All features accessible
- Touch interactions work
- Text readable
- No horizontal scrolling

**Priority:** Medium  
**Status:** Pending

---

### TC_UI_02: Responsive Design - Tablet
**Description:** Verify that the application works on tablet devices.

**Pre-conditions:**
- Application accessible

**Test Steps:**
1. Access application on tablet
2. Test major functions
3. Check layout

**Expected Result:**
- Layout optimized for tablet
- All features work correctly
- Navigation intuitive
- Good use of screen space

**Priority:** Low  
**Status:** Pending

---

### TC_UI_03: Browser Compatibility - Chrome
**Description:** Verify application works correctly in Google Chrome.

**Pre-conditions:**
- Chrome browser installed

**Test Steps:**
1. Access application in Chrome
2. Test all major functions
3. Check for errors

**Expected Result:**
- All features work
- No console errors
- Layout correct
- Performance good

**Priority:** High  
**Status:** Pending

---

### TC_UI_04: Browser Compatibility - Firefox
**Description:** Verify application works correctly in Mozilla Firefox.

**Pre-conditions:**
- Firefox browser installed

**Test Steps:**
1. Access application in Firefox
2. Test all major functions
3. Check for errors

**Expected Result:**
- All features work
- No console errors
- Layout correct
- Performance acceptable

**Priority:** Medium  
**Status:** Pending

---

### TC_UI_05: Browser Compatibility - Edge
**Description:** Verify application works correctly in Microsoft Edge.

**Pre-conditions:**
- Edge browser installed

**Test Steps:**
1. Access application in Edge
2. Test all major functions
3. Check for errors

**Expected Result:**
- All features work
- No console errors
- Layout correct
- Performance good

**Priority:** Medium  
**Status:** Pending

---

### TC_UI_06: Accessibility - Keyboard Navigation
**Description:** Verify that the application can be navigated using keyboard only.

**Pre-conditions:**
- Application accessible

**Test Steps:**
1. Navigate using Tab key
2. Activate controls with Enter/Space
3. Use all major features

**Expected Result:**
- All interactive elements accessible
- Tab order logical
- Focus indicators visible
- Keyboard shortcuts work

**Priority:** Low  
**Status:** Pending

---

### TC_UI_07: Error Message Display
**Description:** Verify that error messages are clear and helpful.

**Pre-conditions:**
- Various error conditions can be triggered

**Test Steps:**
1. Trigger various errors
2. Read error messages
3. Evaluate clarity

**Expected Result:**
- Messages are clear
- Explain what went wrong
- Suggest how to fix
- Appropriate tone
- Not overly technical

**Priority:** Medium  
**Status:** Pending

---

### TC_UI_08: Loading Indicators
**Description:** Verify that loading indicators show during long operations.

**Pre-conditions:**
- Operations that take time exist

**Test Steps:**
1. Trigger long-running operation
2. Observe UI during operation
3. Check for loading indicator

**Expected Result:**
- Loading spinner/bar shown
- User knows system is working
- UI remains responsive
- Indicator disappears when done

**Priority:** Low  
**Status:** Pending

---

## 15. BACKUP AND RECOVERY MODULE

### TC_BCK_01: Database Backup
**Description:** Verify that database can be backed up successfully.

**Pre-conditions:**
- Database contains data
- Backup mechanism configured

**Test Steps:**
1. Initiate database backup
2. Wait for completion
3. Verify backup file created

**Expected Result:**
- Backup completes successfully
- Backup file created
- File size appropriate
- No data loss
- Process logged

**Priority:** Critical  
**Status:** Pending

---

### TC_BCK_02: Database Restore
**Description:** Verify that database can be restored from backup.

**Pre-conditions:**
- Valid backup file exists

**Test Steps:**
1. Initiate database restore
2. Select backup file
3. Confirm restore
4. Verify data integrity

**Expected Result:**
- Restore completes successfully
- All data restored
- No corruption
- Application works normally
- Process logged

**Priority:** Critical  
**Status:** Pending

---

### TC_BCK_03: Automated Backup Schedule
**Description:** Verify that automated backups run on schedule.

**Pre-conditions:**
- Backup schedule configured

**Test Steps:**
1. Configure daily backup
2. Wait for scheduled time
3. Verify backup executed

**Expected Result:**
- Backup runs automatically
- Successful completion
- Backup file created
- Admin notified
- Old backups rotated

**Priority:** High  
**Status:** Pending

---

## TEST SUMMARY

### Priority Distribution
- **Critical:** 6 test cases
- **High:** 42 test cases
- **Medium:** 40 test cases
- **Low:** 12 test cases

### Module Coverage
- Authentication & Login: 8 test cases
- Student Module: 5 test cases
- Instructor Module: 10 test cases
- Admin Module: 15 test cases
- Grade Management: 8 test cases
- Activity Management: 6 test cases
- Schedule Management: 5 test cases
- Section Management: 4 test cases
- Export Module: 5 test cases
- Security Module: 8 test cases
- Performance Module: 4 test cases
- Integration Module: 3 test cases
- Data Validation: 4 test cases
- UI/UX Module: 8 test cases
- Backup & Recovery: 3 test cases

### Total Test Cases: 100

---

## TEST EXECUTION NOTES

### Test Environment Requirements
1. Development server running
2. Test database with sample data
3. Multiple user accounts (student, instructor, admin)
4. Various browsers installed
5. Mobile/tablet devices for testing
6. Google account for integration testing
7. Email service configured

### Test Data Requirements
1. At least 50 student accounts
2. At least 10 instructor accounts
3. At least 3 admin accounts
4. 20+ subjects
5. 30+ sections
6. 100+ grade records
7. Multiple semesters

### Testing Schedule
- Phase 1: Authentication & Core Features (Week 1)
- Phase 2: Grade & Activity Management (Week 2)
- Phase 3: Admin Functions (Week 3)
- Phase 4: Security & Performance (Week 4)
- Phase 5: Integration & UI/UX (Week 5)

### Defect Severity Levels
- **Critical:** System crash, data loss, security breach
- **High:** Major feature not working, incorrect calculations
- **Medium:** Minor feature issues, UI problems
- **Low:** Cosmetic issues, minor inconveniences

---

*End of Test Case Document*
