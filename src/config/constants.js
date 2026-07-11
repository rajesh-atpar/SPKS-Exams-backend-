// Application Constants

export const USER_TYPES = {
  ADMIN: 'admin',
  STUDENT: 'student'
};

export const EXAM_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived'
};

export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in_progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto_submitted',
  ABANDONED: 'abandoned'
};

export const QUESTION_TYPES = {
  SINGLE_CHOICE: 'single_choice',
  MULTIPLE_CHOICE: 'multiple_choice',
  TRUE_FALSE: 'true_false',
  SHORT_ANSWER: 'short_answer'
};

export const NOTIFICATION_TYPES = {
  EXAM_ASSIGNED: 'exam_assigned',
  EXAM_REMINDER: 'exam_reminder',
  RESULT_PUBLISHED: 'result_published',
  CERTIFICATE_ISSUED: 'certificate_issued',
  GENERAL: 'general'
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
};

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND_ERROR',
  CONFLICT_ERROR: 'CONFLICT_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SUPABASE_ERROR: 'SUPABASE_ERROR'
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  PROFILE_IMAGE_PATH: 'profile-images',
  QUESTION_IMAGE_PATH: 'question-images',
  EXAM_PDF_PATH: 'exam-pdfs',
  CERTIFICATE_PATH: 'certificates'
};

export const EXAM_CONFIG = {
  DEFAULT_DURATION: 60, // minutes
  DEFAULT_PASSING_PERCENTAGE: 40,
  DEFAULT_NEGATIVE_MARKING: 0.25,
  DEFAULT_MAX_ATTEMPTS: 1
};

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
};

export const EMAIL_TEMPLATES = {
  EXAM_ASSIGNED: 'exam_assigned',
  EXAM_REMINDER: 'exam_reminder',
  RESULT_PUBLISHED: 'result_published',
  PASSWORD_RESET: 'password_reset',
  EMAIL_VERIFICATION: 'email_verification'
};

export const SORT_OPTIONS = {
  NEWEST_FIRST: 'newest_first',
  OLDEST_FIRST: 'oldest_first',
  HIGHEST_MARKS: 'highest_marks',
  LOWEST_MARKS: 'lowest_marks',
  ALPHABETICAL: 'alphabetical'
};

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  EXCEL: 'excel',
  CSV: 'csv'
};

export const TIMEZONES = {
  DEFAULT: 'UTC',
  INDIA: 'Asia/Kolkata',
  US_EASTERN: 'America/New_York',
  US_PACIFIC: 'America/Los_Angeles'
};
