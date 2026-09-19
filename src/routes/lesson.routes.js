import { Router } from 'express';
import { authenticate, authorizeAppUser } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/subscription.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as contentController from '../controllers/content.controller.js';

const router = Router();

router.get('/:lessonId', authenticate, requireActivePlan, uuidParam('lessonId'), validate, contentController.getLesson);
router.get('/:lessonId/pdf', authenticate, requireActivePlan, uuidParam('lessonId'), validate, contentController.viewLessonPdf);
router.post('/:lessonId/progress', authenticate, authorizeAppUser, requireActivePlan, uuidParam('lessonId'), validate, contentController.accessLesson);
router.post('/:lessonId/complete', authenticate, authorizeAppUser, requireActivePlan, uuidParam('lessonId'), validate, contentController.completeLesson);

export default router;
