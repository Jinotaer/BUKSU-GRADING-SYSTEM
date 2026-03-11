# BukSU Grading System - Entity Relationship Diagram

## Database Schema Diagram

```mermaid
erDiagram
    User ||--o| Admin : "is"
    User ||--o| Student : "is"
    User ||--o| Instructor : "is"
    Admin }o--|| Role : "has"
    Student }o--|| Role : "has"
    Instructor }o--|| Role : "has"
    Student ||--o{ Enrollment : "enrolls"
    Course ||--o{ Enrollment : "contains"
    Student ||--o{ Grade : "receives"
    Course ||--o{ Grade : "has"
    Instructor ||--o{ Course : "teaches"
    Instructor ||--o{ Grade : "submits"
    User ||--o{ Grade : "approves"

    User {
        ObjectId _id PK
        string name
        string institutionalID
        string email
        string password
        string googleID
        string profilePicture
        string resetPasswordToken
        date resetPasswordExpires
        boolean archived
        date createdAt
        date updatedAt
    }

    Admin {
        ObjectId userId PK_FK
        ObjectId adminRole FK
    }

    Student {
        ObjectId userId PK_FK
        ObjectId studentRole FK
    }

    Instructor {
        ObjectId userId PK_FK
        ObjectId instructorRole FK
        object googleCalendarTokens
    }

    Role {
        ObjectId _id PK
        string name
        string description
        array permissions
        ObjectId createdBy FK
        date createdAt
        date updatedAt
    }

    Course {
        ObjectId _id PK
        ObjectId instructorId FK
        string courseCode
        string courseName
        string description
        number units
        string semester
        string academicYear
        object schedule
        string room
        date createdAt
        date updatedAt
    }

    Grade {
        ObjectId _id PK
        ObjectId studentId FK
        ObjectId courseId FK
        ObjectId instructorId FK
        number prelimGrade
        number midtermGrade
        number finalGrade
        number semesterGrade
        string remarks
        date submittedAt
        ObjectId approvedBy FK
        date approvedAt
        date createdAt
        date updatedAt
    }

    Enrollment {
        ObjectId _id PK
        ObjectId studentId FK
        ObjectId courseId FK
        string semester
        string academicYear
        string status
        date enrolledAt
        date droppedAt
        date completedAt
        date createdAt
        date updatedAt
    }
```

## Entity Descriptions

### User
Central authentication table containing all system users (Admin, Student, Instructor). 
- Supports both traditional email/password and Google OAuth authentication
- Implements password reset functionality
- Soft delete through `archived` field

### Admin
Extends User with administrative privileges.
- Manages system-wide settings
- Oversees all operations

### Student
Extends User for student-specific data.
- Enrolls in courses
- Receives grades
- Views academic records

### Instructor
Extends User for faculty members.
- Teaches multiple courses
- Submits student grades
- Optional Google Calendar integration

### Role
Defines permissions and access control.
- Role-based access control (RBAC)
- Customizable permissions
- Audit trail with creator tracking

### Course
Represents academic courses/subjects.
- Managed by instructors
- Contains schedule and room information
- Tracks semester and academic year

### Grade
Student academic performance records.
- Tracks preliminary, midterm, and final grades
- Requires instructor submission and admin approval
- Complete audit trail

### Enrollment
Links students to courses.
- Tracks enrollment status (enrolled, dropped, completed)
- Historical record of student course participation
- Semester and academic year tracking

## Relationship Summary

| Relationship | Type | Description |
|-------------|------|-------------|
| User → Admin/Student/Instructor | 1:1 | User account types |
| Role → Admin/Student/Instructor | 1:Many | Users assigned roles |
| Instructor → Course | 1:Many | Instructor teaches courses |
| Student → Enrollment | 1:Many | Student enrolls in courses |
| Course → Enrollment | 1:Many | Course has enrollments |
| Student → Grade | 1:Many | Student receives grades |
| Course → Grade | 1:Many | Course has grades |
| Instructor → Grade | 1:Many | Instructor submits grades |
| User → Grade (approval) | 1:Many | Admin approves grades |

## Database Design Principles

1. **Inheritance Pattern**: Admin, Student, and Instructor extend User base table
2. **Audit Trail**: All entities include createdAt and updatedAt timestamps
3. **Soft Delete**: User table supports archiving instead of hard deletion
4. **RBAC**: Role-based access control for flexible permission management
5. **Data Integrity**: Foreign key relationships ensure referential integrity
6. **Traceability**: Grade approval tracking with approvedBy and approvedAt fields

---

*This ERD represents the core database structure for the BukSU Grading System, supporting academic record management at Bukidnon State University.*
