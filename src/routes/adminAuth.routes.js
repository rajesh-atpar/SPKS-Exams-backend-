import { Router } from 'express';
import { authenticate, authorizeStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { loginValidator, refreshTokenValidator, changePasswordValidator, forgotPasswordValidator, resetPasswordValidator } from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authRateLimiter, loginValidator, validate, authController.adminLogin);
router.post('/forgot-password', forgotPasswordValidator, validate, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidator, validate, authController.resetPassword);
router.post('/change-password', authenticate, authorizeStaff, changePasswordValidator, validate, authController.changePassword);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/logout', authenticate, authorizeStaff, authController.logout);
router.get('/me', authenticate, authorizeStaff, authController.me);

export default router;
