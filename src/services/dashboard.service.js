import { supabaseAdmin } from '../services/supabaseClient.js';
import studentRepository from '../repositories/Student.repository.js';
import examRepository from '../repositories/Exam.repository.js';
import questionRepository from '../repositories/Question.repository.js';
import examAttemptRepository from '../repositories/ExamAttempt.repository.js';
import resultRepository from '../repositories/Result.repository.js';
import { ATTEMPT_STATUS } from '../config/constants.js';

export class DashboardService {
  async getAdminDashboard() {
    const studentStats = await studentRepository.getStats();
    const examStats = await examRepository.getDashboardStats();
    
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id');

    const { data: attempts } = await supabaseAdmin
      .from('student_exam_attempts')
      .select('id, status');

    const activeExams = attempts?.filter(a => a.status === ATTEMPT_STATUS.IN_PROGRESS).length || 0;
    const completedExams = attempts?.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED).length || 0;

    const { data: results } = await supabaseAdmin
      .from('results')
      .select('percentage');

    const averageScore = results?.length > 0 
      ? results.reduce((sum, r) => sum + r.percentage, 0) / results.length 
      : 0;

    const passCount = results?.filter(r => r.is_passed).length || 0;
    const passPercentage = results?.length > 0 
      ? (passCount / results.length) * 100 
      : 0;

    return {
      totalStudents: studentStats.total,
      activeStudents: studentStats.active,
      totalExams: examStats.total,
      activeExams: examStats.active,
      publishedExams: examStats.published,
      totalQuestions: questions?.length || 0,
      inProgressAttempts: activeExams,
      completedAttempts: completedExams,
      averageScore: averageScore.toFixed(2),
      passPercentage: passPercentage.toFixed(2)
    };
  }

  async getStudentDashboard(studentId) {
    const availableExams = await examRepository.getPublishedExams(studentId);
    const attempts = await examAttemptRepository.findByStudentId(studentId);
    const results = await resultRepository.getStudentStats(studentId);

    const inProgressAttempts = attempts.filter(a => a.status === ATTEMPT_STATUS.IN_PROGRESS);
    const completedAttempts = attempts.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED);

    return {
      availableExams: availableExams.length,
      inProgressExams: inProgressAttempts.length,
      completedExams: completedAttempts.length,
      totalExamsTaken: results.total,
      examsPassed: results.passed,
      examsFailed: results.failed,
      passRate: results.passRate.toFixed(2),
      averageScore: results.averagePercentage.toFixed(2)
    };
  }

  async getRecentActivity(limit = 10) {
    const { data, error } = await supabaseAdmin
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data;
  }
}

export default new DashboardService();
