import { repos } from '../repositories/repos.js';
import { DEFAULT_FAQS, DEFAULT_HELP_CONTACT_SETTING } from '../repositories/live.repository.js';
import { DEFAULT_HELP_CONTACT, PLATFORM_SETTING_KEYS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { forbidden, notFound } from '../utils/errors.js';

export class SupportService {
  async listFaqs({ admin = false } = {}) {
    try {
      const { items } = await repos.faqs.findMany({
        limit: 100,
        orderBy: 'display_order',
        order: 'asc'
      });
      const published = items.filter((item) => item.isPublished !== false);
      if (admin) return items.length ? items : DEFAULT_FAQS;
      return published.length ? published : DEFAULT_FAQS;
    } catch {
      return DEFAULT_FAQS;
    }
  }

  async listAllFaqs(query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.faqs.findMany({
      page,
      limit,
      search: query.search,
      searchFields: ['question', 'answer', 'category'],
      orderBy: 'display_order',
      order: 'asc'
    });
    return { items: items.length ? items : DEFAULT_FAQS, total: items.length ? total : DEFAULT_FAQS.length, page, limit };
  }

  async getFaq(faqId) {
    const faq = await repos.faqs.findById(faqId) || DEFAULT_FAQS.find((item) => item.id === faqId);
    if (!faq) throw notFound('FAQ');
    return faq;
  }

  createFaq(payload) {
    return repos.faqs.create({
      question: payload.question,
      answer: payload.answer,
      category: payload.category || 'general',
      displayOrder: payload.displayOrder ?? 0,
      isPublished: payload.isPublished !== false
    });
  }

  async updateFaq(faqId, payload) {
    await this.getFaq(faqId);
    return repos.faqs.update(faqId, payload);
  }

  async deleteFaq(faqId) {
    await this.getFaq(faqId);
    await repos.faqs.remove(faqId);
    return { message: 'FAQ deleted' };
  }

  async createTicket(userId, { subject, message }) {
    const ticket = await repos.tickets.create({ userId, subject, status: 'open' });
    const firstMessage = await repos.messages.create({
      ticketId: ticket.id,
      senderId: userId,
      message,
      isAdmin: false
    });
    return { ...ticket, messages: [firstMessage] };
  }

  async listMyTickets(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.tickets.findMany({ filters: { userId }, page, limit });
    return { items, total, page, limit };
  }

  async getTicket(ticketId, user, { admin = false } = {}) {
    const ticket = await repos.tickets.findById(ticketId);
    if (!ticket) throw notFound('Ticket');
    if (!admin && ticket.userId !== user.id) throw forbidden('You cannot view this ticket');

    const { items: messages } = await repos.messages.findMany({
      filters: { ticketId },
      limit: 100,
      orderBy: 'created_at',
      order: 'asc'
    });
    return { ...ticket, messages };
  }

  async addMessage(ticketId, user, message, { admin = false } = {}) {
    const ticket = await this.getTicket(ticketId, user, { admin });
    const created = await repos.messages.create({
      ticketId,
      senderId: user.id,
      message,
      isAdmin: admin
    });
    if (admin && ticket.status === 'open') {
      await repos.tickets.update(ticketId, { status: 'in-progress' });
    }
    return created;
  }

  async listAllTickets(query) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.status) filters.status = query.status;
    const { items, total } = await repos.tickets.findMany({ filters, page, limit });
    return { items, total, page, limit };
  }

  async updateStatus(ticketId, status) {
    const ticket = await repos.tickets.findById(ticketId);
    if (!ticket) throw notFound('Ticket');
    return repos.tickets.update(ticketId, { status });
  }

  async getContact() {
    try {
      const setting = await repos.platformSettings.findOne({ key: PLATFORM_SETTING_KEYS.HELP_CONTACT });
      const value = setting?.value || DEFAULT_HELP_CONTACT_SETTING.value || DEFAULT_HELP_CONTACT;
      return { ...DEFAULT_HELP_CONTACT, ...value };
    } catch {
      return DEFAULT_HELP_CONTACT;
    }
  }

  async updateContact(payload, userId) {
    const value = { ...(await this.getContact()), ...payload };
    const existing = await repos.platformSettings.findOne({ key: PLATFORM_SETTING_KEYS.HELP_CONTACT });
    if (existing) {
      const updated = await repos.platformSettings.update(existing.id, { value, updatedBy: userId });
      return { ...DEFAULT_HELP_CONTACT, ...(updated.value || value) };
    }
    const created = await repos.platformSettings.create({
      key: PLATFORM_SETTING_KEYS.HELP_CONTACT,
      value,
      updatedBy: userId
    });
    return { ...DEFAULT_HELP_CONTACT, ...(created.value || value) };
  }
}

export default new SupportService();
