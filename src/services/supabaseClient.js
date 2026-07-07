import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials.');
  console.error('Please set the following environment variables in your .env file:');
  console.error('  - SUPABASE_URL: Your Supabase project URL');
  console.error('  - SUPABASE_ANON_KEY: Your Supabase anon/public key');
  console.error('  - SUPABASE_SERVICE_ROLE_KEY: Your Supabase service role key (for admin operations)');
  console.error('\nGet your credentials from: https://supabase.com/dashboard');
  console.error('\nCopy .env.example to .env and fill in your credentials.');
  throw new Error(
    'Missing Supabase credentials. Set SUPABASE_URL and SUPABASE_ANON_KEY in .env'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
