import subjectRepository from '../repositories/Subject.repository.js';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants.js';
import logger from '../config/logger.js';

export class SubjectService {
  async createSubject(subjectData, adminId) {
    const existingSubject = await subjectRepository.findByCode(subjectData.code);
    if (existingSubject) {
      const error = new Error('Subject with this code already exists');
      error.code = ERROR_CODES.CONFLICT_ERROR;
      error.statusCode = HTTP_STATUS.CONFLICT;
      throw error;
    }

    const subject = await subjectRepository.create({
      ...subjectData,
      createdBy: adminId
    });

    logger.info(`Subject created: ${subject.id}`);

    return subject.toJSON();
  }

  async updateSubject(subjectId, subjectData) {
    if (subjectData.code) {
      const existingSubject = await subjectRepository.findByCode(subjectData.code);
      if (existingSubject && existingSubject.id !== subjectId) {
        const error = new Error('Subject with this code already exists');
        error.code = ERROR_CODES.CONFLICT_ERROR;
        error.statusCode = HTTP_STATUS.CONFLICT;
        throw error;
      }
    }

    const subject = await subjectRepository.update(subjectId, subjectData);
    
    logger.info(`Subject updated: ${subjectId}`);

    return subject.toJSON();
  }

  async getSubject(subjectId) {
    const subject = await subjectRepository.findById(subjectId);
    if (!subject) {
      const error = new Error('Subject not found');
      error.code = ERROR_CODES.NOT_FOUND_ERROR;
      error.statusCode = HTTP_STATUS.NOT_FOUND;
      throw error;
    }

    return subject.toJSON();
  }

  async listSubjects(filters, pagination) {
    const result = await subjectRepository.findAll(filters, pagination);
    
    return {
      subjects: result.subjects.map(subject => subject.toJSON()),
      pagination: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages
      }
    };
  }

  async deleteSubject(subjectId) {
    await subjectRepository.delete(subjectId);
    
    logger.info(`Subject deleted: ${subjectId}`);

    return { message: 'Subject deleted successfully' };
  }

  async getActiveSubjects() {
    const subjects = await subjectRepository.getActiveSubjects();
    
    return subjects.map(subject => subject.toJSON());
  }
}

export default new SubjectService();
