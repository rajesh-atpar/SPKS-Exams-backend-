import { Router } from 'express';
import { authenticate, authorizeAppUser, optionalAuth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/subscription.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as mediaController from '../controllers/media.controller.js';

const router = Router();

router.get('/', optionalAuth, mediaController.listVideos);
router.get('/:videoId', authenticate, requireActivePlan, uuidParam('videoId'), validate, mediaController.getVideo);
router.post('/:videoId/view', authenticate, requireActivePlan, uuidParam('videoId'), validate, mediaController.viewVideo);
router.post('/:videoId/bookmark', authenticate, authorizeAppUser, uuidParam('videoId'), validate, mediaController.bookmarkVideo);
router.delete('/:videoId/bookmark', authenticate, authorizeAppUser, uuidParam('videoId'), validate, mediaController.unbookmarkVideo);

export default router;
