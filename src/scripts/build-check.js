import { readdirSync, statSync } from 'fs';
import { spawnSync } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Vercel/CI run this without runtime secrets. Placeholders let the app
// load so we can syntax-check and verify routes; real env is required at start.
process.env.LOG_TO_FILE ||= 'false';
process.env.SUPABASE_URL ||= 'https://placeholder.supabase.co';
process.env.SUPABASE_ANON_KEY ||= 'build-placeholder-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'build-placeholder-service-role-key';
process.env.JWT_SECRET ||= 'build-placeholder-jwt-secret';

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

const [
  { default: app },
  { default: adminRoutes },
  { default: adminAuthRoutes },
  { default: adminUserRoutes }
] = await Promise.all([
  import('../app.js'),
  import('../routes/admin.routes.js'),
  import('../routes/adminAuth.routes.js'),
  import('../routes/adminUser.routes.js')
]);

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
