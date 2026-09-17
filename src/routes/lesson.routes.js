import { Router } from 'express';
import { authenticate, authorizeAppUser, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as contentController from '../controllers/content.controller.js';

const router = Router();

router.get('/:lessonId', optionalAuth, uuidParam('lessonId'), validate, contentController.getLesson);
router.post('/:lessonId/progress', authenticate, authorizeAppUser, uuidParam('lessonId'), validate, contentController.accessLesson);
router.post('/:lessonId/complete', authenticate, authorizeAppUser, uuidParam('lessonId'), validate, contentController.completeLesson);

export default router;
