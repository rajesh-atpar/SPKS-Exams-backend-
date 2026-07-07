import studentRepository from '../repositories/Student.repository.js';
import examRepository from '../repositories/Exam.repository.js';
import examAttemptRepository from '../repositories/ExamAttempt.repository.js';
import resultRepository from '../repositories/Result.repository.js';
import notificationRepository from '../repositories/Notification.repository.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

export class StudentService {
  async createStudent(studentData) {
    const student = await studentRepository.create(studentData);
    
    logger.info(`Student created: ${student.id}`);

    return student.toJSON();
  }

  async updateStudent(studentId, studentData) {
    const student = await studentRepository.update(studentId, studentData);
    
    logger.info(`Student updated: ${studentId}`);

    return student.toJSON();
  }

  async getStudent(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      const error = new Error('Student not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return student.toJSON();
  }

  async listStudents(filters, pagination) {
    const result = await studentRepository.findAll(filters, pagination);
    
    return {
      students: result.students.map(student => student.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async deleteStudent(studentId) {
    await studentRepository.delete(studentId);
    
    logger.info(`Student deleted: ${studentId}`);

    return { message: 'Student deleted successfully' };
  }

  async getProfile(studentId) {
    const student = await studentRepository.findById(studentId);
    if (!student) {
      const error = new Error('Student not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const stats = await resultRepository.getStudentStats(studentId);

    return {
      ...student.toJSON(),
      stats
    };
  }

  async updateProfile(studentId, profileData) {
    const student = await studentRepository.update(studentId, profileData);
    
    logger.info(`Student profile updated: ${studentId}`);

    return student.toJSON();
  }

  async getAvailableExams(studentId) {
    const exams = await examRepository.getPublishedExams(studentId);
    
    return exams.map(exam => {
      const examData = exam.toJSON();
      delete examData.questions;
      return examData;
    });
  }

  async getExamHistory(studentId, filters, pagination) {
    const attempts = await examAttemptRepository.findByStudentId(studentId, filters);
    
    const attemptIds = attempts.map(a => a.id);
    const results = await Promise.all(
      attemptIds.map(id => resultRepository.findByAttemptId(id))
    );

    const history = attempts.map((attempt, index) => ({
      ...attempt.toJSON(),
      result: results[index] ? results[index].toJSON() : null
    }));

    return {
      history,
      total: history.length
    };
  }

  async getResults(studentId, filters, pagination) {
    const result = await resultRepository.findByStudentId(studentId, filters, pagination);
    
    return {
      results: result.results.map(r => r.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async getNotifications(studentId, filters, pagination) {
    const result = await notificationRepository.findByRecipientId(studentId, 'student', filters, pagination);
    
    const unreadCount = await notificationRepository.getUnreadCount(studentId, 'student');

    return {
      notifications: result.notifications.map(n => n.toJSON()),
      unreadCount,
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async markNotificationAsRead(notificationId, studentId) {
    const notification = await notificationRepository.findById(notificationId);
    
    if (!notification || notification.recipientId !== studentId) {
      const error = new Error('Notification not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await notificationRepository.markAsRead(notificationId);

    return { message: 'Notification marked as read' };
  }

  async markAllNotificationsAsRead(studentId) {
    await notificationRepository.markAllAsRead(studentId, 'student');

    return { message: 'All notifications marked as read' };
  }

  async getLeaderboard(examId, limit = 10) {
    const leaderboard = await resultRepository.getLeaderboard(examId, limit);
    
    return leaderboard.map(r => r.toJSON());
  }

  async getStats() {
    const stats = await studentRepository.getStats();
    return stats;
  }
}

export default new StudentService();
