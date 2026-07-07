import { supabaseAdmin } from '../services/supabaseClient.js';
import { Result } from '../models/Result.model.js';
import { PAGINATION } from '../config/constants.js';

export class ResultRepository {
  async create(resultData) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .insert({
        attempt_id: resultData.attemptId,
        exam_id: resultData.examId,
        student_id: resultData.studentId,
        total_marks: resultData.totalMarks,
        obtained_marks: resultData.obtainedMarks,
        percentage: resultData.percentage,
        is_passed: resultData.isPassed,
        correct_answers: resultData.correctAnswers,
        wrong_answers: resultData.wrongAnswers,
        skipped_answers: resultData.skippedAnswers,
        negative_marks: resultData.negativeMarks,
        section_wise_scores: resultData.sectionWiseScores
      })
      .select('*, exams(*), students(*)')
      .single();

    if (error) throw error;
    return Result.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, exams(*), students(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? Result.fromDB(data) : null;
  }

  async findByAttemptId(attemptId) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, exams(*), students(*)')
      .eq('attempt_id', attemptId)
      .single();

    if (error) throw error;
    return data ? Result.fromDB(data) : null;
  }

  async findByStudentId(studentId, filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('results')
      .select('*, exams(*), students(*)', { count: 'exact' })
      .eq('student_id', studentId);

    if (filters.examId) {
      query = query.eq('exam_id', filters.examId);
    }
    if (filters.isPassed !== undefined) {
      query = query.eq('is_passed', filters.isPassed);
    }

    const { data, error, count } = await query
      .order('generated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      results: data.map(item => Result.fromDB(item)),
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async findByExamId(examId, filters = {}, pagination = {}) {
    const page = pagination.page || PAGINATION.DEFAULT_PAGE;
    const limit = pagination.limit || PAGINATION.DEFAULT_LIMIT;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('results')
      .select('*, exams(*), students(*)', { count: 'exact' })
      .eq('exam_id', examId);

    if (filters.isPassed !== undefined) {
      query = query.eq('is_passed', filters.isPassed);
    }

    const { data, error, count } = await query
      .order('percentage', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const results = data.map(item => Result.fromDB(item));
    
    await this.updateRanks(examId);

    return {
      results,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    };
  }

  async updateRanks(examId) {
    const { data: results, error } = await supabaseAdmin
      .from('results')
      .select('id')
      .eq('exam_id', examId)
      .order('percentage', { ascending: false });

    if (error) throw error;

    for (let i = 0; i < results.length; i++) {
      await supabaseAdmin
        .from('results')
        .update({ rank: i + 1 })
        .eq('id', results[i].id);
    }
  }

  async getLeaderboard(examId, limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*, exams(*), students(*)')
      .eq('exam_id', examId)
      .order('percentage', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data.map(item => Result.fromDB(item));
  }

  async getStudentStats(studentId) {
    const { data, error } = await supabaseAdmin
      .from('results')
      .select('*')
      .eq('student_id', studentId);

    if (error) throw error;

    const total = data.length;
    const passed = data.filter(r => r.is_passed).length;
    const avgPercentage = total > 0 
      ? data.reduce((sum, r) => sum + r.percentage, 0) / total 
      : 0;

    return {
      total,
      passed,
      failed: total - passed,
      passRate: total > 0 ? (passed / total) * 100 : 0,
      averagePercentage: avgPercentage
    };
  }
}

export default new ResultRepository();
