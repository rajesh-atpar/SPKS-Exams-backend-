import { Router } from 'express';
import { authenticate, authorizeAdmin, authorizeStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadContentFile, uploadLessonPdf, uploadQuestionImage } from '../middleware/upload.js';
import { uuidParam } from '../validators/common.validator.js';
import {
  chapterBodyValidator,
  chapterUpdateValidator,
  classBodyValidator,
  classUpdateValidator,
  contactBodyValidator,
  contentBodyValidator,
  contentUpdateValidator,
  courseBodyValidator,
  courseUpdateValidator,
  currentAffairBodyValidator,
  currentAffairUpdateValidator,
  faqBodyValidator,
  faqUpdateValidator,
  groupBodyValidator,
  groupUpdateValidator,
  legalBodyValidator,
  lessonBodyValidator,
  lessonUpdateValidator,
  notificationBodyValidator,
  planBodyValidator,
  planUpdateValidator,
  questionBodyValidator,
  questionUpdateValidator,
  subjectBodyValidator,
  subjectUpdateValidator,
  testBodyValidator,
  testUpdateValidator,
  ticketReplyValidator,
  ticketStatusBodyValidator,
  videoBodyValidator,
  videoUpdateValidator
} from '../validators/admin.validator.js';
import * as catalogController from '../controllers/catalog.controller.js';
import * as contentController from '../controllers/content.controller.js';
import * as mediaController from '../controllers/media.controller.js';
import * as testController from '../controllers/test.controller.js';
import * as platformController from '../controllers/platform.controller.js';

const router = Router();

router.use(authenticate, authorizeStaff);

router.post('/courses', courseBodyValidator, validate, catalogController.adminCreateCourse);
router.get('/courses', catalogController.adminListCourses);
router.get('/courses/:courseId', uuidParam('courseId'), validate, catalogController.adminGetCourse);
router.patch('/courses/:courseId', uuidParam('courseId'), courseUpdateValidator, validate, catalogController.adminUpdateCourse);
router.delete('/courses/:courseId', uuidParam('courseId'), validate, catalogController.adminDeleteCourse);

router.post('/groups', groupBodyValidator, validate, catalogController.adminCreateGroup);
router.get('/groups', catalogController.adminListGroups);
router.get('/groups/:groupId', uuidParam('groupId'), validate, catalogController.adminGetGroup);
router.patch('/groups/:groupId', uuidParam('groupId'), groupUpdateValidator, validate, catalogController.adminUpdateGroup);
router.delete('/groups/:groupId', uuidParam('groupId'), validate, catalogController.adminDeleteGroup);

router.post('/classes', classBodyValidator, validate, catalogController.adminCreateClass);
router.get('/classes', catalogController.adminListClasses);
router.get('/classes/:classId', uuidParam('classId'), validate, catalogController.adminGetClass);
router.patch('/classes/:classId', uuidParam('classId'), classUpdateValidator, validate, catalogController.adminUpdateClass);
router.delete('/classes/:classId', uuidParam('classId'), validate, catalogController.adminDeleteClass);

router.post('/subjects', subjectBodyValidator, validate, catalogController.adminCreateSubject);
router.get('/subjects', catalogController.adminListSubjects);
router.get('/subjects/:subjectId', uuidParam('subjectId'), validate, catalogController.adminGetSubject);
router.patch('/subjects/:subjectId', uuidParam('subjectId'), subjectUpdateValidator, validate, catalogController.adminUpdateSubject);
router.delete('/subjects/:subjectId', uuidParam('subjectId'), validate, catalogController.adminDeleteSubject);

router.post('/content', contentBodyValidator, validate, contentController.adminCreateContent);
router.get('/content', contentController.adminListContent);
router.post('/content/upload', uploadContentFile, contentController.adminUploadContent);
router.get('/content/:contentId', uuidParam('contentId'), validate, contentController.adminGetContent);
router.patch('/content/:contentId', uuidParam('contentId'), contentUpdateValidator, validate, contentController.adminUpdateContent);
router.delete('/content/:contentId', uuidParam('contentId'), validate, contentController.adminDeleteContent);

router.post('/chapters', chapterBodyValidator, validate, contentController.adminCreateChapter);
router.get('/chapters', contentController.adminListChapters);
router.get('/chapters/:chapterId', uuidParam('chapterId'), validate, contentController.adminGetChapter);
router.patch('/chapters/:chapterId', uuidParam('chapterId'), chapterUpdateValidator, validate, contentController.adminUpdateChapter);
router.delete('/chapters/:chapterId', uuidParam('chapterId'), validate, contentController.adminDeleteChapter);

router.post('/lessons/upload', uploadLessonPdf, contentController.adminUploadLessonPdf);
router.post('/lessons/:lessonId/pdf', uploadLessonPdf, contentController.adminReplaceLessonPdf);
router.put('/lessons/:lessonId/pdf', uploadLessonPdf, contentController.adminReplaceLessonPdf);
router.patch('/lessons/:lessonId/pdf', uploadLessonPdf, contentController.adminReplaceLessonPdf);
router.post('/lessons/:lessonId/upload', uploadLessonPdf, contentController.adminReplaceLessonPdf);
router.post('/lessons', lessonBodyValidator, validate, contentController.adminCreateLesson);
router.get('/lessons', contentController.adminListLessons);
router.get('/lessons/:lessonId', uuidParam('lessonId'), validate, contentController.adminGetLesson);
router.patch('/lessons/:lessonId', uuidParam('lessonId'), lessonUpdateValidator, validate, contentController.adminUpdateLesson);
router.delete('/lessons/:lessonId', uuidParam('lessonId'), validate, contentController.adminDeleteLesson);

