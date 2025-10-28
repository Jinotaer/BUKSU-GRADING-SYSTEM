import express from 'express';
import {
  loginAdmin,
  refreshToken,
  inviteInstructor,
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

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', bruteForceProtection, loginAdmin);
router.post('/refresh-token', refreshToken);

// Public reset password routes (must be before adminAuth middleware)
router.post('/request-reset-password', requestResetPassword);
router.post('/reset-password', resetPassword);
router.post("/verify-reset-code", verifyResetCode);

// Protected routes (require admin authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

// Admin profile routes
router.get('/profile', getAdminProfile);
// router.put('/change-password', changePassword);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Instructor management
router.post('/instructors/invite', inviteInstructor);
router.get('/instructors', getAllInstructors);
router.delete('/instructors/:instructorId', deleteInstructor);
router.put('/instructors/:instructorId/archive', archiveInstructor);
router.put('/instructors/:instructorId/unarchive', unarchiveInstructor);

// Student management
router.get('/students', getAllStudents);
router.put('/students/:studentId/status', updateStudentStatus);
router.delete('/students/:studentId', deleteStudent);
router.put('/students/:studentId/archive', archiveStudent);
router.put('/students/:studentId/unarchive', unarchiveStudent);

// Semester management
router.get('/semesters', listSemesters);
router.post('/semesters', addSemester);
router.put('/semesters/:id', requireLock('semester'), updateSemester);
router.delete('/semesters/:id', requireLock('semester'), deleteSemester);
router.put('/semesters/:id/archive', requireLock('semester'), archiveSemester);
router.put('/semesters/:id/unarchive', unarchiveSemester);

// Subject management
router.get('/subjects', listSubjects);
router.post('/subjects', addSubject);
router.put('/subjects/:id', requireLock('subject'), updateSubject);
router.delete('/subjects/:id', requireLock('subject'), deleteSubject);
router.post('/subjects/:subjectId/assign-instructor', assignInstructorToSubject);
router.put('/subjects/:id/archive', requireLock('subject'), archiveSubject);
router.put('/subjects/:id/unarchive', unarchiveSubject);

// Section management  
router.get('/sections', getAllSections);
router.get('/sections/:id', getSectionById);
router.post('/sections', createSection);
router.put('/sections/:id', requireLock('section'), updateSection);
router.delete('/sections/:id', requireLock('section'), deleteSection);
router.post('/sections/:id/invite-students', inviteStudentsToSection);
router.get('/sections/:id/students', getSectionStudents);
router.delete('/sections/:id/remove-student', removeStudentFromSection);
router.put('/sections/:id/archive', requireLock('section'), archiveSection);
router.put('/sections/:id/unarchive', unarchiveSection);

export default router;
