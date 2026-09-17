import { body } from 'express-validator';

const passwordRule = body('password')
  .isLength({ min: 6 })
  .withMessage('Password must be at least 6 characters long')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number');

export const registerValidator = [
  body('firstName').trim().isLength({ min: 1, max: 100 }).withMessage('First name is required'),
  body('lastName').trim().isLength({ min: 1, max: 100 }).withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail().trim(),
  body('phone').optional().trim().isLength({ min: 8, max: 20 }).withMessage('Invalid phone number'),
  body('state').optional().trim().isLength({ max: 100 }),
  body('role').optional().isIn(['user', 'admin', 'editor', 'support']).withMessage('Invalid role'),
  passwordRule
];

export const loginValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail().trim(),
  body('password').notEmpty().withMessage('Password is required')
];

export const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail().trim()
];

export const resetPasswordValidator = [
  body('token').notEmpty().withMessage('Reset token is required'),
  passwordRule
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number')
];

export const refreshTokenValidator = [
  body('refreshToken').notEmpty().withMessage('Refresh token is required')
];

export const deviceTokenValidator = [
  body('token').notEmpty().withMessage('Device token is required'),
  body('platform').optional().isIn(['android', 'ios', 'web'])
];
