import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { toSnake } from '../utils/case.js';
import { BaseRepository } from './base.repository.js';
import { readStore, writeStore } from './file-store.js';

const missing = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`;
  return (
    message.includes('schema cache')
    || message.includes('Could not find the table')
    || message.includes('Missing database table')
    || message.includes('does not exist')
  );
};

const missingColumn = (error) => {
  const message = `${error?.message || ''} ${error?.cause?.message || ''}`;
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] || null;
};

const isBcryptHash = (value) => typeof value === 'string' && /^\$2[aby]\$/.test(value);

const splitName = (fullName = '') => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' ')
  };
};

export class UsersRepository extends BaseRepository {
  constructor() {
    super('users');
    this.rows = readStore('users');
  }

  persist() {
    writeStore('users', this.rows);
  }

  loadLocal() {
    this.rows = readStore('users');
    return this.rows;
  }

  toDb(payload) {
    const row = {};
    if (payload.email !== undefined) row.email = payload.email;
    if (payload.phone !== undefined) row.phone = payload.phone;
    if (payload.passwordHash !== undefined) {
      row.password_hash = payload.passwordHash;
      row.password = payload.passwordHash;
    }
    if (payload.firstName !== undefined) row.first_name = payload.firstName;
    if (payload.lastName !== undefined) row.last_name = payload.lastName;
    if (payload.firstName !== undefined || payload.lastName !== undefined) {
      const fullName = [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim();
      if (fullName) row.full_name = fullName;
    }
    if (payload.profileImage !== undefined || payload.profileImageUrl !== undefined) {
      row.profile_image = payload.profileImage || payload.profileImageUrl || null;
      row.profile_image_url = payload.profileImage || payload.profileImageUrl || null;
    }
    if (payload.state !== undefined) row.state = payload.state;
    if (payload.role !== undefined) row.role = payload.role;
    if (payload.status !== undefined) row.status = payload.status;
    if (payload.lastLoginAt !== undefined) row.last_login_at = payload.lastLoginAt;
    return row;
  }

  fromDb(row) {
    if (!row) return null;
    const names = splitName(row.fullName);
    const passwordHash = [row.passwordHash, row.hashedPassword, row.password]
      .find((value) => isBcryptHash(value)) || row.passwordHash || null;
    const rest = { ...row };
    delete rest.password;
    delete rest.hashedPassword;
    return {
      ...rest,
      firstName: row.firstName || names.firstName,
      lastName: row.lastName || names.lastName,
      profileImage: row.profileImage || row.profileImageUrl || null,
      role: row.role || 'user',
      state: row.state || null,
      passwordHash
    };
  }

  map(row) {
    return this.fromDb(super.map(row));
  }

  localUser(payload) {
    return this.map({
      id: payload.id || randomUUID(),
      firstName: payload.firstName || '',
      lastName: payload.lastName || '',
      email: payload.email,
      phone: payload.phone || null,
      passwordHash: payload.passwordHash,
      profileImage: payload.profileImage || payload.profileImageUrl || null,
      state: payload.state || null,
      role: payload.role || 'user',
      status: payload.status || 'active',
      lastLoginAt: payload.lastLoginAt || null,
      createdAt: payload.createdAt || new Date().toISOString(),
      updatedAt: payload.updatedAt || new Date().toISOString()
    });
  }

  matchesLocal(row, filters = {}) {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === '') return true;
      if (key === 'email') {
        return String(row.email || '').toLowerCase() === String(value).toLowerCase();
      }
      return row[key] === value;
    });
  }

  findLocal(filters = {}) {
    return this.loadLocal().find((row) => this.matchesLocal(row, filters)) || null;
  }

  upsertLocal(user) {
    if (!user?.id && !user?.email) return;
    this.loadLocal();
    const index = this.rows.findIndex((row) => row.id === user.id || this.matchesLocal(row, { email: user.email }));
    const next = this.localUser({
      ...(index >= 0 ? this.rows[index] : {}),
      ...user,
      passwordHash: user.passwordHash || (index >= 0 ? this.rows[index].passwordHash : null)
    });
    if (index >= 0) this.rows[index] = next;
    else this.rows.push(next);
    this.persist();
    return next;
  }

  mergeLocalHash(user, filters = {}) {
    if (!user) return this.findLocal(filters);
    if (isBcryptHash(user.passwordHash)) return user;
    const local = this.findLocal(user.id ? { id: user.id } : filters)
      || (user.email ? this.findLocal({ email: user.email }) : null)
      || this.findLocal(filters);
    if (!local) return user;
    return {
      ...user,
      passwordHash: local.passwordHash || user.passwordHash,
      role: user.role && user.role !== 'user' ? user.role : (local.role || user.role)
    };
  }

  async writeRow(payload, id) {
    const row = this.toDb(payload);

    for (let attempt = 0; attempt < 12; attempt += 1) {
      const query = id
        ? supabaseAdmin.from(this.table).update(row).eq('id', id)
        : supabaseAdmin.from(this.table).insert(row);
      const { data, error } = await query.select('*').single();

      if (!error) {
        const mapped = this.map(data) || {};
        if (!mapped.passwordHash && payload.passwordHash) mapped.passwordHash = payload.passwordHash;
        return mapped;
      }

      const column = missingColumn(error);
      if (column && Object.prototype.hasOwnProperty.call(row, column)) {
        delete row[column];
        continue;
      }

      if (missing(error)) return null;
      throw this.wrap(error);
    }

    return null;
  }

  async findById(id, select = '*') {
    try {
      const user = await super.findById(id, select);
      return this.mergeLocalHash(user, { id });
    } catch (error) {
      if (!missing(error)) throw error;
      return this.loadLocal().find((row) => row.id === id) || null;
    }
  }

  async findOne(filters, select = '*') {
    try {
      let query = supabaseAdmin.from(this.table).select(select);
      Object.entries(toSnake(filters)).forEach(([key, value]) => {
        query = key === 'email' ? query.ilike('email', value) : query.eq(key, value);
      });
      const { data, error } = await query.maybeSingle();
      if (error) {
        if (!missing(error)) throw this.wrap(error);
      } else {
        return this.mergeLocalHash(this.map(data), filters);
      }
    } catch (error) {
      if (!missing(error)) throw error;
    }
    return this.findLocal(filters);
  }

  async findMany(options = {}) {
    try {
      return await super.findMany(options);
    } catch (error) {
      if (!missing(error)) throw error;
      const { filters = {}, page = 1, limit = 20, search, searchFields = [] } = options;
      let items = this.loadLocal().filter((row) => this.matchesLocal(row, filters));
      if (search && searchFields.length) {
        const term = String(search).toLowerCase();
        items = items.filter((row) => searchFields.some((field) => String(row[field] || '').toLowerCase().includes(term)));
      }
      return { items: items.slice((page - 1) * limit, page * limit), total: items.length };
    }
  }

  async create(payload) {
    try {
      const created = await this.writeRow(payload);
      if (created) {
        return this.upsertLocal({ ...created, ...payload, passwordHash: created.passwordHash || payload.passwordHash });
      }
    } catch (error) {
      if (!missing(error)) throw error;
    }

    const row = this.localUser(payload);
    this.upsertLocal(row);
    return row;
  }

  async update(id, payload) {
    try {
      const updated = await this.writeRow(payload, id);
      if (updated) {
        return this.upsertLocal({ ...updated, ...payload, id, passwordHash: updated.passwordHash || payload.passwordHash });
      }
    } catch (error) {
      if (!missing(error)) throw error;
    }

    this.loadLocal();
    const row = this.rows.find((item) => item.id === id);
    if (!row) {
      return this.upsertLocal({ id, ...payload });
    }
    Object.assign(row, payload, { updatedAt: new Date().toISOString() });
    this.persist();
    return this.map(row);
  }

  async remove(id) {
    try {
      await super.remove(id);
    } catch (error) {
      if (!missing(error)) throw error;
    }
    this.loadLocal();
    this.rows = this.rows.filter((row) => row.id !== id);
    this.persist();
    return true;
  }
}

export class CoursesRepository extends BaseRepository {
  constructor() {
    super('courses');
    this.rows = null;
  }

  localRows() {
    if (!this.rows) this.rows = DEFAULT_COURSES.map((row) => ({ ...row }));
    return this.rows;
  }

  map(row) {
    const course = super.map(row);
    if (!course) return null;
    return {
      ...course,
      imageUrl: course.imageUrl || course.thumbnailUrl || null,
      icon: course.icon || null,
      isActive: course.isActive ?? course.isPublished ?? true
    };
  }

  toFilters(filters = {}) {
    const next = { ...filters };
    if (next.isActive !== undefined) {
      next.isPublished = next.isActive;
      delete next.isActive;
    }
    return next;
  }

  toDb(payload) {
    const row = {};
    if (payload.name !== undefined) row.name = payload.name;
    if (payload.slug !== undefined) row.slug = payload.slug;
    if (payload.description !== undefined) row.description = payload.description;
    if (payload.imageUrl !== undefined || payload.thumbnailUrl !== undefined) {
      row.thumbnail_url = payload.imageUrl || payload.thumbnailUrl || null;
    }
    if (payload.icon !== undefined) row.icon = payload.icon;
    if (payload.isActive !== undefined || payload.isPublished !== undefined) {
      row.is_published = payload.isActive ?? payload.isPublished;
    }
    if (payload.displayOrder !== undefined) row.display_order = payload.displayOrder;
    return row;
  }

  matchesLocal(row, filters = {}) {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null || value === '') return true;
      if (key === 'isActive' || key === 'isPublished') {
        return row.isActive === value || row.isPublished === value;
      }
      return row[key] === value;
    });
  }

  async findById(id, select = '*') {
    try {
      return await super.findById(id, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.localRows().find((row) => row.id === id || row.slug === id) || null;
    }
  }

  async findOne(filters, select = '*') {
    try {
      return await super.findOne(filters, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.localRows().find((row) => this.matchesLocal(row, filters)) || null;
    }
  }

  async findMany(options = {}) {
    try {
      return await super.findMany({
        ...options,
        filters: this.toFilters(options.filters)
      });
    } catch (error) {
      if (!missing(error)) throw error;
      const { filters = {}, page = 1, limit = 20, search, searchFields = ['name'] } = options;
      let items = this.localRows().filter((row) => this.matchesLocal(row, filters));
      if (search && searchFields.length) {
        const term = String(search).toLowerCase();
        items = items.filter((row) => searchFields.some((field) => String(row[field] || '').toLowerCase().includes(term)));
      }
      return { items: items.slice((page - 1) * limit, page * limit), total: items.length };
    }
  }

  async create(payload) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.table)
        .insert(this.toDb(payload))
        .select('*')
        .single();
      if (!error) return this.map(data);
      if (!missing(error)) throw this.wrap(error);
    } catch (error) {
      if (!missing(error)) throw error;
    }

    const row = this.map({
      id: randomUUID(),
      isActive: true,
      displayOrder: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...payload
    });
    this.localRows().push(row);
    return row;
  }

  async update(id, payload) {
    try {
      const { data, error } = await supabaseAdmin
        .from(this.table)
        .update(this.toDb(payload))
        .eq('id', id)
        .select('*')
        .single();
      if (!error) return this.map(data);
      if (!missing(error)) throw this.wrap(error);
    } catch (error) {
      if (!missing(error)) throw error;
    }

    const row = this.localRows().find((item) => item.id === id);
    if (!row) return null;
    Object.assign(row, payload, { updatedAt: new Date().toISOString() });
    return this.map(row);
  }

  async remove(id) {
    try {
      return await super.remove(id);
    } catch (error) {
      if (!missing(error)) throw error;
    }
    this.rows = this.localRows().filter((row) => row.id !== id);
    return true;
  }
}

export class MemoryFallbackRepository extends BaseRepository {
  constructor(table, seed = [], { persist = false } = {}) {
    super(table);
    this.persistToDisk = persist;
    const stored = persist ? readStore(table) : [];
    this.rows = stored.length ? stored : seed.map((row) => ({ ...row }));
  }

  loadLocal() {
    if (this.persistToDisk) this.rows = readStore(this.table);
    return this.rows;
  }

  persist() {
    if (this.persistToDisk) writeStore(this.table, this.rows);
  }

  async findById(id, select = '*') {
    try {
      return await super.findById(id, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.loadLocal().find((row) => row.id === id) || null;
    }
  }

  async findOne(filters, select = '*') {
    try {
      return await super.findOne(filters, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.loadLocal().find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) || null;
    }
  }

  async findMany(options = {}) {
    try {
      return await super.findMany(options);
    } catch (error) {
      if (!missing(error)) throw error;
      const { filters = {}, page = 1, limit = 20, search, searchFields = [] } = options;
      let items = this.loadLocal().filter((row) => (
        Object.entries(filters).every(([key, value]) => value === undefined || value === '' || row[key] === value)
      ));
      if (search && searchFields.length) {
        const term = String(search).toLowerCase();
        items = items.filter((row) => searchFields.some((field) => String(row[field] || '').toLowerCase().includes(term)));
      }
      const total = items.length;
      return { items: items.slice((page - 1) * limit, page * limit), total };
    }
  }

  async create(payload) {
    try {
      return await super.create(payload);
    } catch (error) {
      if (!missing(error)) throw error;
      const row = { id: randomUUID(), ...payload, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      this.rows.push(row);
      this.persist();
      return row;
    }
  }

  async update(id, payload, select = '*') {
    try {
      return await super.update(id, payload, select);
    } catch (error) {
      const column = error?.missingColumn || missingColumn(error);
      if (column || /pdf_url|pdf_path|Missing database column/i.test(`${error?.message || ''} ${error?.cause?.message || ''}`)) {
        throw error;
      }
      if (!missing(error)) throw error;
      const row = this.rows.find((item) => item.id === id);
      if (!row) return null;
      Object.assign(row, payload, { updatedAt: new Date().toISOString() });
      this.persist();
      return row;
    }
  }

  async remove(id) {
    try {
      return await super.remove(id);
    } catch (error) {
      if (!missing(error)) throw error;
      this.rows = this.rows.filter((row) => row.id !== id);
      this.persist();
      return true;
    }
  }
}

export const DEFAULT_PLANS = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Free',
    price: 0,
    currency: 'INR',
    duration: 0,
    features: ['Limited tests', 'Daily current affairs'],
    courseAccess: [],
    isActive: true
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Monthly',
    price: 299,
    currency: 'INR',
    duration: 30,
    features: ['All courses', 'Unlimited tests', 'Premium notes'],
    courseAccess: ['all'],
    isActive: true
  },
  {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Yearly',
    price: 2499,
    currency: 'INR',
    duration: 365,
    features: ['All courses', 'Unlimited tests', 'Premium notes', 'Priority support'],
    courseAccess: ['all'],
    isActive: true
  }
];

export const DEFAULT_LEGAL = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', type: 'terms', title: 'Terms and Conditions', content: 'Update these terms from the admin panel.' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', type: 'privacy-policy', title: 'Privacy Policy', content: 'Update this privacy policy from the admin panel.' },
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3', type: 'refund-policy', title: 'Refund Policy', content: 'Update this refund policy from the admin panel.' }
];

export const DEFAULT_COURSES = [
  {
    id: '44444444-4444-4444-8444-444444444441',
    name: 'TNPSC',
    slug: 'tnpsc',
    description: 'Tamil Nadu Public Service Commission exam preparation',
    imageUrl: null,
    icon: 'book',
    isActive: true,
    displayOrder: 1
  },
  {
    id: '44444444-4444-4444-8444-444444444442',
    name: 'RRB',
    slug: 'rrb',
    description: 'Railway Recruitment Board exam preparation',
    imageUrl: null,
    icon: 'train',
    isActive: true,
    displayOrder: 2
  },
  {
    id: '44444444-4444-4444-8444-444444444443',
    name: 'TNUSRB',
    slug: 'tnusrb',
    description: 'Tamil Nadu Uniformed Services Recruitment Board',
    imageUrl: null,
    icon: 'shield',
    isActive: true,
    displayOrder: 3
  },
  {
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Current Affairs',
    slug: 'current-affairs',
    description: 'Daily, monthly, and exam-focused current affairs',
    imageUrl: null,
    icon: 'newspaper',
    isActive: true,
    displayOrder: 4
  }
];

export const DEFAULT_HELP_CONTACT_SETTING = {
  id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  key: 'help_contact',
  value: {
    phone: '+91 00000 00000',
    whatsapp: '+91 00000 00000',
    hours: 'Mon–Sat, 9:00 AM – 6:00 PM IST',
    email: 'support@spksexams.com',
    address: ''
  }
};

export const DEFAULT_FAQS = [
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', question: 'How do I start a test?', answer: 'Open Tests, choose a paper, and tap Start.', category: 'tests', displayOrder: 1, isPublished: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', question: 'How do subscriptions work?', answer: 'Pick a plan and complete payment to unlock premium content.', category: 'payments', displayOrder: 2, isPublished: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', question: 'Can I reset my password?', answer: 'Use Forgot Password on the login screen.', category: 'account', displayOrder: 3, isPublished: true }
];

export const DEFAULT_GROUPS = [
  { id: '55555555-5555-4555-8555-555555555501', courseId: '44444444-4444-4444-8444-444444444441', name: 'Group 1', slug: 'group-1', description: 'TNPSC Group 1 practice tests', isActive: true, displayOrder: 1 },
  { id: '55555555-5555-4555-8555-555555555502', courseId: '44444444-4444-4444-8444-444444444441', name: 'Group 2', slug: 'group-2', description: 'TNPSC Group 2 practice tests', isActive: true, displayOrder: 2 },
  { id: '55555555-5555-4555-8555-555555555503', courseId: '44444444-4444-4444-8444-444444444441', name: 'Group 3', slug: 'group-3', description: 'TNPSC Group 3 practice tests', isActive: true, displayOrder: 3 },
  { id: '55555555-5555-4555-8555-555555555504', courseId: '44444444-4444-4444-8444-444444444441', name: 'Group 4', slug: 'group-4', description: 'TNPSC Group 4 practice tests', isActive: true, displayOrder: 4 },
  { id: '55555555-5555-4555-8555-555555555505', courseId: '44444444-4444-4444-8444-444444444441', name: 'Others', slug: 'others', description: 'Other TNPSC practice tests', isActive: true, displayOrder: 5 },
  { id: '55555555-5555-4555-8555-555555555511', courseId: '44444444-4444-4444-8444-444444444442', name: 'Group D', slug: 'group-d', description: 'RRB Group D practice tests', isActive: true, displayOrder: 1 },
  { id: '55555555-5555-4555-8555-555555555512', courseId: '44444444-4444-4444-8444-444444444442', name: 'Others', slug: 'others', description: 'NTPC, JE and ALP practice tests', isActive: true, displayOrder: 2 },
  { id: '55555555-5555-4555-8555-555555555521', courseId: '44444444-4444-4444-8444-444444444443', name: 'SI', slug: 'si', description: 'TNUSRB Sub-Inspector practice tests', isActive: true, displayOrder: 1 },
  { id: '55555555-5555-4555-8555-555555555522', courseId: '44444444-4444-4444-8444-444444444443', name: 'PC', slug: 'pc', description: 'TNUSRB Police Constable practice tests', isActive: true, displayOrder: 2 }
];
