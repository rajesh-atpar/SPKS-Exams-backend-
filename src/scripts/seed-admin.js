import '../config/env.js';
import bcrypt from 'bcrypt';
import { repos } from '../repositories/repos.js';

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@spks.com').toLowerCase();
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin123';

const existing = await repos.users.findOne({ email });
if (existing) {
  console.log(`Admin already exists: ${email}`);
  process.exit(0);
}

const admin = await repos.users.create({
  firstName: process.env.SEED_ADMIN_FIRST_NAME || 'Admin',
  lastName: process.env.SEED_ADMIN_LAST_NAME || 'User',
  email,
  passwordHash: await bcrypt.hash(password, 10),
  role: 'admin',
  status: 'active'
});

await repos.userSettings.create({ userId: admin.id });
console.log(`Created admin ${email}`);
process.exit(0);
