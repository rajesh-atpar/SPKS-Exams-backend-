import { STAFF_ROLES } from '../config/constants.js';
import { premiumRequired } from '../utils/errors.js';
import paymentService from './payment.service.js';

const PREMIUM_FIELDS = ['fileUrl', 'pdfUrl', 'pdfViewUrl', 'viewUrl', 'videoUrl', 'youtubeId', 'content'];

export class AccessService {
  async hasPremium(user) {
    if (!user?.id) return false;
    if (STAFF_ROLES.includes(user.role)) return true;
    return paymentService.hasActiveSubscription(user.id);
  }

  redact(item, hasAccess, extraFields = []) {
    if (!item) return item;
    const isLocked = !hasAccess;
    const next = { ...item, isPremium: true, isLocked, requiresPlan: true };
    if (isLocked) {
      for (const field of [...PREMIUM_FIELDS, ...extraFields]) {
        if (Object.prototype.hasOwnProperty.call(next, field)) {
          next[field] = null;
        }
      }
    }
    return next;
  }

  redactMany(items, hasAccess, extraFields = []) {
    return (items || []).map((item) => this.redact(item, hasAccess, extraFields));
  }

  async applyList(items, user, extraFields = []) {
    const hasAccess = await this.hasPremium(user);
    return this.redactMany(items, hasAccess, extraFields);
  }

  async applyItem(item, user, extraFields = []) {
    const hasAccess = await this.hasPremium(user);
    return this.redact(item, hasAccess, extraFields);
  }

  async assertUnlocked(user, item, label = 'This item') {
    if (await this.hasPremium(user)) return item;
    throw premiumRequired(`${label} requires an active plan. Choose 1 month, 6 months, or 1 year.`);
  }

  async assertCourseAccess(user, label = 'This course') {
    if (await this.hasPremium(user)) return true;
    throw premiumRequired(`${label} requires an active plan. Choose 1 month (₹1), 6 months (₹2), or 1 year (₹3).`);
  }
}

export default new AccessService();
