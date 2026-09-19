import { body } from 'express-validator';
import { CONTENT_TYPES, CURRENT_AFFAIR_CATEGORIES, TICKET_STATUS, USER_ROLES, USER_STATUS } from '../config/constants.js';

const optionalUuid = (field) => body(field).optional({ values: 'falsy' }).isUUID().withMessage(`Invalid ${field}`);
const optionalBoolean = (field) => body(field).optional().isBoolean().withMessage(`${field} must be a boolean`).toBoolean();
const optionalInt = (field) => body(field).optional().isInt({ min: 0 }).withMessage(`${field} must be a non-negative integer`).toInt();

export const courseBodyValidator = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  body('icon').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const courseUpdateValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  body('icon').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const groupBodyValidator = [
  body('courseId').isUUID().withMessage('courseId is required'),
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const groupUpdateValidator = [
  optionalUuid('courseId'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const classBodyValidator = [
  body('groupId').isUUID().withMessage('groupId is required'),
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const classUpdateValidator = [
  optionalUuid('groupId'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const subjectBodyValidator = [
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('classId'),
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const subjectUpdateValidator = [
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('classId'),
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('slug').optional({ values: 'falsy' }).trim().isLength({ max: 255 }),
  body('description').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  optionalBoolean('isActive'),
  optionalInt('displayOrder')
];

export const chapterBodyValidator = [
  body('subjectId').isUUID().withMessage('subjectId is required'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').optional().isString(),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

export const chapterUpdateValidator = [
  optionalUuid('subjectId'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

const optionalPdfField = (field) => body(field).optional({ values: 'undefined' }).custom((value) => {
  if (value === null || value === '') return true;
  if (typeof value === 'string') return true;
  throw new Error(`${field} must be a string or null`);
});

export const lessonBodyValidator = [
  body('chapterId').isUUID().withMessage('chapterId is required'),
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').optional().isString(),
  body('content').optional().isString(),
  body('pdfUrl').optional({ values: 'falsy' }).isString(),
  body('pdfPath').optional({ values: 'falsy' }).isString(),
  optionalInt('duration'),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

export const lessonUpdateValidator = [
  optionalUuid('chapterId'),
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('content').optional().isString(),
  optionalPdfField('pdfUrl'),
  optionalPdfField('pdfPath'),
  optionalInt('duration'),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

export const contentBodyValidator = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('contentType').isIn(Object.values(CONTENT_TYPES)).withMessage('Invalid content type'),
  body('description').optional().isString(),
  body('fileUrl').optional({ values: 'falsy' }).isString(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('classId'),
  optionalUuid('subjectId'),
  optionalUuid('chapterId'),
  body('language').optional().isString(),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

export const contentUpdateValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('contentType').optional().isIn(Object.values(CONTENT_TYPES)).withMessage('Invalid content type'),
  body('description').optional().isString(),
  body('fileUrl').optional({ values: 'falsy' }).isString(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('classId'),
  optionalUuid('subjectId'),
  optionalUuid('chapterId'),
  body('language').optional().isString(),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

export const videoBodyValidator = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').optional().isString(),
  body('youtubeId').optional({ values: 'falsy' }).isString(),
  body('videoUrl').optional({ values: 'falsy' }).isString(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString(),
  body('category').optional().isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalInt('duration'),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

export const videoUpdateValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  body('youtubeId').optional({ values: 'falsy' }).isString(),
  body('videoUrl').optional({ values: 'falsy' }).isString(),
  body('thumbnailUrl').optional({ values: 'falsy' }).isString(),
  body('category').optional().isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalInt('duration'),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

export const currentAffairBodyValidator = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('category').isIn(Object.values(CURRENT_AFFAIR_CATEGORIES)).withMessage('Invalid category'),
  body('date').isISO8601().withMessage('date must be YYYY-MM-DD'),
  body('summary').optional().isString(),
  body('description').optional().isString(),
  body('state').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  body('sourceName').optional().isString(),
  body('sourceUrl').optional({ values: 'falsy' }).isString(),
  body('language').optional().isString(),
  optionalBoolean('isPublished')
];

export const currentAffairUpdateValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('category').optional().isIn(Object.values(CURRENT_AFFAIR_CATEGORIES)).withMessage('Invalid category'),
  body('date').optional().isISO8601().withMessage('date must be YYYY-MM-DD'),
  body('summary').optional().isString(),
  body('description').optional().isString(),
  body('state').optional().isString(),
  body('imageUrl').optional({ values: 'falsy' }).isString(),
  body('sourceName').optional().isString(),
  body('sourceUrl').optional({ values: 'falsy' }).isString(),
  body('language').optional().isString(),
  optionalBoolean('isPublished')
];

export const testBodyValidator = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('description').optional().isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('subjectId'),
  optionalInt('duration'),
  optionalInt('passingMarks'),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

export const testUpdateValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('description').optional().isString(),
  optionalUuid('courseId'),
  optionalUuid('groupId'),
  optionalUuid('subjectId'),
  optionalInt('duration'),
  optionalInt('passingMarks'),
  optionalBoolean('isPremium'),
  optionalBoolean('isPublished')
];

const optionText = (item) => {
  if (item == null) return '';
  if (typeof item === 'string' || typeof item === 'number') return String(item).trim();
  if (typeof item === 'object') return String(item.text || item.label || item.option || item.value || item.title || '').trim();
  return String(item).trim();
};

const optionsValidator = (required) => {
  const field = required
    ? body('options').isArray({ min: 2 }).withMessage('At least two options are required')
    : body('options').optional({ values: 'undefined' }).isArray({ min: 2 }).withMessage('At least two options are required');
  return field.custom((options) => {
    if (options === undefined) return true;
    if (!Array.isArray(options) || options.length < 2) {
      throw new Error('At least two options are required');
    }
    const texts = options.map(optionText).filter(Boolean);
    if (texts.length < 2) throw new Error('Each option needs text');
    return true;
  });
};

export const questionBodyValidator = [
  body('question').trim().isLength({ min: 1 }).withMessage('Question is required'),
  optionsValidator(true),
  body('correctAnswer').trim().isLength({ min: 1 }).withMessage('correctAnswer is required'),
  body('questionImage').optional({ values: 'falsy' }).isString(),
  body('explanation').optional().isString(),
  optionalInt('marks'),
  body('negativeMarks').optional().isFloat({ min: 0 }).withMessage('negativeMarks must be >= 0').toFloat(),
  optionalInt('questionNumber')
];

export const questionUpdateValidator = [
  body('question').optional().trim().isLength({ min: 1 }),
  optionsValidator(false),
  body('correctAnswer').optional().trim().isLength({ min: 1 }),
  body('questionImage').optional({ values: 'falsy' }).isString(),
  body('explanation').optional().isString(),
  optionalInt('marks'),
  body('negativeMarks').optional().isFloat({ min: 0 }).toFloat(),
  optionalInt('questionNumber')
];

const optionalPlanDate = (field) =>
  body(field)
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage(`${field} must be an ISO date`);

const planDateFields = [
  optionalPlanDate('startDate'),
  optionalPlanDate('endDate'),
  optionalPlanDate('startsAt'),
  optionalPlanDate('endsAt'),
  body().custom((value) => {
    const start = value.startDate || value.startsAt;
    const end = value.endDate || value.endsAt;
    if (start && end && new Date(end) <= new Date(start)) {
      throw new Error('endDate must be after startDate');
    }
    return true;
  })
];

const hasPlanAmount = (value) => value !== undefined && value !== null && value !== '';

export const aliasPlanAmount = (req, _res, next) => {
  if (!req.body || typeof req.body !== 'object') return next();
  if (!hasPlanAmount(req.body.price) && hasPlanAmount(req.body.amount)) {
    req.body.price = req.body.amount;
  }
  if (req.body.startDate == null && req.body.startsAt != null) req.body.startDate = req.body.startsAt;
  if (req.body.endDate == null && req.body.endsAt != null) req.body.endDate = req.body.endsAt;
  next();
};

export const planBodyValidator = [
  body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Name is required'),
  body('amount').optional({ values: 'falsy' }).isFloat({ min: 0 }).withMessage('Amount must be 0 or more').toFloat(),
  body('price')
    .customSanitizer((value, { req }) => (hasPlanAmount(value) ? value : req.body?.amount))
    .exists({ values: 'falsy' })
    .withMessage('Amount is required')
    .isFloat({ min: 0 })
    .withMessage('Amount must be 0 or more')
    .toFloat(),
  body('currency').optional().isString(),
  optionalInt('duration'),
  body('features').optional().isArray(),
  body('courseAccess').optional().isArray(),
  optionalBoolean('isActive'),
  ...planDateFields
];

export const planUpdateValidator = [
  body('name').optional().trim().isLength({ min: 1, max: 255 }),
  body('amount').optional({ values: 'falsy' }).isFloat({ min: 0 }).toFloat(),
  body('price')
    .optional({ values: 'falsy' })
    .customSanitizer((value, { req }) => (hasPlanAmount(value) ? value : req.body?.amount))
    .isFloat({ min: 0 })
    .withMessage('Amount must be 0 or more')
    .toFloat(),
  body('currency').optional().isString(),
  optionalInt('duration'),
  body('features').optional().isArray(),
  body('courseAccess').optional().isArray(),
  optionalBoolean('isActive'),
  ...planDateFields
];

export const ticketStatusBodyValidator = [
  body('status').isIn(Object.values(TICKET_STATUS)).withMessage('Invalid ticket status')
];

export const ticketReplyValidator = [
  body('message').trim().isLength({ min: 1 }).withMessage('Message is required')
];

export const legalBodyValidator = [
  body('title').optional().trim().isLength({ min: 1, max: 255 }),
  body('content').trim().isLength({ min: 1 }).withMessage('Content is required')
];

export const notificationBodyValidator = [
  body('title').trim().isLength({ min: 1, max: 255 }).withMessage('Title is required'),
  body('body').optional().isString(),
  body('type').optional().isString(),
  optionalUuid('userId'),
  body('data').optional().isObject()
];

export const faqBodyValidator = [
  body('question').trim().isLength({ min: 1 }).withMessage('Question is required'),
  body('answer').trim().isLength({ min: 1 }).withMessage('Answer is required'),
  body('category').optional().isString(),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

export const faqUpdateValidator = [
  body('question').optional().trim().isLength({ min: 1 }),
  body('answer').optional().trim().isLength({ min: 1 }),
  body('category').optional().isString(),
  optionalInt('displayOrder'),
  optionalBoolean('isPublished')
];

export const contactBodyValidator = [
  body('phone').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
  body('whatsapp').optional({ values: 'falsy' }).trim().isLength({ max: 40 }),
  body('hours').optional({ values: 'falsy' }).trim().isLength({ max: 120 }),
  body('email').optional({ values: 'falsy' }).isEmail().withMessage('Invalid email').normalizeEmail(),
  body('address').optional({ values: 'falsy' }).trim().isLength({ max: 500 })
];

export const userUpdateValidator = [
  body('firstName').optional().trim().isLength({ min: 1, max: 100 }),
  body('lastName').optional().trim().isLength({ min: 1, max: 100 }),
  body('phone').optional({ values: 'falsy' }).trim().isLength({ min: 8, max: 20 }),
  body('state').optional().trim().isLength({ max: 100 }),
  body('role').optional().isIn(Object.values(USER_ROLES)).withMessage('Invalid role'),
  body('status').optional().isIn(Object.values(USER_STATUS)).withMessage('Invalid status')
];
