import { Router } from 'express';
import { optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';
import * as contentController from '../controllers/content.controller.js';

export const groupRoutes = Router();
groupRoutes.get('/:groupId', optionalAuth, uuidParam('groupId'), validate, catalogController.getGroup);
groupRoutes.get('/:groupId/subjects', optionalAuth, uuidParam('groupId'), validate, catalogController.groupSubjects);
groupRoutes.get('/:groupId/classes', optionalAuth, uuidParam('groupId'), validate, catalogController.groupClasses);

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
