import { supabaseAdmin } from './supabaseClient.js';

const count = async (table, filters = {}) => {
  let query = supabaseAdmin.from(table).select('id', { count: 'exact', head: true });
  Object.entries(filters).forEach(([key, value]) => {
    query = query.eq(key, value);
  });
  const { count: total, error } = await query;
  if (error) throw error;
  return total || 0;
};

const sum = (rows, field) => rows.reduce((total, row) => total + Number(row[field] || 0), 0);

export class AnalyticsService {
  async overview() {
    const [users, staff, courses, tests, payments] = await Promise.all([
      count('users', { role: 'user' }),
      count('users', { role: 'admin' }),
      count('courses'),
      count('tests'),
      supabaseAdmin.from('payments').select('amount, status')
    ]);

    const paid = (payments.data || []).filter((row) => row.status === 'paid');

    return {
      users,
      staff,
      courses,
      tests,
      paidPayments: paid.length,
      revenue: sum(paid, 'amount')
    };
  }

  async users() {
    const [total, active, blocked] = await Promise.all([
      count('users', { role: 'user' }),
      count('users', { role: 'user', status: 'active' }),
      count('users', { role: 'user', status: 'blocked' })
    ]);
    return { total, active, blocked };
  }

  async courses() {
    const [total, active] = await Promise.all([
      count('courses'),
      count('courses', { is_active: true })
    ]);
    return { total, active };
  }

  async tests() {
    const [total, published, attempts] = await Promise.all([
      count('tests'),
      count('tests', { is_published: true }),
      count('test_attempts')
    ]);
    return { total, published, attempts };
  }

  async revenue() {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('amount, status, created_at');
    if (error) throw error;

    const paid = (data || []).filter((row) => row.status === 'paid');
    return {
      totalRevenue: sum(paid, 'amount'),
      paidCount: paid.length,
      failedCount: (data || []).filter((row) => row.status === 'failed').length
    };
  }
}

export default new AnalyticsService();
