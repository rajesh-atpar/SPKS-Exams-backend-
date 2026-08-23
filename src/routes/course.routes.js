import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { courseIdParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';

const router = Router();

router.get('/', optionalAuth, catalogController.listCourses);
router.get('/:courseId', optionalAuth, courseIdParam, validate, catalogController.getCourse);
router.get('/:courseId/groups', optionalAuth, courseIdParam, validate, catalogController.courseGroups);
router.get('/:courseId/categories', optionalAuth, courseIdParam, validate, catalogController.courseCategories);
router.get('/:courseId/overview', optionalAuth, courseIdParam, validate, catalogController.courseOverview);
router.get('/:courseId/content', optionalAuth, courseIdParam, validate, catalogController.courseContent);
router.get('/:courseId/notes', optionalAuth, courseIdParam, validate, catalogController.courseNotes);
router.get('/:courseId/books', optionalAuth, courseIdParam, validate, catalogController.courseBooks);
router.get('/:courseId/outside-sources', optionalAuth, courseIdParam, validate, catalogController.courseOutsideSources);
router.get('/:courseId/videos', optionalAuth, courseIdParam, validate, catalogController.courseVideos);
router.get('/:courseId/tests', authenticate, courseIdParam, validate, catalogController.courseTests);

export default router;
