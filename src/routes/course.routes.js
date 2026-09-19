import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/subscription.js';
import { validate } from '../middleware/validation.js';
import { courseIdParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', optionalAuth, catalogController.listCourses);
router.use(authenticate, requireActivePlan);
router.get('/:courseId', courseIdParam, validate, catalogController.getCourse);
router.get('/:courseId/groups', courseIdParam, validate, catalogController.courseGroups);
router.get('/:courseId/categories', courseIdParam, validate, catalogController.courseCategories);
router.get('/:courseId/overview', courseIdParam, validate, catalogController.courseOverview);
router.get('/:courseId/content', courseIdParam, validate, catalogController.courseContent);
router.get('/:courseId/notes', courseIdParam, validate, catalogController.courseNotes);
router.get('/:courseId/books', courseIdParam, validate, catalogController.courseBooks);
router.get('/:courseId/outside-sources', courseIdParam, validate, catalogController.courseOutsideSources);
router.get('/:courseId/videos', courseIdParam, validate, catalogController.courseVideos);
router.get('/:courseId/tests', courseIdParam, validate, catalogController.courseTests);

export default router;
