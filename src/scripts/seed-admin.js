import '../config/env.js';
import bcrypt from 'bcryptjs';
import { repos } from '../repositories/repos.js';
import { USER_ROLES, USER_STATUS } from '../config/constants.js';

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@spks.com').toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123';
const passwordHash = await bcrypt.hash(password, 10);
const profile = {
  firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.SEED_ADMIN_LAST_NAME || 'User',
  email,
  passwordHash,
  role: USER_ROLES.ADMIN,
  status: USER_STATUS.ACTIVE
};

const existing = await repos.users.findOne({ email });
const admin = existing
  ? await repos.users.update(existing.id, profile)
  : await repos.users.create(profile);

try {
  const staff = await repos.admins.findOne({ userId: admin.id });
  if (staff) {
    await repos.admins.update(staff.id, { role: USER_ROLES.ADMIN });
  } else {
    await repos.admins.create({ userId: admin.id, role: USER_ROLES.ADMIN });
  }
} catch (error) {
  console.warn(`Admin profile row not created: ${error.message}`);
}

try {
  const settings = await repos.userSettings.findOne({ userId: admin.id });
  if (!settings) await repos.userSettings.create({ userId: admin.id });
} catch {
  // Settings table is optional on the live database.
}

console.log(`${existing ? 'Updated' : 'Created'} admin ${email}`);
process.exit(0);
