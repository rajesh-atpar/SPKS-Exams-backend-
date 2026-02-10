import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Backend API',
      version: '1.0.0',
      description: 'Production-ready API with Supabase Auth. Use with React, Next.js, or React Native.',
    },
    servers: [
      { url: 'http://localhost:4000', description: 'Development' },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
    ],
    components: {
      schemas: {
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
              description: 'Valid email address',
            },
            password: {
              type: 'string',
              minLength: 6,
              example: 'password123',
              description: 'Password (min 6 characters)',
            },
            fullName: {
              type: 'string',
              example: 'John Doe',
              description: 'Optional display name',
            },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              example: 'user@example.com',
            },
            password: {
              type: 'string',
              example: 'password123',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string' },
            fullName: { type: 'string', nullable: true },
            emailConfirmed: { type: 'boolean' },
          },
        },
        Session: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresAt: { type: 'number' },
          },
        },
        AuthSuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/User' },
                session: { $ref: '#/components/schemas/Session' },
              },
            },
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
      },
    },
    paths: {
      '/api/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new user',
          description: 'Creates a new user with email and password using Supabase Auth.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
                example: { email: 'user@example.com', password: 'password123', fullName: 'John Doe' },
              },
            },
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                  example: {
                    success: true,
                    message: 'User registered successfully.',
                    data: {
                      user: { id: 'uuid', email: 'user@example.com', fullName: 'John Doe', emailConfirmed: false },
                      session: { accessToken: 'eyJ...', refreshToken: '...', expiresAt: 1234567890 },
                    },
                  },
                },
              },
            },
            400: { description: 'Validation or registration error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            409: { description: 'User already exists', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
          },
        },
      },
      '/api/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          description: 'Authenticate with email and password. Returns access token and user data.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
                example: { email: 'user@example.com', password: 'password123' },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/AuthSuccessResponse' },
                  example: {
                    success: true,
                    message: 'Login successful',
                    data: {
                      user: { id: 'uuid', email: 'user@example.com', fullName: 'John Doe', emailConfirmed: true },
                      session: { accessToken: 'eyJ...', refreshToken: '...', expiresAt: 1234567890 },
                    },
                  },
                },
              },
            },
            400: { description: 'Missing fields or invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
            401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
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
