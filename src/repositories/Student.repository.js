import { supabaseAdmin } from '../services/supabaseClient.js';
import { Student } from '../models/Student.model.js';
import { PAGINATION } from '../config/constants.js';

export class StudentRepository {
  async create(studentData) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .insert({
        email: studentData.email,
        password_hash: studentData.passwordHash,
        full_name: studentData.fullName,
        phone: studentData.phone,
        date_of_birth: studentData.dateOfBirth,
        gender: studentData.gender,
        address: studentData.address,
        roll_number: studentData.rollNumber,
        institution: studentData.institution,
        course: studentData.course,
        semester: studentData.semester
      })
      .select('*')
      .single();

    if (error) throw error;
    return Student.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Student.fromDB(data) : null;
  }

  async findByEmail(email) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data ? Student.fromDB(data) : null;
  }

  async findByRollNumber(rollNumber) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('roll_number', rollNumber)
      .single();

    if (error) return null;
    return data ? Student.fromDB(data) : null;
  }

  async findAll(filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('students')
      .select('*', { count: 'exact' });

    if (filters.search) {
      query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,roll_number.ilike.%${filters.search}%`);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.institution) {
      query = query.ilike('institution', `%${filters.institution}%`);
    }
    if (filters.course) {
      query = query.ilike('course', `%${filters.course}%`);
    }
    if (filters.semester) {
      query = query.eq('semester', filters.semester);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      students: data.map(item => Student.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async update(id, studentData) {
    const updateData = {};
    if (studentData.fullName !== undefined) updateData.full_name = studentData.fullName;
    if (studentData.phone !== undefined) updateData.phone = studentData.phone;
    if (studentData.dateOfBirth !== undefined) updateData.date_of_birth = studentData.dateOfBirth;
    if (studentData.gender !== undefined) updateData.gender = studentData.gender;
    if (studentData.address !== undefined) updateData.address = studentData.address;
    if (studentData.rollNumber !== undefined) updateData.roll_number = studentData.rollNumber;
    if (studentData.institution !== undefined) updateData.institution = studentData.institution;
    if (studentData.course !== undefined) updateData.course = studentData.course;
    if (studentData.semester !== undefined) updateData.semester = studentData.semester;
    if (studentData.isActive !== undefined) updateData.is_active = studentData.isActive;
    if (studentData.emailVerified !== undefined) updateData.email_verified = studentData.emailVerified;
    if (studentData.lastLoginAt !== undefined) updateData.last_login_at = studentData.lastLoginAt;

    const { data, error } = await supabaseAdmin
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return Student.fromDB(data);
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('students')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async updateLastLogin(id) {
    const { data, error } = await supabaseAdmin
      .from('students')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;
    return Student.fromDB(data);
  }

  async getStats() {
    const { data, error } = await supabaseAdmin
      .from('students')
      .select('id, is_active');

    if (error) throw error;

    return {
      total: data.length,
      active: data.filter(s => s.is_active).length,
      inactive: data.filter(s => !s.is_active).length
    };
  }
}

export default new StudentRepository();
