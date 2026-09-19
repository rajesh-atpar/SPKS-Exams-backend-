import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireActivePlan } from '../middleware/subscription.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';
import * as contentController from '../controllers/content.controller.js';

export const groupRoutes = Router();
groupRoutes.use(authenticate, requireActivePlan);
groupRoutes.get('/:groupId', uuidParam('groupId'), validate, catalogController.getGroup);
groupRoutes.get('/:groupId/subjects', uuidParam('groupId'), validate, catalogController.groupSubjects);
groupRoutes.get('/:groupId/classes', uuidParam('groupId'), validate, catalogController.groupClasses);
groupRoutes.get('/:groupId/content', uuidParam('groupId'), validate, catalogController.groupContent);
groupRoutes.get('/:groupId/books', uuidParam('groupId'), validate, catalogController.groupBooks);
groupRoutes.get('/:groupId/notes', uuidParam('groupId'), validate, catalogController.groupNotes);
groupRoutes.get('/:groupId/outside-sources', uuidParam('groupId'), validate, catalogController.groupOutsideSources);
groupRoutes.get('/:groupId/videos', uuidParam('groupId'), validate, catalogController.groupVideos);
groupRoutes.get('/:groupId/tests', uuidParam('groupId'), validate, catalogController.groupTests);

export const classRoutes = Router();
classRoutes.use(authenticate, requireActivePlan);
classRoutes.get('/:classId/subjects', uuidParam('classId'), validate, catalogController.classSubjects);

export const subjectRoutes = Router();
subjectRoutes.use(authenticate, requireActivePlan);
subjectRoutes.get('/:subjectId', uuidParam('subjectId'), validate, catalogController.getSubject);
subjectRoutes.get('/:subjectId/content', uuidParam('subjectId'), validate, contentController.subjectContent);
subjectRoutes.get('/:subjectId/chapters', uuidParam('subjectId'), validate, contentController.listChapters);

export const chapterRoutes = Router();
chapterRoutes.use(authenticate, requireActivePlan);
chapterRoutes.get('/:chapterId', uuidParam('chapterId'), validate, contentController.getChapter);
chapterRoutes.get('/:chapterId/lessons', uuidParam('chapterId'), validate, contentController.listLessons);
chapterRoutes.get('/:chapterId/content', uuidParam('chapterId'), validate, contentController.chapterContent);
