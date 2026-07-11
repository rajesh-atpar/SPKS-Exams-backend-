import { supabaseAdmin } from '../services/supabaseClient.js';
import { ExamAttempt } from '../models/ExamAttempt.model.js';
import { PAGINATION } from '../config/constants.js';

export class ExamAttemptRepository {
  async create(attemptData) {
    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .insert({
        exam_id: attemptData.examId,
        student_id: attemptData.studentId,
        attempt_number: attemptData.attemptNumber || 1,
        ip_address: attemptData.ipAddress,
        browser_info: attemptData.browserInfo
      })
      .select('*, exams(*), students(*)')
      .single();

    if (error) throw error;
    return ExamAttempt.fromDB(data);
  }

  async findById(id) {
    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .select('*, exams(*), students(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data ? ExamAttempt.fromDB(data) : null;
  }

  async findByStudentId(studentId, filters = {}) {
    let query = supabaseAdmin
      .from('student_exam_attempts')
      .select('*, exams(*), students(*)')
      .eq('student_id', studentId);

    if (filters.examId) {
      query = query.eq('exam_id', filters.examId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data.map(item => ExamAttempt.fromDB(item));
  }

  async findByExamId(examId) {
    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .select('*, exams(*), students(*)')
      .eq('exam_id', examId)
      .order('started_at', { ascending: false });

    if (error) throw error;
    return data.map(item => ExamAttempt.fromDB(item));
  }

  async update(id, attemptData) {
    const updateData = {};
    if (attemptData.submittedAt !== undefined) updateData.submitted_at = attemptData.submittedAt;
    if (attemptData.timeTakenSeconds !== undefined) updateData.time_taken_seconds = attemptData.timeTakenSeconds;
    if (attemptData.status !== undefined) updateData.status = attemptData.status;

    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .update(updateData)
      .eq('id', id)
      .select('*, exams(*), students(*)')
      .single();

    if (error) throw error;
    return ExamAttempt.fromDB(data);
  }

  async getAttemptCount(studentId, examId) {
    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .select('id')
      .eq('student_id', studentId)
      .eq('exam_id', examId);

    if (error) throw error;
    return data.length;
  }

  async getInProgressAttempt(studentId, examId) {
    const { data, error } = await supabaseAdmin
      .from('student_exam_attempts')
      .select('*, exams(*), students(*)')
      .eq('student_id', studentId)
      .eq('exam_id', examId)
      .eq('status', 'in_progress')
      .single();

    if (error) return null;
    return data ? ExamAttempt.fromDB(data) : null;
  }
}

export default new ExamAttemptRepository();
