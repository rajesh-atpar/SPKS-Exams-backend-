import { readdirSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import app from '../app.js';
import adminRoutes from '../routes/admin.routes.js';
import adminAuthRoutes from '../routes/adminAuth.routes.js';
import adminUserRoutes from '../routes/adminUser.routes.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const listJs = (dir, files = []) => {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      listJs(fullPath, files);
    } else if (entry.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  return files;
};

const files = listJs(root);
for (const file of files) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`Syntax error in ${file}\n${result.stderr || result.stdout}`);
  }
}

if (!app) {
  throw new Error('App failed to load');
}

const routeKeys = (router) => router.stack
  .filter((layer) => layer.route)
  .flatMap((layer) => Object.keys(layer.route.methods)
    .filter((method) => layer.route.methods[method])
    .map((method) => `${method.toUpperCase()} ${layer.route.path}`));

const expected = {
  adminAuth: ['POST /login', 'GET /me'],
  adminUsers: ['GET /', 'GET /:userId'],
  admin: [
    'GET /courses',
    'GET /groups',
    'GET /groups/:groupId',
    'GET /classes/:classId',
    'GET /subjects/:subjectId',
    'GET /chapters/:chapterId',
    'GET /lessons/:lessonId',
    'POST /questions/upload',
    'GET /faqs',
    'GET /analytics/overview'
  ]
};

const actual = {
  adminAuth: routeKeys(adminAuthRoutes),
  adminUsers: routeKeys(adminUserRoutes),
  admin: routeKeys(adminRoutes)
};

const missing = Object.entries(expected).flatMap(([group, routes]) => (
  routes
    .filter((route) => !actual[group].includes(route))
    .map((route) => `${group}: ${route}`)
));

if (missing.length) {
  throw new Error(`Missing required routes:\n${missing.join('\n')}`);
}

console.log(`Build OK (${files.length} files checked)`);
