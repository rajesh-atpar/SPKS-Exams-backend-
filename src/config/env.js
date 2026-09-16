import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const WEAK_SECRETS = new Set([
  '',
  'secret',
  'your-secret-key',
  'change-this-to-a-long-random-string'
]);

export const isProduction = () => process.env.NODE_ENV === 'production';

export const assertProductionEnv = () => {
  if (!isProduction()) return;

  const required = {
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    JWT_SECRET: process.env.JWT_SECRET
  };

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (!/^https?:\/\//i.test(String(process.env.SUPABASE_URL).trim())) {
    throw new Error('SUPABASE_URL must be the project URL, like https://xxxx.supabase.co — not an API key.');
  }

  if (WEAK_SECRETS.has(process.env.JWT_SECRET) || String(process.env.JWT_SECRET).length < 16) {
    throw new Error('JWT_SECRET must be a strong unique value in production (min 16 characters).');
  }

  if (!process.env.FRONTEND_ADMIN_URL && !process.env.FRONTEND_STUDENT_URL) {
    console.warn('FRONTEND_ADMIN_URL and FRONTEND_STUDENT_URL are not set. Browser CORS requests will be rejected.');
  }
};
