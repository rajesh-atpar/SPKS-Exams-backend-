import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizeStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadContentFile } from '../middleware/upload.js';
import { uuidParam } from '../validators/common.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';
import * as contentController from '../controllers/content.controller.js';
import * as mediaController from '../controllers/media.controller.js';
import * as testController from '../controllers/test.controller.js';
import * as platformController from '../controllers/platform.controller.js';

const router = Router();

router.use(authenticate, authorizeStaff);

router.post('/courses', catalogController.adminCreateCourse);
router.get('/courses', catalogController.adminListCourses);
router.get('/courses/:courseId', uuidParam('courseId'), validate, catalogController.adminGetCourse);
router.patch('/courses/:courseId', uuidParam('courseId'), validate, catalogController.adminUpdateCourse);
router.delete('/courses/:courseId', uuidParam('courseId'), validate, catalogController.adminDeleteCourse);

router.post('/groups', catalogController.adminCreateGroup);
router.get('/groups', catalogController.adminListGroups);
router.patch('/groups/:groupId', uuidParam('groupId'), validate, catalogController.adminUpdateGroup);
router.delete('/groups/:groupId', uuidParam('groupId'), validate, catalogController.adminDeleteGroup);

router.post('/classes', catalogController.adminCreateClass);
router.patch('/classes/:classId', uuidParam('classId'), validate, catalogController.adminUpdateClass);
router.delete('/classes/:classId', uuidParam('classId'), validate, catalogController.adminDeleteClass);

router.post('/subjects', catalogController.adminCreateSubject);
router.patch('/subjects/:subjectId', uuidParam('subjectId'), validate, catalogController.adminUpdateSubject);
router.delete('/subjects/:subjectId', uuidParam('subjectId'), validate, catalogController.adminDeleteSubject);

router.post('/content', contentController.adminCreateContent);
router.get('/content', contentController.adminListContent);
router.post('/content/upload', uploadContentFile, contentController.adminUploadContent);
router.get('/content/:contentId', uuidParam('contentId'), validate, contentController.adminGetContent);
router.patch('/content/:contentId', uuidParam('contentId'), validate, contentController.adminUpdateContent);
router.delete('/content/:contentId', uuidParam('contentId'), validate, contentController.adminDeleteContent);

router.post('/chapters', contentController.adminCreateChapter);
router.patch('/chapters/:chapterId', uuidParam('chapterId'), validate, contentController.adminUpdateChapter);
router.delete('/chapters/:chapterId', uuidParam('chapterId'), validate, contentController.adminDeleteChapter);

router.post('/lessons', contentController.adminCreateLesson);
router.patch('/lessons/:lessonId', uuidParam('lessonId'), validate, contentController.adminUpdateLesson);
router.delete('/lessons/:lessonId', uuidParam('lessonId'), validate, contentController.adminDeleteLesson);

router.post('/videos', mediaController.adminCreateVideo);
router.get('/videos', mediaController.adminListVideos);
router.get('/videos/:videoId', uuidParam('videoId'), validate, mediaController.adminGetVideo);
router.patch('/videos/:videoId', uuidParam('videoId'), validate, mediaController.adminUpdateVideo);
router.delete('/videos/:videoId', uuidParam('videoId'), validate, mediaController.adminDeleteVideo);

router.post('/current-affairs', mediaController.adminCreateCurrentAffair);
router.get('/current-affairs', mediaController.adminListCurrentAffairs);
router.post('/current-affairs/upload', uploadContentFile, mediaController.adminUploadCurrentAffair);
router.get('/current-affairs/:articleId', uuidParam('articleId'), validate, mediaController.adminGetCurrentAffair);
router.patch('/current-affairs/:articleId', uuidParam('articleId'), validate, mediaController.adminUpdateCurrentAffair);
router.delete('/current-affairs/:articleId', uuidParam('articleId'), validate, mediaController.adminDeleteCurrentAffair);

router.post('/tests', testController.adminCreateTest);
router.get('/tests', testController.adminListTests);
router.get('/tests/:testId', uuidParam('testId'), validate, testController.adminGetTest);
router.patch('/tests/:testId', uuidParam('testId'), validate, testController.adminUpdateTest);
router.delete('/tests/:testId', uuidParam('testId'), validate, testController.adminDeleteTest);
router.post('/tests/:testId/questions', uuidParam('testId'), validate, testController.adminAddQuestion);
router.patch('/questions/:questionId', uuidParam('questionId'), validate, testController.adminUpdateQuestion);
router.delete('/questions/:questionId', uuidParam('questionId'), validate, testController.adminDeleteQuestion);

router.get('/analytics/overview', platformController.analyticsOverview);
router.get('/analytics/users', platformController.analyticsUsers);
router.get('/analytics/courses', platformController.analyticsCourses);
router.get('/analytics/tests', platformController.analyticsTests);
router.get('/analytics/revenue', platformController.analyticsRevenue);

router.post('/plans', authorizeAdmin, platformController.adminCreatePlan);
router.get('/plans', platformController.adminListPlans);
router.patch('/plans/:planId', authorizeAdmin, uuidParam('planId'), validate, platformController.adminUpdatePlan);
router.delete('/plans/:planId', authorizeAdmin, uuidParam('planId'), validate, platformController.adminDeletePlan);
router.get('/subscriptions', platformController.adminSubscriptions);
router.get('/payments', platformController.adminPayments);

router.get('/support/tickets', platformController.adminTickets);
router.get('/support/tickets/:ticketId', uuidParam('ticketId'), validate, platformController.adminGetTicket);
router.patch('/support/tickets/:ticketId/status', uuidParam('ticketId'), validate, platformController.adminUpdateTicketStatus);
router.post('/support/tickets/:ticketId/reply', uuidParam('ticketId'), validate, platformController.adminReplyTicket);

router.patch('/legal/terms', authorizeAdmin, platformController.adminUpdateTerms);
router.patch('/legal/privacy-policy', authorizeAdmin, platformController.adminUpdatePrivacy);
router.patch('/legal/refund-policy', authorizeAdmin, platformController.adminUpdateRefund);

router.post('/notifications', platformController.adminCreateNotification);
router.get('/notifications', platformController.adminListNotifications);
router.post('/notifications/send', platformController.adminSendNotification);

export default router;
