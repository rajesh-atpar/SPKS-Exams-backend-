import { Router } from 'express';
import { authenticate, authorizeAppUser, optionalAuth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/subscription.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as contentController from '../controllers/content.controller.js';

const router = Router();

router.get('/', optionalAuth, contentController.listContent);
router.get('/:contentId', authenticate, requireActivePlan, uuidParam('contentId'), validate, contentController.getContent);
router.get('/:contentId/view', authenticate, requireActivePlan, uuidParam('contentId'), validate, contentController.viewContent);
router.get('/:contentId/download', authenticate, requireActivePlan, uuidParam('contentId'), validate, contentController.downloadContent);
router.post('/:contentId/bookmark', authenticate, authorizeAppUser, uuidParam('contentId'), validate, contentController.bookmarkContent);
router.delete('/:contentId/bookmark', authenticate, authorizeAppUser, uuidParam('contentId'), validate, contentController.unbookmarkContent);

export default router;
