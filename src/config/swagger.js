import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const PORT = process.env.PORT || 4000;
const SERVER_URL = process.env.API_BASE_URL || `http://localhost:${PORT}`;
const bearer = [{ bearerAuth: [] }];
const json = (schema) => ({ content: { 'application/json': { schema } } });
const jsonBody = (schema) => ({ required: true, content: { 'application/json': { schema } } });
const uuidParam = (name, description) => ({
  name,
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
  description
});

const pageQuery = {
  page: { type: 'integer', default: 1 },
  limit: { type: 'integer', default: 20 },
  search: { type: 'string' }
};

const ok = (description = 'Success') => ({
  200: { description, ...json({ $ref: '#/components/schemas/SuccessResponse' }) }
});

const created = {
  201: { description: 'Created', ...json({ $ref: '#/components/schemas/SuccessResponse' }) }
};

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'SPKS Backend API',
      version: '2.0.0',
      description: 'Backend API for the SPKS mobile app and admin panel. Auth uses JWT access + refresh tokens. App users have role `user`. Staff roles are `admin`, `editor`, and `support`.'
    },
    servers: [{ url: SERVER_URL, description: 'Current environment' }],
    tags: [
      { name: 'Health' },
      { name: 'App Auth' },
      { name: 'Admin Auth' },
      { name: 'Users' },
      { name: 'Courses' },
      { name: 'Catalog' },
      { name: 'Content' },
      { name: 'Videos' },
      { name: 'Current Affairs' },
      { name: 'Tests' },
      { name: 'Payments' },
      { name: 'Support' },
      { name: 'Legal' },
      { name: 'Notifications' },
      { name: 'Admin' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        },
        RegisterInput: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone: { type: 'string' },
            password: { type: 'string' },
            state: { type: 'string' }
          }
        },
        PlanInput: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Monthly' },
            amount: { type: 'number', example: 1, description: 'Plan price. Alias: price' },
            price: { type: 'number', example: 1 },
            currency: { type: 'string', example: 'INR' },
            duration: { type: 'integer', example: 30, description: 'Access days. Auto-set from startDate/endDate when both are sent.' },
            startDate: { type: 'string', format: 'date-time', nullable: true, description: 'Plan start. Alias: startsAt' },
            endDate: { type: 'string', format: 'date-time', nullable: true, description: 'Plan end. Alias: endsAt' },
            features: { type: 'array', items: { type: 'string' } },
            courseAccess: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' }
          }
        },
        LoginInput: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' }
          }
        }
      }
    },
    paths: {
      '/api/health': {
        get: { tags: ['Health'], summary: 'Health check', responses: ok() }
      },
      '/api/auth/register': {
        post: { tags: ['App Auth'], summary: 'Register app user', requestBody: jsonBody({ $ref: '#/components/schemas/RegisterInput' }), responses: created }
      },
      '/api/auth/login': {
        post: { tags: ['App Auth'], summary: 'App login', requestBody: jsonBody({ $ref: '#/components/schemas/LoginInput' }), responses: ok() }
      },
      '/api/auth/logout': {
        post: { tags: ['App Auth'], security: bearer, summary: 'App logout', responses: ok() }
      },
      '/api/auth/refresh-token': {
        post: { tags: ['App Auth'], summary: 'Refresh tokens', requestBody: jsonBody({ type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } }), responses: ok() }
      },
      '/api/auth/forgot-password': {
        post: { tags: ['App Auth'], summary: 'Request password reset', requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string' } } }), responses: ok() }
      },
      '/api/auth/reset-password': {
        post: { tags: ['App Auth'], summary: 'Reset password', requestBody: jsonBody({ type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string' } } }), responses: ok() }
      },
      '/api/auth/change-password': {
        post: { tags: ['App Auth'], security: bearer, summary: 'Change password while logged in', requestBody: jsonBody({ type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } } }), responses: ok() }
      },
      '/api/auth/me': {
        get: { tags: ['App Auth'], security: bearer, summary: 'Current app user', responses: ok() }
      },
      '/api/admin/auth/login': {
        post: { tags: ['Admin Auth'], summary: 'Staff login', requestBody: jsonBody({ $ref: '#/components/schemas/LoginInput' }), responses: ok() }
      },
      '/api/admin/auth/forgot-password': {
        post: { tags: ['Admin Auth'], summary: 'Staff forgot password', requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string' } } }), responses: ok() }
      },
      '/api/admin/auth/reset-password': {
        post: { tags: ['Admin Auth'], summary: 'Staff reset password', requestBody: jsonBody({ type: 'object', required: ['token', 'password'], properties: { token: { type: 'string' }, password: { type: 'string' } } }), responses: ok() }
      },
      '/api/admin/auth/change-password': {
        post: { tags: ['Admin Auth'], security: bearer, summary: 'Staff change password', requestBody: jsonBody({ type: 'object', required: ['currentPassword', 'newPassword'], properties: { currentPassword: { type: 'string' }, newPassword: { type: 'string' } } }), responses: ok() }
      },
      '/api/admin/auth/logout': {
        post: { tags: ['Admin Auth'], security: bearer, summary: 'Staff logout', responses: ok() }
      },
      '/api/admin/auth/refresh-token': {
        post: { tags: ['Admin Auth'], summary: 'Refresh staff tokens', requestBody: jsonBody({ type: 'object', required: ['refreshToken'], properties: { refreshToken: { type: 'string' } } }), responses: ok() }
      },
      '/api/admin/auth/me': {
        get: { tags: ['Admin Auth'], security: bearer, summary: 'Current staff user', responses: ok() }
      },
      '/api/users/me': {
        get: { tags: ['Users'], security: bearer, summary: 'Get profile', responses: ok() },
        patch: { tags: ['Users'], security: bearer, summary: 'Update profile', responses: ok() }
      },
      '/api/users/me/profile-image': {
        post: { tags: ['Users'], security: bearer, summary: 'Upload profile image', responses: ok() },
        delete: { tags: ['Users'], security: bearer, summary: 'Remove profile image', responses: ok() }
      },
      '/api/users/me/settings': {
        get: { tags: ['Users'], security: bearer, summary: 'Get settings', responses: ok() },
        patch: { tags: ['Users'], security: bearer, summary: 'Update settings', responses: ok() }
      },
      '/api/users/me/account': {
        delete: { tags: ['Users'], security: bearer, summary: 'Delete account', responses: ok() }
      },
      '/api/users/me/bookmarks': {
        get: { tags: ['Users'], security: bearer, summary: 'List bookmarks', responses: ok() }
      },
      '/api/users/me/progress': { get: { tags: ['Users'], security: bearer, summary: 'Progress', responses: ok() } },
      '/api/users/me/continue-learning': { get: { tags: ['Users'], security: bearer, summary: 'Continue learning', responses: ok() } },
      '/api/users/me/course-progress': { get: { tags: ['Users'], security: bearer, summary: 'Course progress', responses: ok() } },
      '/api/users/me/activity': { get: { tags: ['Users'], security: bearer, summary: 'Activity', responses: ok() } },
      '/api/users/me/streak': { get: { tags: ['Users'], security: bearer, summary: 'Daily streak', responses: ok() } },
      '/api/users/me/analytics': { get: { tags: ['Users'], security: bearer, summary: 'User analytics', responses: ok() } },
      '/api/users/me/stats': { get: { tags: ['Users'], security: bearer, summary: 'User stats', responses: ok() } },
      '/api/users/me/attempts': { get: { tags: ['Tests'], security: bearer, summary: 'My attempts', responses: ok() } },
      '/api/users/me/test-history': { get: { tags: ['Tests'], security: bearer, summary: 'Test history', responses: ok() } },
      '/api/users/me/device-token': {
        post: { tags: ['Notifications'], security: bearer, summary: 'Save device token', responses: ok() },
        delete: { tags: ['Notifications'], security: bearer, summary: 'Remove device token', responses: ok() }
      },
      '/api/courses': { get: { tags: ['Courses'], summary: 'List courses', parameters: Object.entries(pageQuery).map(([name, schema]) => ({ name, in: 'query', schema })), responses: ok() } },
      '/api/courses/{courseId}': { get: { tags: ['Courses'], security: bearer, summary: 'Get course (requires active plan)', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/groups': { get: { tags: ['Courses'], security: bearer, summary: 'Course groups (requires active plan)', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/categories': { get: { tags: ['Courses'], security: bearer, summary: 'Course categories (requires active plan)', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/overview': { get: { tags: ['Courses'], security: bearer, summary: 'Course overview (requires active plan)', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/content': { get: { tags: ['Content'], summary: 'Course content', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/notes': { get: { tags: ['Content'], summary: 'Course notes', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/books': { get: { tags: ['Content'], summary: 'Course books', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/outside-sources': { get: { tags: ['Content'], summary: 'Outside sources', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/videos': { get: { tags: ['Videos'], summary: 'Course videos', parameters: [uuidParam('courseId')], responses: ok() } },
      '/api/courses/{courseId}/tests': { get: { tags: ['Tests'], security: bearer, summary: 'Course tests', parameters: [uuidParam('courseId'), { name: 'groupId', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: ok() } },
      '/api/groups/{groupId}': { get: { tags: ['Catalog'], summary: 'Get group', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/subjects': { get: { tags: ['Catalog'], summary: 'Group subjects', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/classes': { get: { tags: ['Catalog'], summary: 'Group classes', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/content': { get: { tags: ['Content'], summary: 'Group content', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/books': { get: { tags: ['Content'], summary: 'Group books', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/notes': { get: { tags: ['Content'], summary: 'Group notes', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/outside-sources': { get: { tags: ['Content'], summary: 'Group outside sources', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/videos': { get: { tags: ['Videos'], summary: 'Group videos', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/groups/{groupId}/tests': { get: { tags: ['Tests'], security: bearer, summary: 'Group tests', parameters: [uuidParam('groupId')], responses: ok() } },
      '/api/classes/{classId}/subjects': { get: { tags: ['Catalog'], summary: 'Class subjects', parameters: [uuidParam('classId')], responses: ok() } },
      '/api/subjects/{subjectId}': { get: { tags: ['Catalog'], summary: 'Get subject', parameters: [uuidParam('subjectId')], responses: ok() } },
      '/api/subjects/{subjectId}/content': { get: { tags: ['Content'], summary: 'Subject content', parameters: [uuidParam('subjectId')], responses: ok() } },
      '/api/subjects/{subjectId}/chapters': { get: { tags: ['Catalog'], summary: 'Subject chapters', parameters: [uuidParam('subjectId')], responses: ok() } },
      '/api/chapters/{chapterId}': { get: { tags: ['Catalog'], summary: 'Get chapter', parameters: [uuidParam('chapterId')], responses: ok() } },
      '/api/chapters/{chapterId}/lessons': { get: { tags: ['Catalog'], summary: 'Chapter lessons', parameters: [uuidParam('chapterId')], responses: ok() } },
      '/api/chapters/{chapterId}/content': { get: { tags: ['Content'], summary: 'Chapter content', parameters: [uuidParam('chapterId')], responses: ok() } },
      '/api/lessons/{lessonId}': { get: { tags: ['Catalog'], summary: 'Get lesson (includes pdfUrl and pdfViewUrl)', parameters: [uuidParam('lessonId')], responses: ok() } },
      '/api/lessons/{lessonId}/pdf': { get: { tags: ['Catalog'], summary: 'View lesson PDF inline (do not download)', parameters: [uuidParam('lessonId')], responses: { 200: { description: 'PDF stream', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } } } },
      '/api/lessons/{lessonId}/progress': { post: { tags: ['Catalog'], security: bearer, summary: 'Record lesson access for continue-learning', parameters: [uuidParam('lessonId')], responses: ok() } },
      '/api/lessons/{lessonId}/complete': { post: { tags: ['Catalog'], security: bearer, summary: 'Complete lesson', parameters: [uuidParam('lessonId')], responses: ok() } },
      '/api/content': { get: { tags: ['Content'], summary: 'List content', responses: ok() } },
      '/api/content/{contentId}': { get: { tags: ['Content'], summary: 'Get content (includes viewUrl for in-app PDF viewing)', parameters: [uuidParam('contentId')], responses: ok() } },
      '/api/content/{contentId}/view': { get: { tags: ['Content'], summary: 'View content PDF inline (do not download)', parameters: [uuidParam('contentId')], responses: { 200: { description: 'PDF stream', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } } } },
      '/api/content/{contentId}/download': { get: { tags: ['Content'], security: bearer, summary: 'Download content', parameters: [uuidParam('contentId')], responses: ok() } },
      '/api/content/{contentId}/bookmark': {
        post: { tags: ['Content'], security: bearer, summary: 'Bookmark content', parameters: [uuidParam('contentId')], responses: created },
        delete: { tags: ['Content'], security: bearer, summary: 'Remove content bookmark', parameters: [uuidParam('contentId')], responses: ok() }
      },
      '/api/videos': { get: { tags: ['Videos'], summary: 'List videos', parameters: [{ name: 'category', in: 'query', schema: { type: 'string', example: 'daily-analysis' } }], responses: ok() } },
      '/api/videos/{videoId}': { get: { tags: ['Videos'], summary: 'Get video', parameters: [uuidParam('videoId')], responses: ok() } },
      '/api/videos/{videoId}/view': { post: { tags: ['Videos'], security: bearer, summary: 'Record video view', parameters: [uuidParam('videoId')], responses: ok() } },
      '/api/videos/{videoId}/bookmark': {
        post: { tags: ['Videos'], security: bearer, summary: 'Bookmark video', parameters: [uuidParam('videoId')], responses: created },
        delete: { tags: ['Videos'], security: bearer, summary: 'Remove video bookmark', parameters: [uuidParam('videoId')], responses: ok() }
      },
      '/api/current-affairs': { get: { tags: ['Current Affairs'], summary: 'List current affairs', parameters: [{ name: 'date', in: 'query', schema: { type: 'string', example: '2026-08-23' } }, { name: 'category', in: 'query', schema: { type: 'string', enum: ['state', 'india', 'international', 'others'] } }], responses: ok() } },
      '/api/current-affairs/monthly': { get: { tags: ['Current Affairs'], summary: 'Monthly current affairs', parameters: [{ name: 'month', in: 'query', schema: { type: 'string', example: '2026-08' } }], responses: ok() } },
      '/api/current-affairs/{articleId}': { get: { tags: ['Current Affairs'], summary: 'Get article', parameters: [uuidParam('articleId')], responses: ok() } },
      '/api/current-affairs/{articleId}/bookmark': {
        post: { tags: ['Current Affairs'], security: bearer, summary: 'Bookmark article', parameters: [uuidParam('articleId')], responses: created },
        delete: { tags: ['Current Affairs'], security: bearer, summary: 'Remove article bookmark', parameters: [uuidParam('articleId')], responses: ok() }
      },
      '/api/tests': { get: { tags: ['Tests'], security: bearer, summary: 'List published tests (filter by courseId, groupId)', parameters: [{ name: 'courseId', in: 'query', schema: { type: 'string', format: 'uuid' } }, { name: 'groupId', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: ok() } },
      '/api/tests/{testId}': { get: { tags: ['Tests'], security: bearer, summary: 'Get test', parameters: [uuidParam('testId')], responses: ok() } },
      '/api/tests/{testId}/start': { post: { tags: ['Tests'], security: bearer, summary: 'Start test', parameters: [uuidParam('testId')], responses: created } },
      '/api/attempts/{attemptId}': { get: { tags: ['Tests'], security: bearer, summary: 'Get attempt', parameters: [uuidParam('attemptId')], responses: ok() } },
      '/api/attempts/{attemptId}/answers': { post: { tags: ['Tests'], security: bearer, summary: 'Save answers', parameters: [uuidParam('attemptId')], responses: ok() } },
      '/api/attempts/{attemptId}/submit': { post: { tags: ['Tests'], security: bearer, summary: 'Submit attempt', parameters: [uuidParam('attemptId')], responses: ok() } },
      '/api/attempts/{attemptId}/result': { get: { tags: ['Tests'], security: bearer, summary: 'Attempt result with answers', parameters: [uuidParam('attemptId')], responses: ok() } },
      '/api/plans': { get: { tags: ['Payments'], summary: 'List paid plans (1 month ₹1, 6 months ₹2, 1 year ₹3)', responses: ok() } },
      '/api/plans/{planId}': { get: { tags: ['Payments'], summary: 'Get plan', parameters: [uuidParam('planId')], responses: ok() } },
      '/api/subscriptions/current': { get: { tags: ['Payments'], security: bearer, summary: 'Current subscription (null if expired)', responses: ok() } },
      '/api/subscriptions/{subscriptionId}/cancel': { post: { tags: ['Payments'], security: bearer, summary: 'Cancel subscription', parameters: [uuidParam('subscriptionId')], responses: ok() } },
      '/api/payments/config': { get: { tags: ['Payments'], summary: 'Razorpay public key for Checkout', responses: ok() } },
      '/api/payments/history': { get: { tags: ['Payments'], security: bearer, summary: 'Payment history', responses: ok() } },
      '/api/payments/create-order': { post: { tags: ['Payments'], security: bearer, summary: 'Create Razorpay order for a plan', responses: created } },
      '/api/payments/verify': { post: { tags: ['Payments'], security: bearer, summary: 'Verify Razorpay payment and activate plan', responses: ok() } },
      '/api/payments/webhook': { post: { tags: ['Payments'], summary: 'Razorpay webhook', responses: ok() } },
      '/api/help/faqs': { get: { tags: ['Support'], summary: 'FAQs', responses: ok() } },
      '/api/help/contact': { get: { tags: ['Support'], summary: 'Help contact (phone, WhatsApp, hours)', responses: ok() } },
      '/api/support/tickets': {
        get: { tags: ['Support'], security: bearer, summary: 'My tickets', responses: ok() },
        post: { tags: ['Support'], security: bearer, summary: 'Create ticket', responses: created }
      },
      '/api/support/tickets/{ticketId}': { get: { tags: ['Support'], security: bearer, summary: 'Get ticket', parameters: [uuidParam('ticketId')], responses: ok() } },
      '/api/support/tickets/{ticketId}/messages': { post: { tags: ['Support'], security: bearer, summary: 'Add ticket message', parameters: [uuidParam('ticketId')], responses: ok() } },
      '/api/legal/terms': { get: { tags: ['Legal'], summary: 'Terms', responses: ok() } },
      '/api/legal/privacy-policy': { get: { tags: ['Legal'], summary: 'Privacy policy', responses: ok() } },
      '/api/legal/refund-policy': { get: { tags: ['Legal'], summary: 'Refund policy', responses: ok() } },
      '/api/notifications': { get: { tags: ['Notifications'], security: bearer, summary: 'My notifications', responses: ok() } },
      '/api/notifications/read-all': { patch: { tags: ['Notifications'], security: bearer, summary: 'Mark all read', responses: ok() } },
      '/api/notifications/{notificationId}/read': { patch: { tags: ['Notifications'], security: bearer, summary: 'Mark one read', parameters: [uuidParam('notificationId')], responses: ok() } },
      '/api/admin/users': {
        get: { tags: ['Admin'], security: bearer, summary: 'List users', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create staff user', responses: created }
      },
      '/api/admin/users/{userId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get user', parameters: [uuidParam('userId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update user', parameters: [uuidParam('userId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete user', parameters: [uuidParam('userId')], responses: ok() }
      },
      '/api/admin/users/{userId}/progress': { get: { tags: ['Admin'], security: bearer, summary: 'User progress summary', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/continue-learning': { get: { tags: ['Admin'], security: bearer, summary: 'User continue learning', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/activity': { get: { tags: ['Admin'], security: bearer, summary: 'User activity', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/course-progress': { get: { tags: ['Admin'], security: bearer, summary: 'User course progress', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/test-history': { get: { tags: ['Admin'], security: bearer, summary: 'User test results by userId', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/status': { patch: { tags: ['Admin'], security: bearer, summary: 'Update user status', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/courses': {
        get: { tags: ['Admin'], security: bearer, summary: 'List courses', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create course', responses: created }
      },
      '/api/admin/courses/{courseId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get course', parameters: [uuidParam('courseId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update course', parameters: [uuidParam('courseId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete course', parameters: [uuidParam('courseId')], responses: ok() }
      },
      '/api/admin/groups': {
        get: { tags: ['Admin'], security: bearer, summary: 'List groups', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create group', responses: created }
      },
      '/api/admin/groups/{groupId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get group', parameters: [uuidParam('groupId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update group', parameters: [uuidParam('groupId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete group', parameters: [uuidParam('groupId')], responses: ok() }
      },
      '/api/admin/classes': {
        get: { tags: ['Admin'], security: bearer, summary: 'List classes', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create class', responses: created }
      },
      '/api/admin/classes/{classId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get class', parameters: [uuidParam('classId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update class', parameters: [uuidParam('classId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete class', parameters: [uuidParam('classId')], responses: ok() }
      },
      '/api/admin/subjects': {
        get: { tags: ['Admin'], security: bearer, summary: 'List subjects', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create subject', responses: created }
      },
      '/api/admin/subjects/{subjectId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get subject', parameters: [uuidParam('subjectId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update subject', parameters: [uuidParam('subjectId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete subject', parameters: [uuidParam('subjectId')], responses: ok() }
      },
      '/api/admin/content': {
        get: { tags: ['Admin'], security: bearer, summary: 'List content', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create content', responses: created }
      },
      '/api/admin/content/upload': { post: { tags: ['Admin'], security: bearer, summary: 'Upload content file', responses: created } },
      '/api/admin/content/{contentId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get content', parameters: [uuidParam('contentId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update content', parameters: [uuidParam('contentId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete content', parameters: [uuidParam('contentId')], responses: ok() }
      },
      '/api/admin/chapters': {
        get: { tags: ['Admin'], security: bearer, summary: 'List chapters', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create chapter', responses: created }
      },
      '/api/admin/chapters/{chapterId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get chapter', parameters: [uuidParam('chapterId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update chapter', parameters: [uuidParam('chapterId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete chapter', parameters: [uuidParam('chapterId')], responses: ok() }
      },
      '/api/admin/lessons': {
        get: { tags: ['Admin'], security: bearer, summary: 'List lessons', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create lesson (optional pdfUrl)', responses: created }
      },
      '/api/admin/lessons/upload': { post: { tags: ['Admin'], security: bearer, summary: 'Upload a lesson PDF and get url/path', responses: created } },
      '/api/admin/lessons/{lessonId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get lesson', parameters: [uuidParam('lessonId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update lesson (optional pdfUrl)', parameters: [uuidParam('lessonId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete lesson', parameters: [uuidParam('lessonId')], responses: ok() }
      },
      '/api/admin/lessons/{lessonId}/pdf': { post: { tags: ['Admin'], security: bearer, summary: 'Upload or replace the lesson PDF', parameters: [uuidParam('lessonId')], responses: ok() } },
      '/api/admin/videos': {
        get: { tags: ['Admin'], security: bearer, summary: 'List videos', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create video', responses: created }
      },
      '/api/admin/videos/{videoId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get video', parameters: [uuidParam('videoId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update video', parameters: [uuidParam('videoId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete video', parameters: [uuidParam('videoId')], responses: ok() }
      },
      '/api/admin/current-affairs': {
        get: { tags: ['Admin'], security: bearer, summary: 'List current affairs', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create article', responses: created }
      },
      '/api/admin/current-affairs/upload': { post: { tags: ['Admin'], security: bearer, summary: 'Upload current-affairs file', responses: created } },
      '/api/admin/current-affairs/{articleId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get article', parameters: [uuidParam('articleId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update article', parameters: [uuidParam('articleId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete article', parameters: [uuidParam('articleId')], responses: ok() }
      },
      '/api/admin/tests': {
        get: { tags: ['Admin'], security: bearer, summary: 'List tests', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create test', responses: created }
      },
      '/api/admin/tests/{testId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get test with answers', parameters: [uuidParam('testId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update test', parameters: [uuidParam('testId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete test', parameters: [uuidParam('testId')], responses: ok() }
      },
      '/api/admin/tests/{testId}/questions': { post: { tags: ['Admin'], security: bearer, summary: 'Add multiple-choice question (options + correctAnswer)', parameters: [uuidParam('testId')], responses: created } },
      '/api/admin/tests/{testId}/results': { get: { tags: ['Admin'], security: bearer, summary: 'Results for a test, including userId', parameters: [uuidParam('testId')], responses: ok() } },
      '/api/admin/results': { get: { tags: ['Admin'], security: bearer, summary: 'List test results by userId or testId', parameters: [{ name: 'userId', in: 'query', schema: { type: 'string', format: 'uuid' } }, { name: 'testId', in: 'query', schema: { type: 'string', format: 'uuid' } }], responses: ok() } },
      '/api/admin/questions/upload': { post: { tags: ['Admin'], security: bearer, summary: 'Upload question image', responses: created } },
      '/api/admin/questions/{questionId}': {
        patch: { tags: ['Admin'], security: bearer, summary: 'Update question', parameters: [uuidParam('questionId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete question', parameters: [uuidParam('questionId')], responses: ok() }
      },
      '/api/admin/attempts/{attemptId}/result': { get: { tags: ['Admin'], security: bearer, summary: 'View any attempt result', parameters: [uuidParam('attemptId')], responses: ok() } },
      '/api/admin/analytics/overview': { get: { tags: ['Admin'], security: bearer, summary: 'Analytics overview', responses: ok() } },
      '/api/admin/analytics/users': { get: { tags: ['Admin'], security: bearer, summary: 'User analytics', responses: ok() } },
      '/api/admin/analytics/courses': { get: { tags: ['Admin'], security: bearer, summary: 'Course analytics', responses: ok() } },
      '/api/admin/analytics/tests': { get: { tags: ['Admin'], security: bearer, summary: 'Test analytics', responses: ok() } },
      '/api/admin/analytics/revenue': { get: { tags: ['Admin'], security: bearer, summary: 'Revenue analytics', responses: ok() } },
      '/api/admin/plans': {
        get: { tags: ['Admin'], security: bearer, summary: 'List plans', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create plan with amount and dates', requestBody: jsonBody({ $ref: '#/components/schemas/PlanInput' }), responses: created }
      },
      '/api/admin/plans/{planId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get plan', parameters: [uuidParam('planId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update plan amount and dates', parameters: [uuidParam('planId')], requestBody: jsonBody({ $ref: '#/components/schemas/PlanInput' }), responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete plan', parameters: [uuidParam('planId')], responses: ok() }
      },
      '/api/admin/subscriptions': { get: { tags: ['Admin'], security: bearer, summary: 'List all subscriptions with user and plan details', responses: ok() } },
      '/api/admin/payments': { get: { tags: ['Admin'], security: bearer, summary: 'List all payments with user and plan details', responses: ok() } },
      '/api/admin/users/{userId}/billing': { get: { tags: ['Admin'], security: bearer, summary: 'User plan, subscriptions, and payments', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/subscriptions': { get: { tags: ['Admin'], security: bearer, summary: 'Subscriptions for one user', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/users/{userId}/payments': { get: { tags: ['Admin'], security: bearer, summary: 'Payments for one user', parameters: [uuidParam('userId')], responses: ok() } },
      '/api/admin/support/tickets': { get: { tags: ['Admin'], security: bearer, summary: 'List tickets', responses: ok() } },
      '/api/admin/support/tickets/{ticketId}': { get: { tags: ['Admin'], security: bearer, summary: 'Get ticket', parameters: [uuidParam('ticketId')], responses: ok() } },
      '/api/admin/support/tickets/{ticketId}/status': { patch: { tags: ['Admin'], security: bearer, summary: 'Update ticket status', parameters: [uuidParam('ticketId')], responses: ok() } },
      '/api/admin/support/tickets/{ticketId}/reply': { post: { tags: ['Admin'], security: bearer, summary: 'Reply to ticket', parameters: [uuidParam('ticketId')], responses: ok() } },
      '/api/admin/notifications': {
        get: { tags: ['Admin'], security: bearer, summary: 'List notifications', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create notification', responses: created }
      },
      '/api/admin/notifications/send': { post: { tags: ['Admin'], security: bearer, summary: 'Send notification', responses: ok() } },
      '/api/admin/faqs': {
        get: { tags: ['Admin'], security: bearer, summary: 'List FAQs', responses: ok() },
        post: { tags: ['Admin'], security: bearer, summary: 'Create FAQ', responses: created }
      },
      '/api/admin/faqs/{faqId}': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get FAQ', parameters: [uuidParam('faqId')], responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update FAQ', parameters: [uuidParam('faqId')], responses: ok() },
        delete: { tags: ['Admin'], security: bearer, summary: 'Delete FAQ', parameters: [uuidParam('faqId')], responses: ok() }
      },
      '/api/admin/help/contact': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get help contact', responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update help contact', requestBody: jsonBody({ type: 'object', properties: { phone: { type: 'string' }, whatsapp: { type: 'string' }, hours: { type: 'string' }, email: { type: 'string' }, address: { type: 'string' } } }), responses: ok() }
      },
      '/api/admin/legal/terms': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get terms', responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update terms', responses: ok() }
      },
      '/api/admin/legal/privacy-policy': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get privacy policy', responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update privacy policy', responses: ok() }
      },
      '/api/admin/legal/refund-policy': {
        get: { tags: ['Admin'], security: bearer, summary: 'Get refund policy', responses: ok() },
        patch: { tags: ['Admin'], security: bearer, summary: 'Update refund policy', responses: ok() }
      }
    }
  },
  apis: []
};

const spec = swaggerJsdoc(options);

export const swaggerSetup = (app) => {
  app.get('/api-docs.json', (_req, res) => res.json(spec));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, {
    customSiteTitle: 'SPKS API Docs',
    swaggerOptions: { persistAuthorization: true }
  }));
  app.get('/', (_req, res) => res.redirect('/api-docs'));
};
