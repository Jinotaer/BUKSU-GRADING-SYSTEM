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
  changePassword
} from '../controller/adminController.js';
import {
  addSemester,
  listSemesters,
  updateSemester,
  deleteSemester
} from '../controller/semesterController.js';
import {
  addSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
  assignInstructorToSubject
} from '../controller/subjectController.js';
import {
  createSection,
  getAllSections,
  getSectionById,
  updateSection,
  deleteSection,
  inviteStudentsToSection,
  getSectionStudents,
  removeStudentFromSection
} from '../controller/sectionController.js';
import { adminAuth } from '../middleware/auth.js';
import { bruteForceProtection } from '../middleware/bruteForceProtection.js';

const router = express.Router();

// Public routes (no authentication required)
router.post('/login', bruteForceProtection, loginAdmin);
router.post('/refresh-token', refreshToken);

// Protected routes (require admin authentication)
router.use(adminAuth); // Apply admin authentication to all routes below

// Admin profile routes
router.get('/profile', getAdminProfile);
router.put('/change-password', changePassword);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Instructor management
router.post('/instructors/invite', inviteInstructor);
router.get('/instructors', getAllInstructors);
router.delete('/instructors/:instructorId', deleteInstructor);

// Student management
router.get('/students', getAllStudents);
router.put('/students/:studentId/status', updateStudentStatus);
router.delete('/students/:studentId', deleteStudent);

// Semester management
router.get('/semesters', listSemesters);
router.post('/semesters', addSemester);
router.put('/semesters/:id', updateSemester);
router.delete('/semesters/:id', deleteSemester);

// Subject management
router.get('/subjects', listSubjects);
router.post('/subjects', addSubject);
router.put('/subjects/:id', updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/subjects/:subjectId/assign-instructor', assignInstructorToSubject);

// Section management  
router.get('/sections', getAllSections);
router.get('/sections/:id', getSectionById);
router.post('/sections', createSection);
router.put('/sections/:id', updateSection);
router.delete('/sections/:id', deleteSection);
router.post('/sections/:id/invite-students', inviteStudentsToSection);
router.get('/sections/:id/students', getSectionStudents);
router.delete('/sections/:id/remove-student', removeStudentFromSection);

export default router;