router.post('/videos', videoBodyValidator, validate, mediaController.adminCreateVideo);
router.get('/videos', mediaController.adminListVideos);
router.get('/videos/:videoId', uuidParam('videoId'), validate, mediaController.adminGetVideo);
router.patch('/videos/:videoId', uuidParam('videoId'), videoUpdateValidator, validate, mediaController.adminUpdateVideo);
router.delete('/videos/:videoId', uuidParam('videoId'), validate, mediaController.adminDeleteVideo);

router.post('/current-affairs', currentAffairBodyValidator, validate, mediaController.adminCreateCurrentAffair);
router.get('/current-affairs', mediaController.adminListCurrentAffairs);
router.post('/current-affairs/upload', uploadContentFile, mediaController.adminUploadCurrentAffair);
router.get('/current-affairs/:articleId', uuidParam('articleId'), validate, mediaController.adminGetCurrentAffair);
router.patch('/current-affairs/:articleId', uuidParam('articleId'), currentAffairUpdateValidator, validate, mediaController.adminUpdateCurrentAffair);
router.delete('/current-affairs/:articleId', uuidParam('articleId'), validate, mediaController.adminDeleteCurrentAffair);

router.post('/tests', testBodyValidator, validate, testController.adminCreateTest);
router.get('/tests', testController.adminListTests);
router.get('/results', testController.adminListResults);
router.get('/tests/:testId/results', uuidParam('testId'), validate, testController.adminTestResults);
router.get('/tests/:testId', uuidParam('testId'), validate, testController.adminGetTest);
router.patch('/tests/:testId', uuidParam('testId'), testUpdateValidator, validate, testController.adminUpdateTest);
router.delete('/tests/:testId', uuidParam('testId'), validate, testController.adminDeleteTest);
router.post('/tests/:testId/questions', uuidParam('testId'), questionBodyValidator, validate, testController.adminAddQuestion);
router.get('/attempts/:attemptId/result', uuidParam('attemptId'), validate, testController.adminGetResult);
router.post('/questions/upload', uploadQuestionImage, testController.adminUploadQuestionImage);
router.patch('/questions/:questionId', uuidParam('questionId'), questionUpdateValidator, validate, testController.adminUpdateQuestion);
router.delete('/questions/:questionId', uuidParam('questionId'), validate, testController.adminDeleteQuestion);

router.get('/analytics/overview', platformController.analyticsOverview);
router.get('/analytics/users', platformController.analyticsUsers);
router.get('/analytics/courses', platformController.analyticsCourses);
router.get('/analytics/tests', platformController.analyticsTests);
router.get('/analytics/revenue', platformController.analyticsRevenue);

router.post('/plans', authorizeAdmin, planBodyValidator, validate, platformController.adminCreatePlan);
router.get('/plans', platformController.adminListPlans);
router.patch('/plans/:planId', authorizeAdmin, uuidParam('planId'), planUpdateValidator, validate, platformController.adminUpdatePlan);
router.delete('/plans/:planId', authorizeAdmin, uuidParam('planId'), validate, platformController.adminDeletePlan);
router.get('/subscriptions', platformController.adminSubscriptions);
router.get('/payments', platformController.adminPayments);

router.get('/faqs', platformController.adminListFaqs);
router.post('/faqs', faqBodyValidator, validate, platformController.adminCreateFaq);
router.get('/faqs/:faqId', uuidParam('faqId'), validate, platformController.adminGetFaq);
router.patch('/faqs/:faqId', uuidParam('faqId'), faqUpdateValidator, validate, platformController.adminUpdateFaq);
router.delete('/faqs/:faqId', uuidParam('faqId'), validate, platformController.adminDeleteFaq);

router.get('/help/contact', platformController.adminGetContact);
router.patch('/help/contact', authorizeAdmin, contactBodyValidator, validate, platformController.adminUpdateContact);

router.get('/support/tickets', platformController.adminTickets);
router.get('/support/tickets/:ticketId', uuidParam('ticketId'), validate, platformController.adminGetTicket);
router.patch('/support/tickets/:ticketId/status', uuidParam('ticketId'), ticketStatusBodyValidator, validate, platformController.adminUpdateTicketStatus);
router.post('/support/tickets/:ticketId/reply', uuidParam('ticketId'), ticketReplyValidator, validate, platformController.adminReplyTicket);

router.get('/legal/terms', platformController.getTerms);
router.patch('/legal/terms', authorizeAdmin, legalBodyValidator, validate, platformController.adminUpdateTerms);
router.get('/legal/privacy-policy', platformController.getPrivacy);
router.patch('/legal/privacy-policy', authorizeAdmin, legalBodyValidator, validate, platformController.adminUpdatePrivacy);
router.get('/legal/refund-policy', platformController.getRefund);
router.patch('/legal/refund-policy', authorizeAdmin, legalBodyValidator, validate, platformController.adminUpdateRefund);

router.post('/notifications', notificationBodyValidator, validate, platformController.adminCreateNotification);
router.get('/notifications', platformController.adminListNotifications);
router.post('/notifications/send', notificationBodyValidator, validate, platformController.adminSendNotification);

export default router;
