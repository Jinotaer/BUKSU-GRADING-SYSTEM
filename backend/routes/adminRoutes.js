import express from 'express';
import {
  loginAdmin,
  refreshToken,
  inviteInstructor,
  inviteMultipleInstructors,
  getAllInstructors,
  deleteInstructor,
  getAllStudents,
  updateStudentStatus,
  deleteStudent,
  getDashboardStats,
  getAdminProfile,
  requestResetPassword,
  verifyResetCode,
  resetPassword,
  archiveStudent,
  unarchiveStudent,
  archiveInstructor,
  unarchiveInstructor,
  logoutAdmin,
  // changePassword,
} from '../controller/adminController.js';
import {
  addSemester,
  listSemesters,
  updateSemester,
  deleteSemester,
  archiveSemester,
  unarchiveSemester
} from '../controller/semesterController.js';
import {
  addSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
  assignInstructorToSubject,
  archiveSubject,
  unarchiveSubject
} from '../controller/subjectController.js';
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  inviteStudentsToSection,
  getSectionStudents,
  removeStudentFromSection,
  archiveSection,
  unarchiveSection
} from '../controller/sectionController.js';
import { adminAuth } from '../middleware/auth.js';
import { requireLock } from '../middleware/requireLock.js';
import { bruteForceProtection } from '../middleware/bruteForceProtection.js';
import { universalAuditLogger } from '../middleware/universalAuditLogger.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', bruteForceProtection, universalAuditLogger('LOGIN', 'AUTHENTICATION'), loginAdmin);
router.post('/refresh-token', refreshToken);

// Public reset password routes (must be before adminAuth middleware)
router.post('/request-reset-password', requestResetPassword);
router.post('/reset-password', resetPassword);
router.post("/verify-reset-code", verifyResetCode);

// Protected routes (require admin authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

// Admin profile routes
router.get('/profile', universalAuditLogger('PROFILE_VIEWED', 'PROFILE_MANAGEMENT'), getAdminProfile);
router.post('/logout', universalAuditLogger('LOGOUT', 'AUTHENTICATION'), logoutAdmin);
// router.put('/change-password', changePassword);

// Dashboard
router.get('/dashboard/stats', universalAuditLogger('DASHBOARD_VIEWED', 'SYSTEM'), getDashboardStats);

// Instructor management
router.post('/instructors/invite', universalAuditLogger('INSTRUCTOR_INVITED', 'USER_MANAGEMENT'), inviteInstructor);
router.post('/instructors/invite/bulk', universalAuditLogger('MULTIPLE_INSTRUCTORS_INVITED', 'USER_MANAGEMENT'), inviteMultipleInstructors);
router.get('/instructors', universalAuditLogger('INSTRUCTOR_VIEWED', 'USER_MANAGEMENT'), getAllInstructors);
router.delete('/instructors/:instructorId', universalAuditLogger('INSTRUCTOR_DELETED', 'USER_MANAGEMENT'), deleteInstructor);
router.put('/instructors/:instructorId/archive', universalAuditLogger('INSTRUCTOR_ARCHIVED', 'USER_MANAGEMENT'), archiveInstructor);
router.put('/instructors/:instructorId/unarchive', universalAuditLogger('INSTRUCTOR_UNARCHIVED', 'USER_MANAGEMENT'), unarchiveInstructor);

// Student management
router.get('/students', universalAuditLogger('STUDENT_VIEWED', 'USER_MANAGEMENT'), getAllStudents);
router.put('/students/:studentId/status', universalAuditLogger('STUDENT_UPDATED', 'USER_MANAGEMENT'), updateStudentStatus);
router.delete('/students/:studentId', universalAuditLogger('STUDENT_DELETED', 'USER_MANAGEMENT'), deleteStudent);
router.put('/students/:studentId/archive', universalAuditLogger('STUDENT_ARCHIVED', 'USER_MANAGEMENT'), archiveStudent);
router.put('/students/:studentId/unarchive', universalAuditLogger('STUDENT_UNARCHIVED', 'USER_MANAGEMENT'), unarchiveStudent);

