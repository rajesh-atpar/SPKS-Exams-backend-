import bcrypt from 'bcrypt';
import { repos } from '../repositories/repos.js';
import { USER_ROLES, USER_STATUS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { omit } from '../utils/case.js';
import { conflict, notFound } from '../utils/errors.js';
import fileService from './file.service.js';

const publicUser = (user) => omit(user, ['passwordHash', 'password', 'hashedPassword']);

export class UserService {
  async getMe(userId) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');
    try {
      const student = await repos.students.findOne({ userId });
      if (student?.state) user.state = student.state;
    } catch {
      // Optional on the live schema.
    }
    return publicUser(user);
  }

  async updateMe(userId, payload) {
    const allowed = ['firstName', 'lastName', 'phone', 'state'];
    const updates = Object.fromEntries(
      Object.entries(payload).filter(([key, value]) => allowed.includes(key) && value !== undefined)
    );

    if (updates.phone) {
      const existing = await repos.users.findOne({ phone: updates.phone });
      if (existing && existing.id !== userId) throw conflict('Phone number is already registered');
    }

    const user = publicUser(await repos.users.update(userId, updates));
    if (updates.state) {
      try {
        const student = await repos.students.findOne({ userId });
        if (student) await repos.students.update(student.id, { state: updates.state });
      } catch {
        // Live students table is optional for profile edits.
      }
      user.state = updates.state;
    }
    return user;
  }

  async uploadProfileImage(userId, file) {
    const uploaded = await fileService.uploadProfileImage(file);
    return publicUser(await repos.users.update(userId, { profileImage: uploaded.url }));
  }

  async deleteProfileImage(userId) {
    return publicUser(await repos.users.update(userId, { profileImage: null }));
  }

  async getSettings(userId) {
    let settings = await repos.userSettings.findOne({ userId });
    if (!settings) {
      settings = await repos.userSettings.create({
        userId,
        language: 'en',
        notificationsEnabled: true,
        emailNotifications: true,
        pushNotifications: true,
        darkMode: false
      });
    }
    return settings;
  }

  async updateSettings(userId, payload) {
    const settings = await this.getSettings(userId);
    const allowed = ['language', 'notificationsEnabled', 'emailNotifications', 'pushNotifications', 'darkMode'];
    const updates = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowed.includes(key))
    );
    return repos.userSettings.update(settings.id, updates);
  }

  async deleteAccount(userId) {
    await repos.users.update(userId, { status: USER_STATUS.DELETED });
    return { message: 'Account deleted' };
  }

  async listUsers(query, { staffOnly = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.role) filters.role = query.role;
    if (query.status) filters.status = query.status;
    if (query.state) filters.state = query.state;
    if (staffOnly && !query.role) {
      return repos.users.findMany({
        page,
        limit,
        search: query.search,
        searchFields: ['full_name', 'email', 'phone'],
        inFilters: { role: [USER_ROLES.ADMIN, USER_ROLES.EDITOR, USER_ROLES.SUPPORT] }
      }).then(({ items, total }) => ({
        items: items.map(publicUser),
        total,
        page,
        limit
      }));
    }

    const { items, total } = await repos.users.findMany({
      filters,
      page,
      limit,
      search: query.search,
      searchFields: ['full_name', 'email', 'phone']
    });

    return { items: items.map(publicUser), total, page, limit };
  }

  async getUser(userId) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');
    return publicUser(user);
  }

  async createStaff(payload) {
    const existing = await repos.users.findOne({ email: payload.email.toLowerCase() });
    if (existing) throw conflict('Email is already registered');

    const user = await repos.users.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      email: payload.email.toLowerCase(),
      phone: payload.phone || null,
      passwordHash: await bcrypt.hash(payload.password, 10),
      state: payload.state || null,
      role: payload.role || USER_ROLES.ADMIN,
      status: USER_STATUS.ACTIVE
    });
    await repos.userSettings.create({ userId: user.id });
    try {
      await repos.admins.create({ userId: user.id, role: user.role });
    } catch {
      // Live admins table is optional.
    }
    return publicUser(user);
  }

  async updateUser(userId, payload) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');

    const allowed = ['firstName', 'lastName', 'phone', 'state', 'role', 'profileImage'];
    const updates = Object.fromEntries(
      Object.entries(payload).filter(([key]) => allowed.includes(key))
    );
    return publicUser(await repos.users.update(userId, updates));
  }

  async updateStatus(userId, status) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');
    return publicUser(await repos.users.update(userId, { status }));
  }

  async deleteUser(userId) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');
    await repos.users.remove(userId);
    return { message: 'User deleted' };
  }

  async saveDeviceToken(userId, token, platform = 'android') {
    const existing = await repos.deviceTokens.findOne({ userId, token });
    if (existing) return existing;
    return repos.deviceTokens.create({ userId, token, platform });
  }

  async removeDeviceToken(userId, token) {
    const existing = await repos.deviceTokens.findOne({ userId, token });
    if (existing) await repos.deviceTokens.remove(existing.id);
    return { message: 'Device token removed' };
  }
}

export default new UserService();
