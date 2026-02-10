import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { swaggerSetup } from './config/swagger.js';
import authRoutes from './routes/auth.routes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

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
  <title>Backend API</title>
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
      max-width: 420px;
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
    <h1>Backend API</h1>
    <p>Supabase Auth + Swagger. Use the links below.</p>
    <div class="links">
      <a href="/api-docs">API Docs (Swagger)</a>
      <a href="/api/health">Health check</a>
      <span class="method">POST /api/auth/register</span>
      <span class="method">POST /api/auth/login</span>
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
    message: 'API is running',
    data: { timestamp: new Date().toISOString() },
  });
});

// Swagger at /api-docs
swaggerSetup(app);

// Auth routes
app.use('/api/auth', authRoutes);

// 404 then central error handler
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
