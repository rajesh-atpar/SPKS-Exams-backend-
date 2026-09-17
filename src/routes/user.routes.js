import { Router } from 'express';
import { authenticate, authorizeAppUser } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uploadProfileImage } from '../middleware/upload.js';
import { deviceTokenValidator } from '../validators/auth.validator.js';
import * as userController from '../controllers/user.controller.js';

const router = Router();

router.use(authenticate, authorizeAppUser);

router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.post('/me/profile-image', uploadProfileImage, userController.uploadProfileImage);
router.delete('/me/profile-image', userController.deleteProfileImage);
router.get('/me/settings', userController.getSettings);
router.patch('/me/settings', userController.updateSettings);
router.delete('/me/account', userController.deleteAccount);
router.get('/me/bookmarks', userController.myBookmarks);
router.get('/me/progress', userController.myProgress);
router.get('/me/continue-learning', userController.myContinueLearning);
router.get('/me/course-progress', userController.myCourseProgress);
router.get('/me/activity', userController.myActivity);
router.get('/me/streak', userController.myStreak);
router.get('/me/analytics', userController.myAnalytics);
router.get('/me/stats', userController.myStats);
router.get('/me/attempts', userController.myAttempts);
router.get('/me/test-history', userController.myTestHistory);
router.post('/me/device-token', deviceTokenValidator, validate, userController.saveDeviceToken);
router.delete('/me/device-token', deviceTokenValidator, validate, userController.removeDeviceToken);

export default router;
