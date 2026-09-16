import '../config/env.js';
import bcrypt from 'bcryptjs';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { USER_ROLES, USER_STATUS } from '../config/constants.js';

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@spks.com').toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123';
const firstName = process.env.SEED_ADMIN_FIRST_NAME || 'Admin';
const lastName = process.env.SEED_ADMIN_LAST_NAME || 'User';
const passwordHash = await bcrypt.hash(password, 10);

const { data: existing, error: findError } = await supabaseAdmin
  .from('users')
  .select('id')
  .ilike('email', email)
  .maybeSingle();

if (findError) {
  throw new Error(`Could not read users table in Supabase: ${findError.message}`);
}

const row = {
  first_name: firstName,
  last_name: lastName,
  email,
  password_hash: passwordHash,
  role: USER_ROLES.ADMIN,
  status: USER_STATUS.ACTIVE
};

let admin;
if (existing?.id) {
  const { data, error } = await supabaseAdmin.from('users').update(row).eq('id', existing.id).select('*').single();
  if (error) throw new Error(`Could not update admin in Supabase: ${error.message}`);
  admin = data;
} else {
  const { data, error } = await supabaseAdmin.from('users').insert(row).select('*').single();
  if (error) throw new Error(`Could not create admin in Supabase: ${error.message}`);
  admin = data;
}

const { data: staff, error: staffFindError } = await supabaseAdmin
  .from('admins')
  .select('id')
  .eq('user_id', admin.id)
  .maybeSingle();

if (staffFindError) {
  console.warn(`Admin profile lookup failed: ${staffFindError.message}`);
} else if (staff?.id) {
  const { error } = await supabaseAdmin.from('admins').update({ role: USER_ROLES.ADMIN }).eq('id', staff.id);
  if (error) console.warn(`Admin profile row not updated: ${error.message}`);
} else {
  const { error } = await supabaseAdmin.from('admins').insert({ user_id: admin.id, role: USER_ROLES.ADMIN });
  if (error) console.warn(`Admin profile row not created: ${error.message}`);
}

console.log(`${existing ? 'Updated' : 'Created'} admin ${email} in Supabase`);
process.exit(0);
