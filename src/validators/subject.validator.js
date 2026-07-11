import { body, param, query } from 'express-validator';

export const createSubjectValidator = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Subject name must be between 2 and 255 characters'),
  body('code')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const updateSubjectValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject ID'),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Subject name must be between 2 and 255 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Subject code must be between 2 and 50 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Subject code must contain only uppercase letters and numbers'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  body('category')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Category must not exceed 100 characters'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const getSubjectValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid subject ID')
];

export const listSubjectsValidator = [
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
  query('category')
    .optional()
    .trim()
];
