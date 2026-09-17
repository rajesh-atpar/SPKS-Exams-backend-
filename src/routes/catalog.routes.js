import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';
import * as contentController from '../controllers/content.controller.js';

export const groupRoutes = Router();
groupRoutes.get('/:groupId', optionalAuth, uuidParam('groupId'), validate, catalogController.getGroup);
groupRoutes.get('/:groupId/subjects', optionalAuth, uuidParam('groupId'), validate, catalogController.groupSubjects);
groupRoutes.get('/:groupId/classes', optionalAuth, uuidParam('groupId'), validate, catalogController.groupClasses);
groupRoutes.get('/:groupId/content', optionalAuth, uuidParam('groupId'), validate, catalogController.groupContent);
groupRoutes.get('/:groupId/books', optionalAuth, uuidParam('groupId'), validate, catalogController.groupBooks);
groupRoutes.get('/:groupId/notes', optionalAuth, uuidParam('groupId'), validate, catalogController.groupNotes);
groupRoutes.get('/:groupId/outside-sources', optionalAuth, uuidParam('groupId'), validate, catalogController.groupOutsideSources);
groupRoutes.get('/:groupId/videos', optionalAuth, uuidParam('groupId'), validate, catalogController.groupVideos);
groupRoutes.get('/:groupId/tests', authenticate, uuidParam('groupId'), validate, catalogController.groupTests);

export const classRoutes = Router();
classRoutes.get('/:classId/subjects', optionalAuth, uuidParam('classId'), validate, catalogController.classSubjects);

export const subjectRoutes = Router();
subjectRoutes.get('/:subjectId', optionalAuth, uuidParam('subjectId'), validate, catalogController.getSubject);
subjectRoutes.get('/:subjectId/content', optionalAuth, uuidParam('subjectId'), validate, contentController.subjectContent);
subjectRoutes.get('/:subjectId/chapters', optionalAuth, uuidParam('subjectId'), validate, contentController.listChapters);

export const chapterRoutes = Router();
chapterRoutes.get('/:chapterId', optionalAuth, uuidParam('chapterId'), validate, contentController.getChapter);
chapterRoutes.get('/:chapterId/lessons', optionalAuth, uuidParam('chapterId'), validate, contentController.listLessons);
chapterRoutes.get('/:chapterId/content', optionalAuth, uuidParam('chapterId'), validate, contentController.chapterContent);
