import questionRepository from '../repositories/Question.repository.js';
import examRepository from '../repositories/Exam.repository.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

export class QuestionService {
  async createQuestion(questionData, adminId) {
    const exam = await examRepository.findById(questionData.examId);
    if (!exam) {
      const error = new Error('Exam not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    const question = await questionRepository.create({
      ...questionData,
      createdBy: adminId
    });

    logger.info(`Question created: ${question.id} for exam: ${questionData.examId}`);

    return question.toJSON();
  }

  async updateQuestion(questionId, questionData) {
    const question = await questionRepository.update(questionId, questionData);
    
    logger.info(`Question updated: ${questionId}`);

    return question.toJSON();
  }

  async getQuestion(questionId) {
    const question = await questionRepository.findById(questionId);
    if (!question) {
      const error = new Error('Question not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return question.toJSON();
  }

  async listQuestions(filters, pagination) {
    const result = await questionRepository.findAll(filters, pagination);
    
    return {
      questions: result.questions.map(question => question.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async deleteQuestion(questionId) {
    await questionRepository.delete(questionId);
    
    logger.info(`Question deleted: ${questionId}`);

    return { message: 'Question deleted successfully' };
  }

  async getExamQuestions(examId, shuffle = false) {
    const questions = await questionRepository.findByExamId(examId, shuffle);
    
    return questions.map(question => question.toJSON());
  }

  async batchCreateQuestions(questionsData, adminId) {
    const createdQuestions = [];

    for (const questionData of questionsData) {
      const question = await this.createQuestion(questionData, adminId);
      createdQuestions.push(question);
    }

    return createdQuestions;
  }
}

export default new QuestionService();
