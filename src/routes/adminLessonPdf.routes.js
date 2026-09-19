import { Router } from 'express';
import { authenticate, authorizeStaff } from '../middleware/auth.js';
import { uploadLessonPdf } from '../middleware/upload.js';
import * as contentController from '../controllers/content.controller.js';

const router = Router();
const replacePdf = [
  authenticate,
  authorizeStaff,
  uploadLessonPdf,
  contentController.adminReplaceLessonPdf
];

router.post('/api/admin/lessons/:lessonId/pdf', ...replacePdf);
router.post('/api/admin/lessons/:lessonId/pdf/', ...replacePdf);
router.put('/api/admin/lessons/:lessonId/pdf', ...replacePdf);
router.patch('/api/admin/lessons/:lessonId/pdf', ...replacePdf);
router.post('/api/admin/lessons/:lessonId/upload', ...replacePdf);

export default router;
