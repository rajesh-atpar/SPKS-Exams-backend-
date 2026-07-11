import examRepository from '../repositories/Exam.repository.js';
import questionRepository from '../repositories/Question.repository.js';
import examAttemptRepository from '../repositories/ExamAttempt.repository.js';
import studentAnswerRepository from '../repositories/StudentAnswer.repository.js';
import resultRepository from '../repositories/Result.repository.js';
import notificationRepository from '../repositories/Notification.repository.js';
import { ERROR_CODES, HTTP_STATUS, ATTEMPT_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

export class ExamService {
  async createExam(examData, adminId) {
    const exam = await examRepository.create({
      ...examData,
      createdBy: adminId
    });

    logger.info(`Exam created: ${exam.id} by admin: ${adminId}`);

    return exam.toJSON();
  }

  async updateExam(examId, examData) {
    const exam = await examRepository.update(examId, examData);
    
    logger.info(`Exam updated: ${examId}`);

    return exam.toJSON();
  }

  async getExam(examId) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return exam.toJSON();
  }

  async listExams(filters, pagination) {
    const result = await examRepository.findAll(filters, pagination);
    
    return {
      exams: result.exams.map(exam => exam.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async deleteExam(examId) {
    await examRepository.delete(examId);
    
    logger.info(`Exam deleted: ${examId}`);

    return { message: 'Exam deleted successfully' };
  }

  async assignExam(examId, studentIds, startDate, endDate) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    await examRepository.assignToStudents(examId, studentIds, startDate, endDate);

    // Create notifications for students
    for (const studentId of studentIds) {
      await notificationRepository.create({
        recipientId: studentId,
        recipientType: 'student',
        title: 'New Exam Assigned',
        message: `You have been assigned to the exam: ${exam.title}`,
        type: 'exam_assigned',
        relatedId: examId,
        relatedType: 'exam'
      });
    }

    logger.info(`Exam ${examId} assigned to ${studentIds.length} students`);

    return { message: 'Exam assigned successfully' };
  }

  async startExam(examId, studentId, ipAddress, browserInfo) {
    const exam = await examRepository.findById(examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (!exam.isPublished || !exam.isActive) {
      const error = new Error('Exam is not available');
      error.code = ERROR_CODES.AUTHORIZATION_ERROR;
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // Check if student is assigned
    const assignedExamIds = await examRepository.getAssignedExamIds(studentId);
    if (!assignedExamIds.includes(examId)) {
      const error = new Error('You are not assigned to this exam');
      error.code = ERROR_CODES.AUTHORIZATION_ERROR;
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // Check attempt count
    const attemptCount = await examAttemptRepository.getAttemptCount(studentId, examId);
    if (attemptCount >= exam.maxAttempts) {
      const error = new Error('Maximum attempts reached');
      error.code = ERROR_CODES.AUTHORIZATION_ERROR;
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    // Check for in-progress attempt
    const inProgressAttempt = await examAttemptRepository.getInProgressAttempt(studentId, examId);
    if (inProgressAttempt && !exam.allowResume) {
      const error = new Error('You already have an in-progress attempt');
      error.code = ERROR_CODES.AUTHORIZATION_ERROR;
      error.statusCode = HTTP_STATUS.FORBIDDEN;
      throw error;
    }

    if (inProgressAttempt) {
      return {
        attemptId: inProgressAttempt.id,
        exam: exam.toJSON(),
        questions: await questionRepository.findByExamId(examId, exam.shuffleQuestions),
        resumed: true
      };
    }

    // Create new attempt
    const attempt = await examAttemptRepository.create({
      examId,
      studentId,
      attemptNumber: attemptCount + 1,
      ipAddress,
      browserInfo
    });

    const questions = await questionRepository.findByExamId(examId, exam.shuffleQuestions);

    logger.info(`Exam started: ${examId} by student: ${studentId}, attempt: ${attempt.id}`);

    return {
      attemptId: attempt.id,
      exam: exam.toJSON(),
      questions,
      resumed: false
    };
  }

  async submitAnswer(attemptId, questionId, answerData) {
    const question = await questionRepository.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    // Calculate if answer is correct
    let isCorrect = false;
    let marksObtained = 0;

    if (question.questionType === 'single_choice' || question.questionType === 'true_false') {
      const correctOption = question.options.find(opt => opt.is_correct);
      if (correctOption && answerData.selectedOptions?.includes(correctOption.id)) {
        isCorrect = true;
        marksObtained = question.marks;
      }
    } else if (question.questionType === 'multiple_choice') {
      const correctOptions = question.options.filter(opt => opt.is_correct).map(opt => opt.id);
      const selectedOptions = answerData.selectedOptions || [];
      
      if (correctOptions.length === selectedOptions.length &&
          correctOptions.every(id => selectedOptions.includes(id))) {
        isCorrect = true;
        marksObtained = question.marks;
      }
    }

    const existingAnswer = await studentAnswerRepository.findByAttemptIdAndQuestionId(attemptId, questionId);
    
    if (existingAnswer) {
      await studentAnswerRepository.update({
        attemptId,
        questionId,
        selectedOptions: answerData.selectedOptions,
        textAnswer: answerData.textAnswer,
        isCorrect,
        marksObtained,
        timeTakenSeconds: answerData.timeTakenSeconds
      });
    } else {
      await studentAnswerRepository.create({
        attemptId,
        questionId,
        selectedOptions: answerData.selectedOptions,
        textAnswer: answerData.textAnswer,
        isCorrect,
        marksObtained,
        timeTakenSeconds: answerData.timeTakenSeconds
      });
    }

    return { message: 'Answer saved successfully' };
  }

  async submitExam(attemptId) {
    const attempt = await examAttemptRepository.findById(attemptId);
    if (!attempt) {
      const error = new Error('Attempt not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    if (attempt.status !== ATTEMPT_STATUS.IN_PROGRESS) {
      const error = new Error('Exam already submitted');
      error.code = ERROR_CODES.CONFLICT_ERROR;
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const submittedAt = new Date();
    const timeTakenSeconds = Math.floor((new Date(submittedAt) - new Date(attempt.startedAt)) / 1000);

    await examAttemptRepository.update(attemptId, {
      submittedAt,
      timeTakenSeconds,
      status: ATTEMPT_STATUS.SUBMITTED
    });

    // Generate result
    const result = await this.generateResult(attemptId);

    logger.info(`Exam submitted: ${attemptId}`);

    return {
      message: 'Exam submitted successfully',
      result
    };
  }

  async generateResult(attemptId) {
    const attempt = await examAttemptRepository.findById(attemptId);
    const exam = await examRepository.findById(attempt.examId);
    const answers = await studentAnswerRepository.findByAttemptId(attemptId);
    const questions = await questionRepository.findByExamId(attempt.examId);

    let totalObtainedMarks = 0;
    let correctAnswers = 0;
    let wrongAnswers = 0;
    let skippedAnswers = 0;
    let negativeMarks = 0;

    answers.forEach(answer => {
      totalObtainedMarks += answer.marks_obtained || 0;
      
      if (answer.is_correct) {
        correctAnswers++;
      } else if (answer.selected_options || answer.text_answer) {
        wrongAnswers++;
        negativeMarks += exam.negativeMarking * (questions.find(q => q.id === answer.question_id)?.marks || 1);
      } else {
        skippedAnswers++;
      }
    });

    const finalMarks = totalObtainedMarks - negativeMarks;
    const percentage = (finalMarks / exam.totalMarks) * 100;
    const isPassed = percentage >= exam.passingPercentage;

    const result = await resultRepository.create({
      attemptId,
      examId: exam.id,
      studentId: attempt.studentId,
      totalMarks: exam.totalMarks,
      obtainedMarks: finalMarks,
      percentage,
      isPassed,
      correctAnswers,
      wrongAnswers,
      skippedAnswers,
      negativeMarks
    });

    // Send notification
    await notificationRepository.create({
      recipientId: attempt.studentId,
      recipientType: 'student',
      title: 'Result Published',
      message: `Your result for ${exam.title} has been published. Score: ${percentage.toFixed(2)}%`,
      type: 'result_published',
      relatedId: result.id,
      relatedType: 'result'
    });

    return result.toJSON();
  }

  async getExamStatistics(examId) {
    const exam = await examRepository.findById(examId);
    const attempts = await examAttemptRepository.findByExamId(examId);
    const results = await resultRepository.findByExamId(examId, {}, { page: 1, limit: 1000 });

    const completedAttempts = attempts.filter(a => a.status === ATTEMPT_STATUS.SUBMITTED);
    const averagePercentage = results.results.length > 0
      ? results.results.reduce((sum, r) => sum + r.percentage, 0) / results.results.length
      : 0;
    const passCount = results.results.filter(r => r.isPassed).length;

    return {
      examId,
      title: exam.title,
      totalAttempts: attempts.length,
      completedAttempts: completedAttempts.length,
      averagePercentage: averagePercentage.toFixed(2),
      passCount,
      failCount: results.results.length - passCount,
      passRate: results.results.length > 0 ? (passCount / results.results.length) * 100 : 0
    };
  }

  async getDashboardStats() {
    const stats = await examRepository.getDashboardStats();
    return stats;
  }
}

export default new ExamService();
