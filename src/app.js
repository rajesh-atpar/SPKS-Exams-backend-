import './config/env.js';
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

import authRoutes from './routes/auth.routes.js';
import adminAuthRoutes from './routes/adminAuth.routes.js';
import adminRoutes from './routes/admin.routes.js';
import adminUserRoutes from './routes/adminUser.routes.js';
import userRoutes from './routes/user.routes.js';
import courseRoutes from './routes/course.routes.js';
import { chapterRoutes, classRoutes, groupRoutes, subjectRoutes } from './routes/catalog.routes.js';
import contentRoutes from './routes/content.routes.js';
import lessonRoutes from './routes/lesson.routes.js';
import videoRoutes from './routes/video.routes.js';
import currentAffairRoutes from './routes/currentAffair.routes.js';
import { attemptRoutes, testRoutes } from './routes/test.routes.js';
import {
  helpRoutes,
  legalRoutes,
  notificationRoutes,
  paymentRoutes,
  planRoutes,
  subscriptionRoutes,
  supportRoutes
} from './routes/platform.routes.js';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

const allowedOrigins = [
  process.env.FRONTEND_ADMIN_URL,
  process.env.FRONTEND_STUDENT_URL
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : '*',
  credentials: true
}));

app.use(compression());
app.use(express.json({
  limit: '10mb',
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

app.use('/api/', generalRateLimiter);

app.get('/favicon.ico', (_req, res) => res.status(204).end());

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SPKS Backend API is running',
    data: {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/current-affairs', currentAffairRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/notifications', notificationRoutes);

app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin', adminRoutes);

swaggerSetup(app);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
