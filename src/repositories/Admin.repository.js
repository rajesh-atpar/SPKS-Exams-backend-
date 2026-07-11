import { supabaseAdmin } from '../services/supabaseClient.js';
import { Admin } from '../models/Admin.model.js';
import { PAGINATION } from '../config/constants.js';

export class AdminRepository {
  async create(adminData) {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .insert({
        email: adminData.email,
        password_hash: adminData.passwordHash,
        full_name: adminData.fullName,
        phone: adminData.phone,
        role_id: adminData.roleId,
        is_super_admin: adminData.isSuperAdmin || false
      })
      .select('*, roles(*)')
      .single();

    if (error) throw error;
    return Admin.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*, roles(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Admin.fromDB(data) : null;
  }

  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .select('*, roles(*)')
      .eq('email', email)
      .single();

    if (error) return null;
    return data ? Admin.fromDB(data) : null;
  }

  async findAll(filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('admins')
      .select('*, roles(*)', { count: 'exact' });

    if (filters.search) {
      query = query.ilike('full_name', `%${filters.search}%`);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.roleId) {
      query = query.eq('role_id', filters.roleId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      admins: data.map(item => Admin.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async update(id, adminData) {
    const updateData = {};
    if (adminData.fullName !== undefined) updateData.full_name = adminData.fullName;
    if (adminData.phone !== undefined) updateData.phone = adminData.phone;
    if (adminData.roleId !== undefined) updateData.role_id = adminData.roleId;
    if (adminData.isActive !== undefined) updateData.is_active = adminData.isActive;
    if (adminData.lastLoginAt !== undefined) updateData.last_login_at = adminData.lastLoginAt;

    const { data, error } = await supabaseAdmin
      .from('admins')
      .update(updateData)
      .eq('id', id)
      .select('*, roles(*)')
      .single();

    if (error) throw error;
    return Admin.fromDB(data);
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async updateLastLogin(id) {
    const { data, error } = await supabaseAdmin
      .from('admins')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, roles(*)')
      .single();

    if (error) throw error;
    return Admin.fromDB(data);
  }
}

export default new AdminRepository();
