import { Router } from 'express';
import { authenticate, authorize, checkPermission } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import {
  createSubjectValidator,
  updateSubjectValidator,
  getSubjectValidator,
  listSubjectsValidator
} from '../validators/subject.validator.js';
import {
  createSubject,
  getSubject,
  listSubjects,
  updateSubject,
  deleteSubject,
  getActiveSubjects
} from '../controllers/subject.controller.js';

const router = Router();

// Public routes
router.get(
  '/active',
  getActiveSubjects
);

// Protected routes - Admin only
router.use(authenticate);
router.use(authorize('admin'));

router.post(
  '/',
  checkPermission('manage_subjects'),
  createSubjectValidator,
  validate,
  createSubject
);

router.get(
  '/',
  checkPermission('manage_subjects'),
  listSubjectsValidator,
  validate,
  listSubjects
);

router.get(
  '/:id',
  checkPermission('manage_subjects'),
  getSubjectValidator,
  validate,
  getSubject
);

router.put(
  '/:id',
  checkPermission('manage_subjects'),
  updateSubjectValidator,
  validate,
  updateSubject
);

router.delete(
  '/:id',
  checkPermission('manage_subjects'),
  getSubjectValidator,
  validate,
  deleteSubject
);

export default router;
