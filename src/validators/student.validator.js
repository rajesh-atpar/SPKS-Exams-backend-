import { body, param, query } from 'express-validator';

export const createStudentValidator = [
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
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('rollNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Roll number must be between 1 and 50 characters'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Institution must not exceed 255 characters'),
  body('course')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Course must not exceed 255 characters'),
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Semester must not exceed 50 characters')
];

export const updateStudentValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid student ID'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('rollNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Roll number must be between 1 and 50 characters'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Institution must not exceed 255 characters'),
  body('course')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Course must not exceed 255 characters'),
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Semester must not exceed 50 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const getStudentValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid student ID')
];

export const listStudentsValidator = [
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
  query('institution')
    .optional()
    .trim(),
  query('course')
    .optional()
    .trim(),
  query('semester')
    .optional()
    .trim()
];

export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Please provide a valid phone number'),
  body('dateOfBirth')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid date of birth'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Gender must be male, female, or other'),
  body('address')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Address must not exceed 500 characters'),
  body('institution')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Institution must not exceed 255 characters'),
  body('course')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Course must not exceed 255 characters'),
  body('semester')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Semester must not exceed 50 characters')
];
