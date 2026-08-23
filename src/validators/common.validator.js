import { body, param, query } from 'express-validator';

export const paginationValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export const uuidParam = (name) => [
  param(name).isUUID().withMessage(`Invalid ${name}`)
];

export const courseIdParam = [
  param('courseId')
    .matches(/^[a-zA-Z0-9-]{2,80}$/)
    .withMessage('Invalid course id')
];

export const statusValidator = [
  body('status').isIn(['active', 'inactive', 'blocked', 'deleted']).withMessage('Invalid status')
];
