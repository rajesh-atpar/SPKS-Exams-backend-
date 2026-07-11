import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
  createStudentValidator,
  updateStudentValidator,
  getStudentValidator,
  listStudentsValidator,
  updateProfileValidator
} from '../validators/student.validator.js';
import {
  createStudent,
  getStudent,
  listStudents,
  updateStudent,
  deleteStudent,
  getStudentProfile,
  updateStudentProfile,
  getAvailableExams,
  getExamHistory,
  getStudentResults,
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getLeaderboard
} from '../controllers/student.controller.js';

const router = Router();

// Public routes (none for student management)

// Protected routes
router.use(authenticate);

// Student management - Admin only
router.post(
  '/',
  authorize('admin'),
  authRateLimiter,
  createStudentValidator,
  validate,
  createStudent
);

router.get(
  '/',
  authorize('admin'),
  listStudentsValidator,
  validate,
  listStudents
);

router.get(
  '/:id',
  authorize('admin'),
  getStudentValidator,
  validate,
  getStudent
);

router.put(
  '/:id',
  authorize('admin'),
  updateStudentValidator,
  validate,
  updateStudent
);

router.delete(
  '/:id',
  authorize('admin'),
  getStudentValidator,
  validate,
  deleteStudent
);

// Student profile routes - Student only
router.get(
  '/me/profile',
  authorize('student'),
  getStudentProfile
);

router.put(
  '/me/profile',
  authorize('student'),
  updateProfileValidator,
  validate,
  updateStudentProfile
);

// Student exam routes
router.get(
  '/me/exams/available',
  authorize('student'),
  getAvailableExams
);

router.get(
  '/me/exams/history',
  authorize('student'),
  getExamHistory
);

router.get(
  '/me/results',
  authorize('student'),
  getStudentResults
);

// Notification routes
router.get(
  '/me/notifications',
  authorize('student'),
  getNotifications
);

router.put(
  '/me/notifications/:id/read',
  authorize('student'),
  markNotificationAsRead
);

router.put(
  '/me/notifications/read-all',
  authorize('student'),
  markAllNotificationsAsRead
);

// Leaderboard - accessible by both
router.get(
  '/leaderboard/:examId',
  getLeaderboard
);

export default router;
