import { repos } from '../repositories/repos.js';
import { getPaginationParams } from '../utils/pagination.js';
import { notFound } from '../utils/errors.js';

export class NotificationService {
  async listMine(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.notifications.findMany({
      filters: { userId },
      page,
      limit
    });
    return { items, total, page, limit, unreadCount: items.filter((item) => !item.isRead).length };
  }

  async markRead(userId, notificationId) {
    const notification = await repos.notifications.findById(notificationId);
    if (!notification || notification.userId !== userId) throw notFound('Notification');
    return repos.notifications.update(notificationId, { isRead: true });
  }

  async markAllRead(userId) {
    const { items } = await repos.notifications.findMany({ filters: { userId, isRead: false }, limit: 100 });
    await Promise.all(items.map((item) => repos.notifications.update(item.id, { isRead: true })));
    return { updated: items.length };
  }

  async create(payload) {
    if (payload.userId) {
      return repos.notifications.create(payload);
    }

    const { items: users } = await repos.users.findMany({
      filters: { role: 'user', status: 'active' },
      limit: 100
    });
    const created = await Promise.all(
      users.map((user) => repos.notifications.create({ ...payload, userId: user.id }))
    );
    return { count: created.length };
  }

  async listAll(query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.notifications.findMany({ page, limit, search: query.search, searchFields: ['title', 'body'] });
    return { items, total, page, limit };
  }

  async send(payload) {
    return this.create(payload);
  }
}

export default new NotificationService();
