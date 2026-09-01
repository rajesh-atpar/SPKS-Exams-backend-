import { repos } from '../repositories/repos.js';
import { LEGAL_TYPES } from '../config/constants.js';
import { notFound } from '../utils/errors.js';

export class LegalService {
  async get(type) {
    const document = await repos.legal.findOne({ type });
    if (!document) throw notFound('Document');
    return document;
  }

  async update(type, { title, content }, userId) {
    const document = await this.get(type);
    return repos.legal.update(document.id, {
      title: title || document.title,
      content,
      updatedBy: userId
    });
  }

  getTerms() {
    return this.get(LEGAL_TYPES.TERMS);
  }

  getPrivacy() {
    return this.get(LEGAL_TYPES.PRIVACY);
  }

  getRefund() {
    return this.get(LEGAL_TYPES.REFUND);
  }
}

export default new LegalService();
