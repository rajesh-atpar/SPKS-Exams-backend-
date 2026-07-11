import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SPKS Exams Backend API',
      version: '1.0.0',
      description: 'Production-ready Online Examination System API with Supabase Auth. Complete backend for React Admin Panel and React Native Mobile App.',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Admin', description: 'Admin management endpoints' },
      { name: 'Student', description: 'Student management endpoints' },
      { name: 'Subject', description: 'Subject management endpoints' },
      { name: 'Exam', description: 'Exam management endpoints' },
      { name: 'Question', description: 'Question management endpoints' },
      { name: 'Dashboard', description: 'Dashboard statistics endpoints' },
      { name: 'File', description: 'File upload endpoints' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            data: { type: 'object', nullable: true },
            code: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new admin',
          description: 'Creates a new admin with email and password.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    fullName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Admin registered successfully' },
            400: { description: 'Validation error' },
            409: { description: 'Admin already exists' },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login admin',
          description: 'Authenticate admin with email and password.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/auth/student/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new student',
          description: 'Creates a new student with email and password.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    fullName: { type: 'string' },
                    rollNumber: { type: 'string' },
                    institution: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Student registered successfully' },
            400: { description: 'Validation error' },
            409: { description: 'Student already exists' },
          },
        },
      },
      '/api/auth/student/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login student',
          description: 'Authenticate student with email and password.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
            401: { description: 'Invalid credentials' },
          },
        },
      },
      '/api/dashboard/admin': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get admin dashboard stats',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Dashboard stats retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/dashboard/student': {
        get: {
          tags: ['Dashboard'],
          summary: 'Get student dashboard stats',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Dashboard stats retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/subjects': {
        get: {
          tags: ['Subject'],
          summary: 'List all subjects',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Subjects retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Subject'],
          summary: 'Create a new subject',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'code'],
                  properties: {
                    name: { type: 'string' },
                    code: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Subject created' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/exams': {
        get: {
          tags: ['Exam'],
          summary: 'List all exams',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Exams retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Exam'],
          summary: 'Create a new exam',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'subjectId', 'durationMinutes', 'totalMarks', 'passingMarks'],
                  properties: {
                    title: { type: 'string' },
                    subjectId: { type: 'string', format: 'uuid' },
                    durationMinutes: { type: 'integer' },
                    totalMarks: { type: 'integer' },
                    passingMarks: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Exam created' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/students': {
        get: {
          tags: ['Student'],
          summary: 'List all students',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Students retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Student'],
          summary: 'Create a new student',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'fullName'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string' },
                    fullName: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Student created' },
            401: { description: 'Unauthorized' },
          },
        },
      },
      '/api/questions': {
        get: {
          tags: ['Question'],
          summary: 'List all questions',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Questions retrieved' },
            401: { description: 'Unauthorized' },
          },
        },
        post: {
          tags: ['Question'],
          summary: 'Create a new question',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['examId', 'questionText', 'questionType', 'marks', 'options'],
                  properties: {
                    examId: { type: 'string', format: 'uuid' },
                    questionText: { type: 'string' },
                    questionType: { type: 'string', enum: ['single_choice', 'multiple_choice', 'true_false', 'short_answer'] },
                    marks: { type: 'integer' },
                    options: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          optionText: { type: 'string' },
                          isCorrect: { type: 'boolean' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Question created' },
            401: { description: 'Unauthorized' },
          },
        },
      },
    },
  },
  apis: [],
};

const spec = swaggerJsdoc(options);

export const swaggerSetup = (app) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec, { explorer: true }));
  return spec;
};
