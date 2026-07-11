import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { swaggerSetup } from './config/swagger.js';
import logger from './config/logger.js';
import { generalRateLimiter } from './middleware/rateLimit.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import studentRoutes from './routes/student.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import examRoutes from './routes/exam.routes.js';
import questionRoutes from './routes/question.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import fileRoutes from './routes/file.routes.js';

const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_ADMIN_URL || '*',
  credentials: true
}));

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
app.use('/api/', generalRateLimiter);

// Favicon (avoid 404)
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Root – landing page UI
app.get('/', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SPKS Exams Backend API</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      min-height: 100vh;
      color: #e8e8e8;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    .card {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      padding: 2rem;
      max-width: 500px;
      width: 100%;
    }
    h1 { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.5rem; }
    p { color: #a0a0a0; font-size: 0.9rem; margin-bottom: 1.5rem; }
    .links { display: flex; flex-direction: column; gap: 0.75rem; }
    a {
      display: block;
      padding: 0.75rem 1rem;
      background: rgba(255,255,255,0.08);
      border-radius: 8px;
      color: #7dd3fc;
      text-decoration: none;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    a:hover { background: rgba(255,255,255,0.12); }
    .method { color: #86efac; font-size: 0.75rem; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SPKS Exams Backend API</h1>
    <p>Production-ready Online Examination System API</p>
    <div class="links">
      <a href="/api-docs">API Documentation (Swagger)</a>
      <a href="/api/health">Health Check</a>
      <span class="method">POST /api/auth/register - Admin Registration</span>
      <span class="method">POST /api/auth/login - Admin Login</span>
      <span class="method">POST /api/auth/student/register - Student Registration</span>
      <span class="method">POST /api/auth/student/login - Student Login</span>
    </div>
  </div>
</body>
</html>
  `);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SPKS Exams Backend API is running',
    data: { 
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    },
  });
});

// Swagger at /api-docs
swaggerSetup(app);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/files', fileRoutes);

// 404 then central error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