// Semester management
router.get('/semesters', universalAuditLogger('SEMESTER_VIEWED', 'ACADEMIC_MANAGEMENT'), listSemesters);
router.post('/semesters', universalAuditLogger('SEMESTER_CREATED', 'ACADEMIC_MANAGEMENT'), addSemester);
router.put('/semesters/:id', requireLock('semester'), universalAuditLogger('SEMESTER_UPDATED', 'ACADEMIC_MANAGEMENT'), updateSemester);
router.delete('/semesters/:id', requireLock('semester'), universalAuditLogger('SEMESTER_DELETED', 'ACADEMIC_MANAGEMENT'), deleteSemester);
router.put('/semesters/:id/archive', requireLock('semester'), universalAuditLogger('SEMESTER_ARCHIVED', 'ACADEMIC_MANAGEMENT'), archiveSemester);
router.put('/semesters/:id/unarchive', universalAuditLogger('SEMESTER_UNARCHIVED', 'ACADEMIC_MANAGEMENT'), unarchiveSemester);

// Subject management
router.get('/subjects', universalAuditLogger('SUBJECT_VIEWED', 'ACADEMIC_MANAGEMENT'), listSubjects);
router.post('/subjects', universalAuditLogger('SUBJECT_CREATED', 'ACADEMIC_MANAGEMENT'), addSubject);
router.put('/subjects/:id', requireLock('subject'), universalAuditLogger('SUBJECT_UPDATED', 'ACADEMIC_MANAGEMENT'), updateSubject);
router.delete('/subjects/:id', requireLock('subject'), universalAuditLogger('SUBJECT_DELETED', 'ACADEMIC_MANAGEMENT'), deleteSubject);
router.post('/subjects/:subjectId/assign-instructor', universalAuditLogger('SUBJECT_UPDATED', 'ACADEMIC_MANAGEMENT'), assignInstructorToSubject);
router.put('/subjects/:id/archive', requireLock('subject'), universalAuditLogger('SUBJECT_ARCHIVED', 'ACADEMIC_MANAGEMENT'), archiveSubject);
router.put('/subjects/:id/unarchive', universalAuditLogger('SUBJECT_UNARCHIVED', 'ACADEMIC_MANAGEMENT'), unarchiveSubject);

// Section management  
router.get('/sections', universalAuditLogger('SECTION_VIEWED', 'ACADEMIC_MANAGEMENT'), getAllSections);
router.get('/sections/:id', universalAuditLogger('SECTION_VIEWED', 'ACADEMIC_MANAGEMENT'), getSectionById);
router.post('/sections', universalAuditLogger('SECTION_CREATED', 'ACADEMIC_MANAGEMENT'), createSection);
router.put('/sections/:id', requireLock('section'), universalAuditLogger('SECTION_UPDATED', 'ACADEMIC_MANAGEMENT'), updateSection);
router.delete('/sections/:id', requireLock('section'), universalAuditLogger('SECTION_DELETED', 'ACADEMIC_MANAGEMENT'), deleteSection);
router.post('/sections/:id/invite-students', universalAuditLogger('SECTION_UPDATED', 'ACADEMIC_MANAGEMENT'), inviteStudentsToSection);
router.get('/sections/:id/students', universalAuditLogger('SECTION_STUDENTS_VIEWED', 'ACADEMIC_MANAGEMENT'), getSectionStudents);
router.delete('/sections/:id/remove-student', universalAuditLogger('SECTION_UPDATED', 'ACADEMIC_MANAGEMENT'), removeStudentFromSection);
router.put('/sections/:id/archive', requireLock('section'), universalAuditLogger('SECTION_ARCHIVED', 'ACADEMIC_MANAGEMENT'), archiveSection);
router.put('/sections/:id/unarchive', universalAuditLogger('SECTION_UNARCHIVED', 'ACADEMIC_MANAGEMENT'), unarchiveSection);

export default router;
