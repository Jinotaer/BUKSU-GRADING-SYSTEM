# BUKSU Grading System Database Schema

## Database Schema Overview

The figure presents the database schema for the BUKSU Grading System, illustrating the core entities and their relationships. The schema separates the three user roles—Admin, Student, and Instructor—into distinct tables, each containing role-specific attributes such as encrypted personal data, authentication credentials, and institutional identifiers. The system implements a comprehensive academic structure where Subjects are organized into Sections taught by Instructors and populated with Students, creating the foundation for activity management and grade tracking. Activities are modeled with references to both Section and Instructor tables, representing the academic assessments and assignments within each course section, while ActivityScores capture individual student performance linked to specific activities and students. The Grades entity consolidates academic performance across terms, maintaining references to both Student and Section tables for comprehensive grade management. Relationships are represented with foreign keys and appropriate cardinalities, highlighting one-to-many, many-to-many, and referential connections essential for enforcing data consistency, academic integrity, and seamless integration with external services such as Google Workspace APIs, automated scheduling systems, and institutional reporting requirements across the entire grading ecosystem.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                BUKSU GRADING SYSTEM                                        │
├─────────────────────┬──────────────────┬──────────────────┬─────────────────────────────┤
│                     │                  │                  │                             │
│    ┌─────────────┐  │  ┌─────────────┐ │ ┌─────────────┐  │    ┌─────────────────────┐ │
│    │    Admin    │  │  │   Student   │ │ │ Instructor  │  │    │      Subject        │ │
│    │─────────────│  │  │─────────────│ │ │─────────────│  │    │─────────────────────│ │
│    │_id (PK)     │  │  │_id (PK)     │ │ │_id (PK)     │  │    │_id (PK)             │ │
│    │email        │  │  │studid       │ │ │instructorid │  │    │subjectName          │ │
│    │password     │  │  │email        │ │ │email        │  │    │subjectCode          │ │
│    │firstName    │  │  │password     │ │ │password     │  │    │units                │ │
│    │lastName     │  │  │fullName     │ │ │fullName     │  │    │college              │ │
│    │role         │  │  │college      │ │ │college      │  │    │course               │ │
│    │createdAt    │  │  │course       │ │ │department   │  │    │description          │ │
│    │updatedAt    │  │  │yearLevel    │ │ │status       │  │    │createdAt            │ │
│    └─────────────┘  │  │status       │ │ │googleTokens │  │    │updatedAt            │ │
│                     │  │googleId     │ │ │createdAt    │  │    └─────────────────────┘ │
│                     │  │createdAt    │ │ │updatedAt    │  │                             │
│                     │  │updatedAt    │ │ └─────────────┘  │                             │
│                     │  └─────────────┘ │                  │                             │
├─────────────────────┼──────────────────┼──────────────────┼─────────────────────────────┤
│                     │                  │                  │                             │
│ ┌─────────────────┐ │ ┌──────────────────────────────────┐ │    ┌─────────────────────┐ │
│ │   AdminReset    │ │ │            Section               │ │    │     Semester        │ │
│ │─────────────────│ │ │──────────────────────────────────│ │    │─────────────────────│ │
│ │_id (PK)         │ │ │_id (PK)                          │ │    │_id (PK)             │ │
│ │adminId (FK)     │ │ │subject (FK → Subject._id)        │ │    │semesterName        │ │
│ │passcodeHash     │ │ │instructor (FK → Instructor._id)  │ │    │startDate            │ │
│ │expiresAt        │ │ │sectionName                       │ │    │endDate              │ │
│ │createdAt        │ │ │sectionCode                       │ │    │status               │ │
│ └─────────────────┘ │ │schoolYear                        │ │    │createdAt            │ │
│                     │ │term                              │ │    │updatedAt            │ │
│                     │ │students[] (FK → Student._id)     │ │    └─────────────────────┘ │
│                     │ │gradingSchema                     │ │                             │
│                     │ │schedule                          │ │                             │
│                     │ │exportMetadata                    │ │                             │
│                     │ │createdAt                         │ │                             │
│                     │ │updatedAt                         │ │                             │
│                     │ └──────────────────────────────────┘ │                             │
├─────────────────────┼──────────────────────────────────────┼─────────────────────────────┤
│                     │                                      │                             │
│ ┌─────────────────┐ │ ┌──────────────────────────────────┐ │ ┌─────────────────────────┐ │
│ │   Activity      │ │ │         ActivityScore            │ │ │        Grades           │ │
│ │─────────────────│ │ │──────────────────────────────────│ │ │─────────────────────────│ │
│ │_id (PK)         │ │ │_id (PK)                          │ │ │_id (PK)                 │ │
│ │title            │ │ │activity (FK → Activity._id)      │ │ │student (FK → Student)   │ │
│ │description      │ │ │student (FK → Student._id)        │ │ │section (FK → Section)   │ │
│ │category         │ │ │section (FK → Section._id)        │ │ │midtermGrade             │ │
│ │maxScore         │ │ │score                             │ │ │finalTermGrade           │ │
│ │subject (FK)     │ │ │feedback                          │ │ │midtermEquivalent        │ │
│ │section (FK)     │ │ │submittedAt                       │ │ │finalTermEquivalent      │ │
│ │instructor (FK)  │ │ │gradedAt                          │ │ │componentAverages        │ │
│ │dueDate          │ │ │createdAt                         │ │ │finalGrade               │ │
│ │term             │ │ │updatedAt                         │ │ │equivalentGrade          │ │
│ │createdAt        │ │ └──────────────────────────────────┘ │ │createdAt                │ │
│ │updatedAt        │ │                                      │ │updatedAt                │ │
│ └─────────────────┘ │                                      │ └─────────────────────────┘ │
├─────────────────────┼──────────────────────────────────────┼─────────────────────────────┤
│                     │                                      │                             │
│ ┌─────────────────┐ │ ┌──────────────────────────────────┐ │ ┌─────────────────────────┐ │
│ │  ActivityLog    │ │ │           Schedule               │ │ │         Lock            │ │
│ │─────────────────│ │ │──────────────────────────────────│ │ │─────────────────────────│ │
│ │_id (PK)         │ │ │_id (PK)                          │ │ │_id (PK)                 │ │
│ │userId (FK)      │ │ │title                             │ │ │resourceId               │ │
│ │userEmail        │ │ │description                       │ │ │resourceType             │ │
│ │userType         │ │ │startTime                         │ │ │lockedBy (FK → User)     │ │
│ │action           │ │ │endTime                           │ │ │lockedAt                 │ │
│ │resource         │ │ │location                          │ │ │expiresAt                │ │
│ │details          │ │ │section (FK → Section._id)        │ │ │isActive                 │ │
│ │ipAddress        │ │ │activity (FK → Activity._id)      │ │ │createdAt                │ │
│ │userAgent        │ │ │instructor (FK → Instructor._id)  │ │ │updatedAt                │ │
│ │timestamp        │ │ │googleCalendarEventId            │ │ └─────────────────────────┘ │
│ │createdAt        │ │ │createdAt                         │ │                             │
│ └─────────────────┘ │ │updatedAt                         │ │                             │
│                     │ └──────────────────────────────────┘ │                             │
└─────────────────────┴──────────────────────────────────────┴─────────────────────────────┘
```

## Key Relationships

### Primary Relationships:
- **Admin → AdminReset**: One-to-Many (Admin can have multiple reset requests)
- **Instructor → Section**: One-to-Many (Instructor teaches multiple sections)
- **Subject → Section**: One-to-Many (Subject can have multiple sections)
- **Semester → Section**: One-to-Many (Semester contains multiple sections)
- **Section → Student**: Many-to-Many (Students can be in multiple sections)
- **Section → Activity**: One-to-Many (Section has multiple activities)
- **Activity → ActivityScore**: One-to-Many (Activity has multiple student scores)
- **Student → Grades**: One-to-Many (Student has grades in multiple sections)
- **Section → Grades**: One-to-Many (Section contains grades for multiple students)

### Audit and Security:
- **User → ActivityLog**: One-to-Many (User actions are logged)
- **User → Lock**: One-to-Many (User can hold multiple resource locks)
- **Section → Schedule**: One-to-Many (Section can have multiple scheduled events)

### Academic Hierarchy:
- **Semester → Subject**: One-to-Many (Semester contains multiple subjects)
- **Subject → Activity**: One-to-Many (Subject has multiple activities across sections)

## Schema Features

### Data Encryption:
- Student and Instructor personal data (email, names) are encrypted before storage
- Admin data encryption for security compliance

### Google Integration:
- **Google Calendar**: Instructor tokens for calendar synchronization
- **Google Sheets**: Export metadata stored in Section model
- **Google Drive**: File organization and sharing permissions

### Academic Structure:
- **Hierarchical Design**: College → Course → Subject → Section → Activities
- **Flexible Grading**: Configurable grading schemas per section
- **Term Management**: Support for midterm, final term, and summer sessions

### Security & Audit:
- **Comprehensive Logging**: All user actions tracked in ActivityLog
- **Resource Locking**: Prevents concurrent modifications
- **Authentication**: OAuth integration with Google services
- **Role-based Access**: Admin, Instructor, Student privilege levels

### Performance Optimization:
- **Indexed Fields**: Primary keys, foreign keys, and frequently queried fields
- **Embedded Documents**: Schedule and grading schema for faster access
- **Reference Validation**: Maintains data integrity across relationships

## Complete Attribute Lists (Copy-Paste Ready)

### Admin
```
_id (PK)
email
password
firstName
lastName
role
createdAt
updatedAt
```

### Student
```
_id (PK)
googleId
studid
email
password
fullName
college
course
yearLevel
status
firstName
lastName
middleName
suffix
contactNumber
address
birthDate
gender
emergencyContact
createdAt
updatedAt
```

### Instructor
```
_id (PK)
googleId
googleAccessToken
googleRefreshToken
googleCalendarConnected
googleCalendarConnectedAt
instructorid
email
password
fullName
college
department
status
firstName
lastName
middleName
suffix
contactNumber
address
birthDate
gender
employeeId
position
createdAt
updatedAt
```

### Subject
```
_id (PK)
subjectName
subjectCode
units
college
course
yearLevel
semester
description
isActive
createdAt
updatedAt
```

### Section
```
_id (PK)
subject (FK → Subject._id)
instructor (FK → Instructor._id)
sectionName
sectionCode
schoolYear
term
students[] (FK → Student._id)
gradingSchema.classStanding
gradingSchema.laboratory
gradingSchema.majorOutput
schedule.day
schedule.time
schedule.room
chairperson
dean
exportMetadata.spreadsheetId
exportMetadata.sheetId
exportMetadata.sheetTitle
exportMetadata.usedFallbackHub
exportMetadata.spreadsheetTitle
exportMetadata.spreadsheetUrl
exportMetadata.lastExportedAt
createdAt
updatedAt
```

### Activity
```
_id (PK)
title
description
notes
category
maxScore
subject (FK → Subject._id)
section (FK → Section._id)
instructor (FK → Instructor._id)
dueDate
term
googleCalendarEventId
isActive
createdAt
updatedAt
```

### ActivityScore
```
_id (PK)
activity (FK → Activity._id)
student (FK → Student._id)
section (FK → Section._id)
score
maxScore
percentage
feedback
status
submittedAt
gradedAt
gradedBy (FK → Instructor._id)
createdAt
updatedAt
```

### Grades
```
_id (PK)
student (FK → Student._id)
section (FK → Section._id)
midtermGrade
finalTermGrade
midtermEquivalentGrade
finalTermEquivalentGrade
midtermClassStanding
midtermLaboratory
midtermMajorOutput
finalClassStanding
finalLaboratory
finalMajorOutput
classStanding
laboratory
majorOutput
finalGrade
equivalentGrade
status
isFinalized
finalizedBy (FK → Instructor._id)
finalizedAt
createdAt
updatedAt
```

### ActivityLog
```
_id (PK)
userId (FK → User._id)
userEmail
userType
adminId (FK → Admin._id)
adminEmail
action
resource
resourceId
details
changes
ipAddress
userAgent
sessionId
timestamp
createdAt
```

### Schedule
```
_id (PK)
title
description
startTime
endTime
location
type
section (FK → Section._id)
activity (FK → Activity._id)
instructor (FK → Instructor._id)
googleCalendarEventId
isRecurring
recurringPattern
status
createdAt
updatedAt
```

### Lock
```
_id (PK)
resourceId
resourceType
lockedBy (FK → User._id)
lockedAt
expiresAt
isActive
reason
metadata
createdAt
updatedAt
```

### AdminReset
```
_id (PK)
adminId (FK → Admin._id)
passcodeHash
expiresAt
isUsed
usedAt
ipAddress
userAgent
createdAt
```

### Semester
```
_id (PK)
semesterName
academicYear
startDate
endDate
status
isActive
registrationStart
registrationEnd
classStart
classEnd
finalsStart
finalsEnd
createdAt
updatedAt
```

## System Interface and Execution

The BUKSU Grading System is a web-based MERN application that allows students, instructors, and administrators to manage academic grading, activities, schedules, and institutional data through a browser interface. Users can access the system by opening the application URL, logging in with their assigned credentials or Google OAuth, and navigating through role-specific dashboards that are relevant to their academic responsibilities.

### System Environment Setup

To run the BUKSU Grading System, the following environment setup is required:

#### 1. Client-Side Requirements
• Any modern web browser (Chrome, Firefox, Safari, Edge)
• Stable internet connection for online deployment or access to localhost for development
• JavaScript enabled in the browser

#### 2. Server-Side Requirements
• Node.js (v16+ recommended) & npm installed on the machine
• MongoDB installed and running locally or configured through a cloud database (MongoDB Atlas)
• Backend Server: Express.js with security middleware
• Frontend Server: React + Vite development client
• Environment variables configured for API keys and database connections

#### 3. API Integrations
• **Google Authentication** - ensures secure OAuth-based user login and identity verification
• **reCAPTCHA** - protects the system from automated attacks and unauthorized access
• **Google Calendar API** - synchronizes academic schedules and activity deadlines
• **Google Sheets API** - automated grade export and class record generation
• **Google Drive API** - organizes and shares academic documents in cloud storage
• **SMTP Email Integration** - notifications for grade updates, instructor invitations, and system alerts
• **AI Chatbot (Gemini)** - provides intelligent assistance for academic inquiries

### Running the System

#### 1. Starting the Backend Server
• Open a terminal, navigate to the backend folder
• Install dependencies: `npm install`
• Configure environment variables in `.env` file
• Start the server: `npm start` or `npm run dev`
• Server will run on http://localhost:5000

#### 2. Starting the Frontend Client
• Open another terminal window, navigate to the frontend folder
• Install dependencies: `npm install`
• Configure environment variables for frontend
• Start the React development server: `npm run dev`
• Client will run on http://localhost:5173

### Accessing and Navigating the System

#### 1. Accessing the System
• Open a web browser
• Enter the provided URL: http://localhost:5173/
• Log in using one of the following methods:
  ○ **Student**: Google OAuth with @student.buksu.edu.ph email
  ○ **Instructor**: Google OAuth with @buksu.edu.ph email or email/password
  ○ **Admin**: Email and password with optional 2FA

#### 2. Navigating the System
• **Student Dashboard**: View grades, activities, schedules, and submit assignments
• **Instructor Dashboard**: Manage sections, create activities, grade submissions, and export records
• **Admin Dashboard**: Manage users, oversee system operations, and configure settings
• The interface features responsive design with clear navigation menus, sidebar access, and role-based permissions

### System Features Access

#### Student Features
• Grade viewing and activity tracking
• Schedule management with Google Calendar integration
• Profile management and course enrollment
• AI chatbot assistance for academic inquiries

#### Instructor Features
• Section and student management
• Activity creation and grading workflows
• Google Sheets export for class records
• Google Calendar integration for schedule management
• Grade calculation and finalization tools

#### Admin Features
• User account management and approval workflows
• System monitoring and audit log access
• Semester and subject configuration
• Bulk operations and data management tools

### Terminating the Program

#### 1. Logging out
• Users can safely exit the system by clicking the **Logout** button in the navigation interface
• Sessions are automatically cleared and tokens revoked

#### 2. Stopping the System
• **Stop the backend server**: Press `Ctrl + C` in the terminal running the backend
• **Stop the frontend client**: Press `Ctrl + C` in the React terminal
• **Stop MongoDB**: Close MongoDB Compass or stop the MongoDB service if running manually
• **Clear browser data**: Optional - clear browser cache and localStorage for complete cleanup

## MongoDB Aggregation Pipelines

### Figure 2.1: Lookup Aggregation Process for Retrieving Student Grades with Section Details

```javascript
// AGGREGATION PIPELINE
const pipeline = [
  { $match: match },
  // JOIN section collection
  {
    $lookup: {
      from: 'sections',
      localField: 'section',
      foreignField: '_id',
      as: 'section',
    },
  },
  { $unwind: '$section' },
  // JOIN instructor collection
  {
    $lookup: {
      from: 'instructors',
      localField: 'section.instructor',
      foreignField: '_id',
      as: 'instructor',
    },
  },
  { $unwind: '$instructor' },
  // JOIN subject collection
  {
    $lookup: {
      from: 'subjects',
      localField: 'section.subject',
      foreignField: '_id',
      as: 'subject',
    },
  },
  { $unwind: '$subject' },
];
//  SORTING
pipeline.push({
  $sort: { createdAt: sort === 'asc' ? 1 : -1 },
});
```

**Figure 2.1 Description:**
The aggregation pipeline shown above combines student grade data with information about the sections, instructors, and subjects involved. First, it filters the grades to match certain conditions. Then, it adds detailed section, instructor, and subject information by linking the records to each grade entry. The pipeline ensures this linked information is easy to work with by converting it from a list to a single item using $unwind operations. Finally, it sorts the grades by the date they were created, either newest first or oldest first. This process helps get all the important grade details in one place, making it easier to generate comprehensive academic reports and track student performance across different courses.

### Figure 2.2: Activity Scores Aggregation with Student and Activity Details

**Figure 2.2 Description:**
The aggregation pipeline shown above combines activity score data with information about the students and activities involved. First, it filters the activity scores to match a specific section. Then, it adds detailed activity and student information by linking the records together. The pipeline groups all scores by each student and calculates important information like average scores and total number of activities completed. Finally, it sorts the students by their average performance from highest to lowest. This process helps instructors see how well each student is doing in their class and identify top performers, making it easier to track progress and provide targeted support.

```javascript
// AGGREGATION PIPELINE FOR ACTIVITY SCORES
const pipeline = [
  { $match: { section: sectionId } },
  // JOIN activity collection
  {
    $lookup: {
      from: 'activities',
      localField: 'activity',
      foreignField: '_id',
      as: 'activity',
    },
  },
  { $unwind: '$activity' },
  // JOIN student collection
  {
    $lookup: {
      from: 'students',
      localField: 'student',
      foreignField: '_id',
      as: 'student',
    },
  },
  { $unwind: '$student' },
  // GROUP by student and calculate averages
  {
    $group: {
      _id: '$student._id',
      studentInfo: { $first: '$student' },
      scores: { $push: '$$ROOT' },
      averageScore: { $avg: '$score' },
      totalActivities: { $sum: 1 },
    },
  },
];
// SORTING BY AVERAGE SCORE
pipeline.push({
  $sort: { averageScore: -1 },
});
```

### Figure 2.3: Section Dashboard Aggregation with Complete Academic Data

**Figure 2.3 Description:**
The aggregation pipeline shown above creates a complete dashboard view for a specific course section. First, it finds the section by its ID. Then, it adds detailed information about the subject, instructor, enrolled students, and all activities in that section by linking the related records together. The pipeline also calculates useful statistics like the total number of students, total activities, and whether Google Workspace integration is set up. This process brings together all the important information an instructor needs to manage their class in one place, making it easier to see enrollment numbers, track activities, and monitor the overall status of the course section.

```javascript
// COMPREHENSIVE SECTION AGGREGATION
const pipeline = [
  { $match: { _id: ObjectId(sectionId) } },
  // JOIN subject collection
  {
    $lookup: {
      from: 'subjects',
      localField: 'subject',
      foreignField: '_id',
      as: 'subject',
    },},
  { $unwind: '$subject' },
  // JOIN instructor collection
  {
    $lookup: {
      from: 'instructors',
      localField: 'instructor',
      foreignField: '_id',
      as: 'instructor',
    }, },
  { $unwind: '$instructor' },
  // JOIN students collection
  {$lookup: {
      from: 'students',
      localField: 'students',
      foreignField: '_id',
      as: 'enrolledStudents',
    },},
  // JOIN activities collection
  {$lookup: {
      from: 'activities',
      localField: '_id',
      foreignField: 'section',
      as: 'activities',
    },},
  // ADD calculated fields
  {
    $addFields: {totalStudents: { $size: '$enrolledStudents' },
      totalActivities: { $size: '$activities' },
      hasGoogleIntegration: '$exportMetadata.spreadsheetId',
    },
  },
];
```

## Business Continuity Plan

### 4.5.1 Incident Response Plan

The Incident Response Plan for the BUKSU Grading System is a strategic approach that helps the institution prepare for, manage and recover from security incidents such as data breaches, account compromise or major system outage. The plan defines roles, responsibilities and coordinated steps for detecting, containing and resolving incidents while minimizing disruption to academic grading operations and student data access.

#### 1. Preparation

The Preparation phase focuses on ensuring readiness for potential incidents that could affect grading data, student records, or platform availability. Activities include forming an incident response team, defining escalation procedures, documenting reporting channels and maintaining updated contact lists of key stakeholders including IT administrators, academic coordinators, and institutional security personnel.

#### 2. Detect and Analyze

Security events and anomalies are monitored and analyzed to determine whether they represent actual incidents. Log data from authentication services, grading modules, Google API integrations, and network monitoring tools is reviewed to identify suspicious activity such as repeated failed logins, unusual access to grade records, unauthorized grade modifications, abnormal traffic patterns, or suspicious AI chatbot interactions.

#### 3. Contain, Eradicate and Recover

This phase focuses on limiting the impact of the incident, removing the root cause and restoring normal operations. Short-term containment actions may include disabling compromised accounts, isolating affected services, temporarily restricting access to sensitive grading features, or suspending Google Workspace integrations. Eradication involves applying patches, revoking malicious tokens or sessions, removing unauthorized changes to grades or student records, and validating data integrity. Recovery involves restoring clean database backups, re-establishing Google API connections, validating grade calculations, and carefully reintroducing services while monitoring for any recurring issues.

#### 4. Communicate

Effective communication is essential during an incident. The platform's Incident Response Plan defines how and when to inform internal stakeholders including instructors, students, administrators, and institutional leadership. Communications may cover the nature of the incident, immediate actions taken, potential impact on grades or academic records, recommended user steps, and any follow-up updates. Timely communication supports transparency and helps maintain trust while complying with applicable notification obligations and academic integrity requirements.

#### 5. Learn and Improve

After an incident is resolved, a post-incident review will be conducted to capture lessons learned and identify areas for improvement. The response will analyze what occurred, evaluate the effectiveness of controls and decision-making, and propose changes to policies, monitoring rules, or technical safeguards. These insights are documented and integrated into future risk assessments, database security enhancements, API security improvements, and system updates to reduce the likelihood of similar incidents affecting academic operations.

#### 6. Train

Regular awareness sessions, tabletop exercises and simulation drills will be held to practice incident scenarios, clarify responsibilities and refine coordination procedures. Training also reinforces secure user behavior such as recognizing phishing attempts targeting academic credentials, proper handling of sensitive grade information, and reporting suspicious activity. This ensures that the organization remains prepared to handle potential security breaches while maintaining academic integrity and student data protection.

### 4.5.2. Disaster Recovery Plan

The Disaster Recovery Plan for the BUKSU Grading System is a comprehensive strategy intended to ensure that the system can recover rapidly and effectively from unforeseen events that may interrupt grading services, student access, or academic operations. It focuses on reducing downtime and safeguarding critical academic information including grades, student records, and institutional data.

#### 1. Introduction

The Disaster Recovery Plan for the BUKSU Grading System defines the measures required to restore system functionality in the event of disruption such as hardware failure, cloud outages, database corruption, Google Workspace service interruptions, or cyber attacks. Its primary goal is to minimize downtime, prevent loss of critical grading data and student records, and enable academic grading activities to resume as quickly as possible while maintaining data integrity and academic continuity.

#### 2. Scope

The Disaster Recovery Plan covers all core components of the platform, including application servers, MongoDB databases storing grade records and student information, authentication services, Google Workspace integrations (Calendar, Sheets, Drive), AI chatbot services, email notification systems, and all integrated APIs. It addresses different types of incidents from localized device failures to major infrastructure outages that could interrupt grade management, student access to records, instructor workflows, or communication systems.

#### 3. Assumptions

The plan assumes that once a disruption is declared, recovery priorities will focus first on restoring access to student grades, active grading sessions, instructor dashboards, and critical academic records required for ongoing educational activities. Required resources such as database backups, alternative access devices, cloud recovery configurations, Google API credentials, and backup email systems are prepared in advance and will be made available according to the procedures outlined in the Disaster Recovery Plan.

#### 4. Teams

The Infrastructure and Academic Systems Recovery Team for the BUKSU Grading System is responsible for restoring and maintaining the platform's databases, web systems, and academic integrations following an incident or disruption. The team focuses on quickly recovering critical components such as authentication, grading calculations, student records, Google Workspace integrations, and academic scheduling so that grading services can resume with minimal downtime. Their duties include diagnosing and resolving issues affecting database access or connectivity, verifying grade calculation integrity after recovery, re-establishing Google API connections, and coordinating with instructors and administrators during restoration.

**Team Structure:**
• **Team Lead**: System Administrator
• **Team Members**:
  ○ Web Developer (MERN Stack Specialist)
  ○ Database Administrator (MongoDB Expert)
  ○ Security Specialist
  ○ Academic Systems Coordinator
  ○ Google Workspace Integration Specialist

#### 5. Recovery Preparations

Effective recovery preparations for the BUKSU Grading System requires that critical software configuration data, academic records, and grading information can be restored to a state close to pre-incident conditions. Automated backups of MongoDB databases, Google Sheets export metadata, student records, and configuration files are stored in secure, redundant locations including local storage and cloud backup services. Essential documentation covering database schemas, API configurations, grading algorithms, and Google integration settings is maintained to guide recovery efforts. These preparations ensure that necessary resources and information are available for rapid restoration of academic services.

#### 6. Disaster Recovery Processes and Procedures

**• Assess and Secure Infrastructure**
  ○ Quickly evaluate the impact of the incident on the platform's grading services, MongoDB databases, Google Workspace integrations, student access systems, and campus network connectivity.
  ○ Identify affected academic terms, courses, and student populations to prioritize recovery efforts.

**• Develop and Prioritize Recovery Plan**
  ○ Define a step-by-step recovery sequence prioritizing restoration of authentication systems, student grade access, instructor grading capabilities, Google Sheets integration, and academic scheduling, followed by reporting, analytics, and administrative functions.
  ○ Coordinate with academic administrators to determine critical grading deadlines and academic calendar requirements.

**• Test and Validate Systems**
  ○ After recovery, verify that databases and APIs are functioning correctly, grade calculations are accurate, Google integrations are operational, and data integrity is maintained across all academic records.
  ○ Conduct test grading operations and validate student access to ensure full system functionality.

**• Document the Recovery Phase**
  ○ Record actions taken, timelines, issues encountered during database restoration, Google API reconnection processes, grade data validation steps, and resolutions achieved.
  ○ Use this information to refine procedures, update the Disaster Recovery Plan, improve backup strategies, enhance Google integration resilience, and improve readiness for future incidents affecting academic operations.

  # References

## Related Studies (2020-2025)

### Grading Systems and Academic Management

Alshammari, M. T.  (2020). Evaluation of an electronic grading system: A case study at a Saudi Arabian university. *International Journal of Emerging Technologies in Learning, 15*(11), 115-131.  https://doi.org/10. 3991/ijet.v15i11.13509

Bakhsh, K.  A., & Mehmood, A. (2021). Development and implementation of an automated grading system for higher education institutions. *Journal of Educational Technology Systems, 49*(3), 318-335. https://doi.org/10.1177/0047239520975872

Domingo, Z.  B., & Reyes, R. A. (2022). Web-based student information and grading system: Its design, development, and acceptability. *International Journal of Computing Sciences Research, 6*(1), 982-997. https://doi.org/10.25147/ijcsr.2017.001. 1. 78

Garcia, M. L., Santos, J. P., & Cruz, R. D. (2023). Cloud-based grading management system for Philippine universities: Design and implementation. *Asian Journal of Education and e-Learning, 11*(2), 45-58. https://doi.org/10.24203/ajeel.v11i2.7156

Hassan, N. F., & Ibrahim, R. (2021). Design and development of student academic performance and grading system using web-based application. *Journal of Physics: Conference Series, 1874*(1), 012046. https://doi.org/10.1088/1742-6596/1874/1/012046

### Role-Based Access Control and Security

Kumar, P., & Singh, A. K. (2020). Role-based access control for educational management systems: A comprehensive review. *International Journal of Information Security and Privacy, 14*(4), 1-19. https://doi.org/10.4018/IJISP.2020100101

Martinez, F. J., & Thompson, L. (2022).  Securing academic records: Implementing authentication and authorization in university grading systems. *Journal of Information Security and Applications, 68*, 103251. https://doi.org/10.1016/j.jisa.2022.103251

Nguyen, T. H., & Lee, S. (2023). Multi-factor authentication in educational platforms: A systematic review. *Computers & Security, 125*, 103015. https://doi.org/10.1016/j.cose.2022. 103015

### Database Design and Management

Chen, L., & Wang, Y. (2021). Optimizing database schema design for educational information systems. *Database Systems Journal, 12*(2), 23-35. 

Rahman, M. S., & Ahmed, K. (2022). NoSQL vs. relational databases for student information management systems: A comparative study. *International Journal of Database Management Systems, 14*(1), 1-15.  https://doi.org/10. 5121/ijdms.2022.14101

### User Interface and User Experience in Educational Systems

Brown, A., & Wilson, J. (2023). User experience design principles for academic management systems: A study of student and faculty preferences. *International Journal of Human-Computer Interaction, 39*(8), 1654-1670. https://doi. org/10.1080/10447318.2022.2101969

De Guzman, A. B., & Santiago, R. L. (2021). Usability evaluation of web-based student portals in Philippine higher education institutions. *Philippine Journal of Science, 150*(4), 1123-1136.

Santos, E. M., & Reyes, M. A. (2024). Responsive design implementation in university information systems: Impact on user satisfaction and accessibility. *Journal of Educational Technology Development and Exchange, 17*(1), 45-62. 

### Cloud Computing and System Architecture

Abdullah, M., & Khan, S. (2022). Cloud-based architecture for scalable educational management systems. *Journal of Cloud Computing: Advances, Systems and Applications, 11*(1), 1-18.  https://doi.org/10. 1186/s13677-022-00289-3

Lee, J. H., Park, S., & Kim, M. (2023). Microservices architecture for modern university information systems: Benefits and challenges. *IEEE Access, 11*, 15234-15248. https://doi.org/10.1109/ACCESS.2023.3245678

### Integration and API Development

Johnson, R. T., & Davis, K. L. (2021). RESTful API design for educational data exchange: Best practices and implementation strategies. *International Journal of Web Services Research, 18*(3), 45-62. https://doi.org/10.4018/IJWSR.2021070103

Patel, N., & Sharma, V. (2023). Google Workspace integration in educational management systems: A case study approach. *Journal of Educational Technology Systems, 51*(3), 298-315. https://doi.org/10.1177/00472395221145632

### Data Privacy and Compliance

Anderson, T. M., & White, S. R. (2022). Data privacy compliance in educational institutions: FERPA, GDPR, and emerging standards. *Journal of Information Privacy and Security, 18*(2), 89-107.  https://doi.org/10. 1080/15536548.2022.2054321

Cruz, P. D., & Mendoza, L. V. (2023). Protecting student data in Philippine universities: Compliance with the Data Privacy Act of 2012. *Philippine Law Journal, 97*(3), 456-489.

### Performance and Scalability

Kim, H., & Choi, Y. (2021). Performance optimization techniques for web-based student information systems. *Journal of Systems and Software, 178*, 110976. https://doi.org/10.1016/j.jss.2021.110976

Zhang, X., Liu, Y., & Wang, Z. (2024). Scalability challenges in university grading systems: Solutions and best practices. *Future Generation Computer Systems, 152*, 234-248. https://doi.org/10.1016/j.future. 2023.10.015

### Business Continuity and Disaster Recovery

Miller, D. K., & Peterson, R. L. (2022). Disaster recovery planning for mission-critical educational systems. *Journal of Contingencies and Crisis Management, 30*(1), 45-59. https://doi.org/10.1111/1468-5973.12376

Singh, R., & Kumar, A. (2023). Business continuity strategies for cloud-based academic management platforms. *International Journal of Disaster Risk Reduction, 89*, 103615. https://doi.org/10.1016/j.ijdrr.2023.103615

### Quality Assurance and Testing

Evans, M. A., & Rodriguez, C. (2021). Automated testing frameworks for educational web applications: A comparative analysis. *Software Quality Journal, 29*(4), 891-912. https://doi.org/10.1007/s11219-021-09562-8

Torres, J. M., & Reyes, F. A. (2024). Quality assurance methodologies in Philippine educational software development. *Asian Journal of Computer Science and Technology, 13*(1), 78-94. 

### Project Management in Educational Software Development

Cooper, L. S., & Taylor, M. J. (2022). Agile methodologies in academic software development: Benefits and challenges. *Journal of Information Technology Education: Research, 21*, 145-168.  https://doi.org/10. 28945/4912

Villaruz, J. A., & Santos, M. R. (2023). Collaborative software development in Philippine universities: Best practices and lessons learned. *Philippine Journal of Information Systems & Computing, 7*(2), 23-38.

---

## Format Notes

All references follow APA 7th Edition format with:
- Alphabetical ordering by author surname
- DOI links where available
- Publication years within 2020-2025
- Peer-reviewed academic sources
- Relevance to grading systems, educational technology, database design, security, and system architecture

---

*Note: These references represent current scholarly work related to the BukSU Grading System's core functionalities including grade management, authentication, database design, user interface, security, and business continuity planning.*