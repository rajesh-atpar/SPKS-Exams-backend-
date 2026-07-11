import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { uploadProfileImage, uploadQuestionImage, uploadExamPdf } from '../middleware/upload.js';
import {
  uploadProfileImage as uploadProfile,
  uploadQuestionImage as uploadQuestion,
  uploadExamPdf as uploadPdf
} from '../controllers/file.controller.js';

const router = Router();

// Protected routes
router.use(authenticate);

router.post(
  '/profile',
  uploadProfileImage,
  uploadProfile
);

router.post(
  '/question',
  uploadQuestionImage,
  uploadQuestion
);

router.post(
  '/exam-pdf',
  uploadExamPdf,
  uploadPdf
);

export default router;
