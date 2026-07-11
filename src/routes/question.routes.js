import { Router } from 'express';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createQuestionValidator,
  updateQuestionValidator,
  getQuestionValidator,
  listQuestionsValidator
} from '../validators/question.validator.js';
import {
  createQuestion,
  getQuestion,
  listQuestions,
  updateQuestion,
  deleteQuestion,
  getExamQuestions,
  batchCreateQuestions
} from '../controllers/question.controller.js';

const router = Router();

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.post(
  '/',
  checkPermission('manage_questions'),
  createQuestionValidator,
  validate,
  createQuestion
);

router.post(
  '/batch',
  checkPermission('manage_questions'),
  batchCreateQuestions
);

router.get(
  '/',
  checkPermission('manage_questions'),
  listQuestionsValidator,
  validate,
  listQuestions
);

router.get(
  '/exam/:examId',
  checkPermission('manage_questions'),
  getExamQuestions
);

router.get(
  '/:id',
  checkPermission('manage_questions'),
  getQuestionValidator,
  validate,
  getQuestion
);

router.put(
  '/:id',
  checkPermission('manage_questions'),
  updateQuestionValidator,
  validate,
  updateQuestion
);

router.delete(
  '/:id',
  checkPermission('manage_questions'),
  getQuestionValidator,
  validate,
  deleteQuestion
);

export default router;
