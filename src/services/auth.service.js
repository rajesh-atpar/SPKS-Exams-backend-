import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { repos } from '../repositories/repos.js';
import { JWT_CONFIG, STAFF_ROLES, USER_ROLES, USER_STATUS } from '../config/constants.js';
import { omit } from '../utils/case.js';
import { conflict, forbidden, notFound, unauthorized } from '../utils/errors.js';
import logger from '../config/logger.js';
import emailService from './email.service.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const parseDuration = (value) => {
  const match = String(value).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = Number(match[1]);
  const unit = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]];
  return amount * unit;
};

const publicUser = (user) => omit(user, ['passwordHash']);

const isUsableStatus = (status) => {
  const value = String(status || 'active').toLowerCase();
  return !['inactive', 'blocked', 'deleted', 'banned', 'suspended'].includes(value);
};

const hydrateUser = async (user) => {
  if (!user) return null;

  try {
    const admin = await repos.admins.findOne({ userId: user.id });
    if (admin) user.role = admin.role || 'admin';
  } catch {
    user.role = user.role || 'user';
  }

  try {
    const student = await repos.students.findOne({ userId: user.id });
    if (student?.state) user.state = student.state;
  } catch {
    // Live students table may use different columns; profile still works.
  }

  return user;
};

export class AuthService {
  generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, role: user.role, type: 'access' },
      JWT_SECRET,
      { expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY }
    );
  }

  async createRefreshToken(userId) {
    const token = crypto.randomBytes(48).toString('hex');
    await repos.refreshTokens.create({
      userId,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + parseDuration(JWT_CONFIG.REFRESH_TOKEN_EXPIRY)).toISOString()
    });
    return token;
  }

  async issueTokens(user) {
    return {
      user: publicUser(user),
      accessToken: this.generateAccessToken(user),
      refreshToken: await this.createRefreshToken(user.id)
    };
  }

  async register(payload) {
    const existingEmail = await repos.users.findOne({ email: payload.email.toLowerCase() });
    if (existingEmail) throw conflict('Email is already registered');

    if (payload.phone) {
      const existingPhone = await repos.users.findOne({ phone: payload.phone });
      if (existingPhone) throw conflict('Phone number is already registered');
    }

    const user = await repos.users.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.toLowerCase(),
      phone: payload.phone || null,
      passwordHash: await bcrypt.hash(payload.password, 10),
      profileImage: payload.profileImage || null,
      status: USER_STATUS.ACTIVE
    });

    user.role = USER_ROLES.USER;
    user.state = payload.state || null;

    try {
      await repos.students.create({
        userId: user.id,
        state: payload.state || null
      });
    } catch (error) {
      logger.warn(`Student profile row not created: ${error.message}`);
    }

    try {
      await repos.userSettings.create({ userId: user.id });
    } catch {
      // Settings table is optional on the live database.
    }

    return this.issueTokens(user);
  }

  async login(email, password, { staffOnly = false, appOnly = false } = {}) {
    const user = await repos.users.findOne({ email: email.toLowerCase() });
    if (!user) throw unauthorized('Invalid credentials');

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw unauthorized('Invalid credentials');

    if (!isUsableStatus(user.status)) {
      throw forbidden('Account is not active');
    }

    await hydrateUser(user);

    if (staffOnly && !STAFF_ROLES.includes(user.role)) {
      throw forbidden('Admin access required');
    }

    if (appOnly && user.role !== USER_ROLES.USER) {
      throw forbidden('Use the admin login for staff accounts');
    }

    await repos.users.update(user.id, { lastLoginAt: new Date().toISOString() });
    return this.issueTokens(user);
  }

  async refresh(refreshToken) {
    const record = await repos.refreshTokens.findOne({ tokenHash: hashToken(refreshToken) });
    if (!record || record.revokedAt || new Date(record.expiresAt) < new Date()) {
      throw unauthorized('Invalid or expired refresh token');
    }

    const user = await repos.users.findById(record.userId);
    if (!user || user.status !== USER_STATUS.ACTIVE) {
      throw unauthorized('User not found');
    }

    await repos.refreshTokens.update(record.id, { revokedAt: new Date().toISOString() });
    return this.issueTokens(user);
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      const record = await repos.refreshTokens.findOne({ tokenHash: hashToken(refreshToken) });
      if (record && record.userId === userId) {
        await repos.refreshTokens.update(record.id, { revokedAt: new Date().toISOString() });
      }
    }
    return { message: 'Logout successful' };
  }

  async me(userId) {
    const user = await hydrateUser(await repos.users.findById(userId));
    if (!user) throw notFound('User');
    return publicUser(user);
  }

  async forgotPassword(email) {
    const user = await repos.users.findOne({ email: email.toLowerCase() });
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent' };
    }

    const token = crypto.randomBytes(32).toString('hex');
    await repos.passwordResets.create({
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + parseDuration(JWT_CONFIG.RESET_TOKEN_EXPIRY)).toISOString()
    });

    try {
      await emailService.sendPasswordResetEmail(user.email, token);
    } catch (error) {
      logger.warn(`Password reset email not sent: ${error.message}`);
    }

    if (process.env.NODE_ENV !== 'production') {
      logger.info(`Password reset token for ${email}: ${token}`);
    }

    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token, password) {
    const record = await repos.passwordResets.findOne({ tokenHash: hashToken(token) });
    if (!record || record.usedAt || new Date(record.expiresAt) < new Date()) {
      throw unauthorized('Invalid or expired reset token');
    }

    await repos.users.update(record.userId, {
      passwordHash: await bcrypt.hash(password, 10)
    });
    await repos.passwordResets.update(record.id, { usedAt: new Date().toISOString() });
    return { message: 'Password reset successful' };
  }
}

export default new AuthService();
