import { body, param, query } from 'express-validator';

export const createExamValidator = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Exam title must be between 5 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('subjectId')
    .isUUID()
    .withMessage('Invalid subject ID'),
  body('durationMinutes')
    .isInt({ min: 5, max: 600 })
    .withMessage('Duration must be between 5 and 600 minutes'),
  body('totalMarks')
    .isInt({ min: 1 })
    .withMessage('Total marks must be a positive integer'),
  body('passingMarks')
    .isInt({ min: 0 })
    .withMessage('Passing marks must be a non-negative integer')
    .custom((value, { req }) => {
      if (value > req.body.totalMarks) {
        throw new Error('Passing marks cannot exceed total marks');
      }
      return true;
    }),
  body('passingPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100'),
  body('negativeMarking')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Negative marking must be between 0 and 1'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Instructions must not exceed 5000 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('allowResume')
    .optional()
    .isBoolean()
    .withMessage('allowResume must be a boolean'),
  body('shuffleQuestions')
    .optional()
    .isBoolean()
    .withMessage('shuffleQuestions must be a boolean'),
  body('showResultsImmediately')
    .optional()
    .isBoolean()
    .withMessage('showResultsImmediately must be a boolean'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max attempts must be between 1 and 10')
];

export const updateExamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid exam ID'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Exam title must be between 5 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('subjectId')
    .optional()
    .isUUID()
    .withMessage('Invalid subject ID'),
  body('durationMinutes')
    .optional()
    .isInt({ min: 5, max: 600 })
    .withMessage('Duration must be between 5 and 600 minutes'),
  body('totalMarks')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Total marks must be a positive integer'),
  body('passingMarks')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Passing marks must be a non-negative integer'),
  body('passingPercentage')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Passing percentage must be between 0 and 100'),
  body('negativeMarking')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Negative marking must be between 0 and 1'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Instructions must not exceed 5000 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean'),
  body('allowResume')
    .optional()
    .isBoolean()
    .withMessage('allowResume must be a boolean'),
  body('shuffleQuestions')
    .optional()
    .isBoolean()
    .withMessage('shuffleQuestions must be a boolean'),
  body('showResultsImmediately')
    .optional()
    .isBoolean()
    .withMessage('showResultsImmediately must be a boolean'),
  body('maxAttempts')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Max attempts must be between 1 and 10')
];

export const getExamValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid exam ID')
];

export const listExamsValidator = [
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
  query('subjectId')
    .optional()
    .isUUID()
    .withMessage('Invalid subject ID'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean'),
  query('isPublished')
    .optional()
    .isBoolean()
    .withMessage('isPublished must be a boolean')
];

export const assignExamValidator = [
  body('examId')
    .isUUID()
    .withMessage('Invalid exam ID'),
  body('studentIds')
    .isArray({ min: 1 })
    .withMessage('At least one student ID must be provided')
    .custom((value) => {
      if (!value.every(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) {
        throw new Error('All student IDs must be valid UUIDs');
      }
      return true;
    }),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Please provide a valid end date')
];

export const startExamValidator = [
  param('examId')
    .isUUID()
    .withMessage('Invalid exam ID')
];
