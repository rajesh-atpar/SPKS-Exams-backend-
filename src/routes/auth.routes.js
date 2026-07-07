import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authRateLimiter } from '../middleware/rateLimit.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
  changePasswordValidator,
  refreshTokenValidator
} from '../validators/auth.validator.js';
import authService from '../services/auth.service.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { HTTP_STATUS } from '../config/constants.js';

const router = Router();

// Public routes
router.post(
  '/register',
  authRateLimiter,
  registerValidator,
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.registerAdmin(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  })
);

router.post(
  '/login',
  authRateLimiter,
  loginValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginAdmin(email, password);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  })
);

router.post(
  '/student/register',
  authRateLimiter,
  registerValidator,
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.registerStudent(req.body);
    res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Registration successful',
      data: result
    });
  })
);

router.post(
  '/student/login',
  authRateLimiter,
  loginValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginStudent(email, password);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Login successful',
      data: result
    });
  })
);

router.post(
  '/forgot-password',
  forgotPasswordValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { email, userType } = req.body;
    const result = await authService.forgotPassword(email, userType);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: null
    });
  })
);

router.post(
  '/reset-password',
  resetPasswordValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    const result = await authService.resetPassword(token, password);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: null
    });
  })
);

// Protected routes
router.use(authenticate);

router.post(
  '/change-password',
  changePasswordValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.changePassword(req.user.id, req.user.userType, currentPassword, newPassword);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: result.message,
      data: null
    });
  })
);

router.post(
  '/refresh',
  refreshTokenValidator,
  validate,
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const decoded = await authService.verifyToken(refreshToken);
    const newToken = authService.generateToken(decoded.userId, decoded.userType, decoded.roleId);
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Token refreshed successfully',
      data: { token: newToken }
    });
  })
);

router.post(
  '/logout',
  asyncHandler(async (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Logout successful',
      data: null
    });
  })
);

export default router;
