import { Router } from 'express';
import { authenticate, authorizeStaff } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import { loginValidator, refreshTokenValidator } from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authRateLimiter, loginValidator, validate, authController.adminLogin);
router.post('/refresh-token', refreshTokenValidator, validate, authController.refreshToken);
router.post('/logout', authenticate, authorizeStaff, authController.logout);
router.get('/me', authenticate, authorizeStaff, authController.me);

export default router;
