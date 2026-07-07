import { supabaseAdmin } from '../services/supabaseClient.js';
import { Subject } from '../models/Subject.model.js';
import { PAGINATION } from '../config/constants.js';

export class SubjectRepository {
  async create(subjectData) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .insert({
        name: subjectData.name,
        code: subjectData.code,
        description: subjectData.description,
        category: subjectData.category,
        created_by: subjectData.createdBy
      })
      .select('*')
      .single();

    if (error) throw error;
    return Subject.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Subject.fromDB(data) : null;
  }

  async findByCode(code) {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('code', code)
      .single();

    if (error) return null;
    return data ? Subject.fromDB(data) : null;
  }

  async findAll(filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('subjects')
      .select('*', { count: 'exact' });

    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.category) {
      query = query.ilike('category', `%${filters.category}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      subjects: data.map(item => Subject.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async update(id, subjectData) {
    const updateData = {};
    if (subjectData.name !== undefined) updateData.name = subjectData.name;
    if (subjectData.code !== undefined) updateData.code = subjectData.code;
    if (subjectData.description !== undefined) updateData.description = subjectData.description;
    if (subjectData.category !== undefined) updateData.category = subjectData.category;
    if (subjectData.isActive !== undefined) updateData.is_active = subjectData.isActive;

    const { data, error } = await supabaseAdmin
      .from('subjects')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return Subject.fromDB(data);
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getActiveSubjects() {
    const { data, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data.map(item => Subject.fromDB(item));
  }
}

export default new SubjectRepository();
