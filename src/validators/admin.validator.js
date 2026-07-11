import { body, param, query } from 'express-validator';

export const createAdminValidator = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .trim(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('roleId')
    .optional()
    .isUUID()
    .withMessage('Invalid role ID'),
  body('isSuperAdmin')
    .optional()
    .isBoolean()
    .withMessage('isSuperAdmin must be a boolean')
];

export const updateAdminValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid admin ID'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('roleId')
    .optional()
    .isUUID()
    .withMessage('Invalid role ID'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const getAdminValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid admin ID')
];

export const listAdminsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('search')
    .optional()
    .trim(),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('roleId')
    .optional()
    .isUUID()
    .withMessage('Invalid role ID')
];
