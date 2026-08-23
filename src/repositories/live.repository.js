import { randomUUID } from 'crypto';
import { supabaseAdmin } from '../services/supabaseClient.js';
import { BaseRepository } from './base.repository.js';

const missing = (error) => {
  const message = error?.message || '';
  return (
    message.includes('schema cache')
    || message.includes('Could not find the table')
    || message.includes('does not exist')
  );
};

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
  }

  toDb(payload) {
    const row = {};
    if (payload.email !== undefined) row.email = payload.email;
    if (payload.phone !== undefined) row.phone = payload.phone;
    if (payload.passwordHash !== undefined) row.password_hash = payload.passwordHash;
    if (payload.firstName !== undefined || payload.lastName !== undefined || payload.fullName !== undefined) {
      row.full_name = payload.fullName
        || [payload.firstName, payload.lastName].filter(Boolean).join(' ').trim()
        || 'User';
    }
    if (payload.profileImage !== undefined || payload.profileImageUrl !== undefined) {
      row.profile_image_url = payload.profileImage || payload.profileImageUrl || null;
    }
    if (payload.status !== undefined) row.status = payload.status;
    if (payload.lastLoginAt !== undefined) row.last_login_at = payload.lastLoginAt;
    if (payload.emailVerified !== undefined) row.email_verified = payload.emailVerified;
    return row;
  }

  fromDb(row) {
    if (!row) return null;
    const names = splitName(row.fullName);
    return {
      ...row,
      firstName: row.firstName || names.firstName,
      lastName: row.lastName || names.lastName,
      profileImage: row.profileImage || row.profileImageUrl || null,
      role: row.role || 'user',
      state: row.state || null
    };
  }

  map(row) {
    return this.fromDb(super.map(row));
  }

  async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(this.toDb(payload))
      .select('*')
      .single();

    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async update(id, payload) {
    const updates = this.toDb(payload);
    if (payload.firstName !== undefined || payload.lastName !== undefined) {
      const current = await this.findById(id);
      const firstName = payload.firstName !== undefined ? payload.firstName : current?.firstName;
      const lastName = payload.lastName !== undefined ? payload.lastName : current?.lastName;
      updates.full_name = [firstName, lastName].filter(Boolean).join(' ').trim() || current?.fullName || 'User';
    }

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw this.wrap(error);
    return this.map(data);
  }
}

export class CoursesRepository extends BaseRepository {
  constructor() {
    super('courses');
  }

  map(row) {
    const course = super.map(row);
    if (!course) return null;
    return {
      ...course,
      imageUrl: course.imageUrl || course.thumbnailUrl || null,
      icon: course.icon || null,
      isActive: course.isActive ?? course.isPublished ?? false
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
    if (payload.isActive !== undefined || payload.isPublished !== undefined) {
      row.is_published = payload.isActive ?? payload.isPublished;
    }
    if (payload.displayOrder !== undefined) row.display_order = payload.displayOrder;
    return row;
  }

  async findMany(options = {}) {
    return super.findMany({
      ...options,
      filters: this.toFilters(options.filters)
    });
  }

  async create(payload) {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .insert(this.toDb(payload))
      .select('*')
      .single();
    if (error) throw this.wrap(error);
    return this.map(data);
  }

  async update(id, payload) {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(this.toDb(payload))
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw this.wrap(error);
    return this.map(data);
  }
}

export class MemoryFallbackRepository extends BaseRepository {
  constructor(table, seed = []) {
    super(table);
    this.rows = seed.map((row) => ({ ...row }));
  }

  async findById(id, select = '*') {
    try {
      return await super.findById(id, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.rows.find((row) => row.id === id) || null;
    }
  }

  async findOne(filters, select = '*') {
    try {
      return await super.findOne(filters, select);
    } catch (error) {
      if (!missing(error)) throw error;
      return this.rows.find((row) => Object.entries(filters).every(([key, value]) => row[key] === value)) || null;
    }
  }

  async findMany(options = {}) {
    try {
      return await super.findMany(options);
    } catch (error) {
      if (!missing(error)) throw error;
      const { filters = {}, page = 1, limit = 20, search, searchFields = [] } = options;
      let items = this.rows.filter((row) => (
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
      return row;
    }
  }

  async update(id, payload, select = '*') {
    try {
      return await super.update(id, payload, select);
    } catch (error) {
      if (!missing(error)) throw error;
      const row = this.rows.find((item) => item.id === id);
      if (!row) return null;
      Object.assign(row, payload, { updatedAt: new Date().toISOString() });
      return row;
    }
  }

  async remove(id) {
    try {
      return await super.remove(id);
    } catch (error) {
      if (!missing(error)) throw error;
      this.rows = this.rows.filter((row) => row.id !== id);
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

export const DEFAULT_FAQS = [
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', question: 'How do I start a test?', answer: 'Open Tests, choose a paper, and tap Start.', category: 'tests', displayOrder: 1, isPublished: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', question: 'How do subscriptions work?', answer: 'Pick a plan and complete payment to unlock premium content.', category: 'payments', displayOrder: 2, isPublished: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3', question: 'Can I reset my password?', answer: 'Use Forgot Password on the login screen.', category: 'account', displayOrder: 3, isPublished: true }
];
