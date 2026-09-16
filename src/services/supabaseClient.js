import { createClient } from '@supabase/supabase-js';

const PLACEHOLDER_URL = 'https://placeholder.supabase.co';
const PLACEHOLDER_KEY = 'placeholder';

const isHttpUrl = (value) => /^https?:\/\//i.test(String(value || '').trim());

const supabaseUrl = isHttpUrl(process.env.SUPABASE_URL)
  ? process.env.SUPABASE_URL.trim()
  : PLACEHOLDER_URL;
const supabaseAnonKey = String(process.env.SUPABASE_ANON_KEY || PLACEHOLDER_KEY).trim() || PLACEHOLDER_KEY;
const supabaseServiceKey = String(process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey).trim();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
