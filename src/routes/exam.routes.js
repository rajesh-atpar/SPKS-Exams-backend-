import { Router } from 'express';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createExamValidator,
  updateExamValidator,
  getExamValidator,
  listExamsValidator,
  assignExamValidator,
  startExamValidator
} from '../validators/exam.validator.js';
import {
  createExam,
  getExam,
  listExams,
  updateExam,
  deleteExam,
  assignExam,
  startExam,
  submitAnswer,
  submitExam,
  getExamStatistics
} from '../controllers/exam.controller.js';

const router = Router();

// Protected routes - Admin only for management
router.use(authenticate);

// Exam management - Admin only
router.post(
  '/',
  authorize('admin'),
  checkPermission('manage_exams'),
  createExamValidator,
  validate,
  createExam
);

router.get(
  '/',
  authorize('admin'),
  checkPermission('manage_exams'),
  listExamsValidator,
  validate,
  listExams
);

router.get(
  '/:id',
  authorize('admin'),
  checkPermission('manage_exams'),
  getExamValidator,
  validate,
  getExam
);

router.put(
  '/:id',
  authorize('admin'),
  checkPermission('manage_exams'),
  updateExamValidator,
  validate,
  updateExam
);

router.delete(
  '/:id',
  authorize('admin'),
  checkPermission('manage_exams'),
  getExamValidator,
  validate,
  deleteExam
);

// Assign exam to students
router.post(
  '/assign',
  authorize('admin'),
  checkPermission('manage_exams'),
  assignExamValidator,
  validate,
  assignExam
);

// Exam statistics
router.get(
  '/:id/statistics',
  authorize('admin'),
  checkPermission('view_reports'),
  getExamValidator,
  validate,
  getExamStatistics
);

// Student exam routes
router.post(
  '/:examId/start',
  authorize('student'),
  startExamValidator,
  validate,
  startExam
);

router.post(
  '/attempts/:attemptId/answers',
  authorize('student'),
  submitAnswer
);

router.post(
  '/attempts/:attemptId/submit',
  authorize('student'),
  submitExam
);

export default router;
