import { Router } from 'express';
import { authenticate, authorizeAppUser, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as mediaController from '../controllers/media.controller.js';

const router = Router();

router.get('/', optionalAuth, mediaController.listCurrentAffairs);
router.get('/monthly', optionalAuth, mediaController.monthlyCurrentAffairs);
router.get('/:articleId', optionalAuth, uuidParam('articleId'), validate, mediaController.getCurrentAffair);
router.post('/:articleId/bookmark', authenticate, authorizeAppUser, uuidParam('articleId'), validate, mediaController.bookmarkCurrentAffair);
router.delete('/:articleId/bookmark', authenticate, authorizeAppUser, uuidParam('articleId'), validate, mediaController.unbookmarkCurrentAffair);

export default router;
