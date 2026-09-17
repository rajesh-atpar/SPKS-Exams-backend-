import { STAFF_ROLES } from '../config/constants.js';
import { premiumRequired } from '../utils/errors.js';
import paymentService from './payment.service.js';

const PREMIUM_FIELDS = ['fileUrl', 'videoUrl', 'youtubeId', 'content'];

export class AccessService {
  async hasPremium(user) {
    if (!user?.id) return false;
    if (STAFF_ROLES.includes(user.role)) return true;
    return paymentService.hasActiveSubscription(user.id);
  }

  redact(item, hasAccess, extraFields = []) {
    if (!item) return item;
    const isPremium = Boolean(item.isPremium);
    const isLocked = isPremium && !hasAccess;
    const next = { ...item, isPremium, isLocked };
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
    if (!item?.isPremium) return item;
    if (await this.hasPremium(user)) return item;
    throw premiumRequired(`${label} requires an active subscription`);
  }
}

export default new AccessService();
