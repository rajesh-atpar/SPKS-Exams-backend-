export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  EDITOR: 'editor',
  SUPPORT: 'support'
};

export const STAFF_ROLES = [USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.SUPPORT];

export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  DELETED: 'deleted'
};

export const CONTENT_TYPES = {
  PDF: 'pdf',
  BOOK: 'book',
  NOTE: 'note',
  ARTICLE: 'article',
  OUTSIDE_SOURCE: 'outside-source',
  LESSON: 'lesson'
};

export const CURRENT_AFFAIR_CATEGORIES = {
  STATE: 'state',
  INDIA: 'india',
  INTERNATIONAL: 'international',
  OTHERS: 'others'
};

export const TICKET_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in-progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

export const ATTEMPT_STATUS = {
  IN_PROGRESS: 'in-progress',
  SUBMITTED: 'submitted',
  AUTO_SUBMITTED: 'auto-submitted'
};

export const BOOKMARK_TYPES = {
  CONTENT: 'content',
  VIDEO: 'video',
  CURRENT_AFFAIR: 'current-affair'
};

export const LEGAL_TYPES = {
  TERMS: 'terms',
  PRIVACY: 'privacy-policy',
  REFUND: 'refund-policy'
};

export const PAYMENT_STATUS = {
  CREATED: 'created',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
};

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired',
  PENDING: 'pending'
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
  SERVICE_UNAVAILABLE: 503,
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
  PAYMENT_ERROR: 'PAYMENT_ERROR',
  PREMIUM_REQUIRED: 'PREMIUM_REQUIRED'
};

export const PLATFORM_SETTING_KEYS = {
  HELP_CONTACT: 'help_contact'
};

export const DEFAULT_HELP_CONTACT = {
  phone: '+91 00000 00000',
  whatsapp: '+91 00000 00000',
  hours: 'Mon–Sat, 9:00 AM – 6:00 PM IST',
  email: 'support@spksexams.com',
  address: ''
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100
};

export const FILE_UPLOAD = {
  MAX_SIZE: Number(process.env.MAX_FILE_SIZE) || 25 * 1024 * 1024,
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf'],
  PROFILE_IMAGE_PATH: 'profile-images',
  CONTENT_PATH: 'content',
  LESSON_PDF_PATH: 'lessons',
  VIDEO_PATH: 'videos',
  CURRENT_AFFAIRS_PATH: 'current-affairs',
  QUESTION_IMAGE_PATH: 'question-images'
};

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || '1h',
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  RESET_TOKEN_EXPIRY: '1h'
};

export const PUBLIC_USER_FIELDS = [
  'id',
  'firstName',
  'lastName',
  'email',
  'phone',
  'profileImage',
  'state',
  'role',
  'status',
  'createdAt',
  'updatedAt'
];
