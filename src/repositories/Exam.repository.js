import { supabaseAdmin } from '../services/supabaseClient.js';
import { Exam } from '../models/Exam.model.js';
import { PAGINATION } from '../config/constants.js';

export class ExamRepository {
  async create(examData) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .insert({
        title: examData.title,
        description: examData.description,
        subject_id: examData.subjectId,
        duration_minutes: examData.durationMinutes,
        total_marks: examData.totalMarks,
        passing_marks: examData.passingMarks,
        passing_percentage: examData.passingPercentage,
        negative_marking: examData.negativeMarking,
        instructions: examData.instructions,
        start_date: examData.startDate,
        end_date: examData.endDate,
        is_published: examData.isPublished || false,
        allow_resume: examData.allowResume !== undefined ? examData.allowResume : true,
        shuffle_questions: examData.shuffleQuestions || false,
        show_results_immediately: examData.showResultsImmediately !== undefined ? examData.showResultsImmediately : true,
        max_attempts: examData.maxAttempts || 1,
        created_by: examData.createdBy
      })
      .select('*, subjects(*)')
      .single();

    if (error) throw error;
    return Exam.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, subjects(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Exam.fromDB(data) : null;
  }

  async findAll(filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('exams')
      .select('*, subjects(*)', { count: 'exact' });

    if (filters.search) {
      query = query.ilike('title', `%${filters.search}%`);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }
    if (filters.isPublished !== undefined) {
      query = query.eq('is_published', filters.isPublished);
    }
    if (filters.subjectId) {
      query = query.eq('subject_id', filters.subjectId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      exams: data.map(item => Exam.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async update(id, examData) {
    const updateData = {};
    if (examData.title !== undefined) updateData.title = examData.title;
    if (examData.description !== undefined) updateData.description = examData.description;
    if (examData.subjectId !== undefined) updateData.subject_id = examData.subjectId;
    if (examData.durationMinutes !== undefined) updateData.duration_minutes = examData.durationMinutes;
    if (examData.totalMarks !== undefined) updateData.total_marks = examData.totalMarks;
    if (examData.passingMarks !== undefined) updateData.passing_marks = examData.passingMarks;
    if (examData.passingPercentage !== undefined) updateData.passing_percentage = examData.passingPercentage;
    if (examData.negativeMarking !== undefined) updateData.negative_marking = examData.negativeMarking;
    if (examData.instructions !== undefined) updateData.instructions = examData.instructions;
    if (examData.startDate !== undefined) updateData.start_date = examData.startDate;
    if (examData.endDate !== undefined) updateData.end_date = examData.endDate;
    if (examData.isActive !== undefined) updateData.is_active = examData.isActive;
    if (examData.isPublished !== undefined) updateData.is_published = examData.isPublished;
    if (examData.allowResume !== undefined) updateData.allow_resume = examData.allowResume;
    if (examData.shuffleQuestions !== undefined) updateData.shuffle_questions = examData.shuffleQuestions;
    if (examData.showResultsImmediately !== undefined) updateData.show_results_immediately = examData.showResultsImmediately;
    if (examData.maxAttempts !== undefined) updateData.max_attempts = examData.maxAttempts;

    const { data, error } = await supabaseAdmin
      .from('exams')
      .update(updateData)
      .eq('id', id)
      .select('*, subjects(*)')
      .single();

    if (error) throw error;
    return Exam.fromDB(data);
  }

  async delete(id) {
    const { error } = await supabaseAdmin
      .from('exams')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async getPublishedExams(studentId) {
    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*, subjects(*)')
      .eq('is_published', true)
      .eq('is_active', true)
      .order('start_date', { ascending: true });

    if (error) throw error;

    const assignedExamIds = await this.getAssignedExamIds(studentId);
    
    return data
      .filter(exam => assignedExamIds.includes(exam.id))
      .map(item => Exam.fromDB(item));
  }

  async getAssignedExamIds(studentId) {
    const { data, error } = await supabaseAdmin
      .from('exam_assignments')
      .select('exam_id')
      .eq('student_id', studentId)
      .eq('is_active', true);

    if (error) throw error;
    return data.map(item => item.exam_id);
  }

  async assignToStudents(examId, studentIds, startDate, endDate) {
    const assignments = studentIds.map(studentId => ({
      exam_id: examId,
      student_id: studentId,
      start_date: startDate,
      end_date: endDate
    }));

    const { data, error } = await supabaseAdmin
      .from('exam_assignments')
      .insert(assignments)
      .select('*');

    if (error) throw error;
    return data;
  }

  async getDashboardStats() {
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('is_active, is_published');

    if (error) throw error;

    return {
      total: exams.length,
      active: exams.filter(e => e.is_active).length,
      published: exams.filter(e => e.is_published).length,
      draft: exams.filter(e => !e.is_published).length
    };
  }
}

export default new ExamRepository();
