import { body, param, query } from 'express-validator';

export const createQuestionValidator = [
  body('examId')
    .isUUID()
    .withMessage('Invalid exam ID'),
  body('questionText')
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Question text must be between 5 and 2000 characters'),
  body('questionType')
    .isIn(['single_choice', 'multiple_choice', 'true_false', 'short_answer'])
    .withMessage('Question type must be single_choice, multiple_choice, true_false, or short_answer'),
  body('marks')
    .isInt({ min: 1, max: 100 })
    .withMessage('Marks must be between 1 and 100'),
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Explanation must not exceed 1000 characters'),
  body('options')
    .isArray({ min: 2 })
    .withMessage('At least 2 options must be provided')
    .custom((value, { req }) => {
      if (req.body.questionType !== 'short_answer' && value.length < 2) {
        throw new Error('At least 2 options required for choice questions');
      }
      return true;
    }),
  body('options.*.optionText')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Option text must be between 1 and 500 characters'),
  body('options.*.isCorrect')
    .isBoolean()
    .withMessage('isCorrect must be a boolean')
    .custom((value, { req }) => {
      const correctCount = req.body.options.filter(opt => opt.isCorrect).length;
      const questionType = req.body.questionType;
      
      if (questionType === 'single_choice' && correctCount !== 1) {
        throw new Error('Single choice questions must have exactly one correct option');
      }
      if (questionType === 'true_false' && correctCount !== 1) {
        throw new Error('True/False questions must have exactly one correct option');
      }
      if (questionType === 'multiple_choice' && correctCount < 1) {
        throw new Error('Multiple choice questions must have at least one correct option');
      }
      return true;
    }),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer')
];

export const updateQuestionValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid question ID'),
  body('questionText')
    .optional()
    .trim()
    .isLength({ min: 5, max: 2000 })
    .withMessage('Question text must be between 5 and 2000 characters'),
  body('questionType')
    .optional()
    .isIn(['single_choice', 'multiple_choice', 'true_false', 'short_answer'])
    .withMessage('Question type must be single_choice, multiple_choice, true_false, or short_answer'),
  body('marks')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Marks must be between 1 and 100'),
  body('explanation')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Explanation must not exceed 1000 characters'),
  body('options')
    .optional()
    .isArray({ min: 2 })
    .withMessage('At least 2 options must be provided'),
  body('orderIndex')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Order index must be a non-negative integer'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const getQuestionValidator = [
  param('id')
    .isUUID()
    .withMessage('Invalid question ID')
];

export const listQuestionsValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('examId')
    .optional()
    .isUUID()
    .withMessage('Invalid exam ID'),
  query('subjectId')
    .optional()
    .isUUID()
    .withMessage('Invalid subject ID'),
  query('questionType')
    .optional()
    .isIn(['single_choice', 'multiple_choice', 'true_false', 'short_answer'])
    .withMessage('Invalid question type'),
  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
];

export const submitAnswerValidator = [
  param('attemptId')
    .isUUID()
    .withMessage('Invalid attempt ID'),
  body('questionId')
    .isUUID()
    .withMessage('Invalid question ID'),
  body('selectedOptions')
    .optional()
    .isArray()
    .withMessage('Selected options must be an array'),
  body('selectedOptions.*')
    .isUUID()
    .withMessage('Each selected option must be a valid UUID'),
  body('textAnswer')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Text answer must not exceed 1000 characters')
    .custom((value, { req }) => {
      if (req.body.selectedOptions && value) {
        throw new Error('Cannot provide both selected options and text answer');
      }
      return true;
    })
];

export const submitExamValidator = [
  param('attemptId')
    .isUUID()
    .withMessage('Invalid attempt ID')
];
