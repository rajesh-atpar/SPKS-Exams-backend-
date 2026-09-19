import { STAFF_ROLES } from '../config/constants.js';
import { asyncHandler } from './errorHandler.js';
import { premiumRequired, unauthorized } from '../utils/errors.js';
import paymentService from '../services/payment.service.js';

export const requireActivePlan = asyncHandler(async (req, _res, next) => {
  if (!req.user?.id) {
    throw unauthorized('Authentication required');
  }

  if (STAFF_ROLES.includes(req.user.role)) {
    return next();
  }

  if (await paymentService.hasActiveSubscription(req.user.id)) {
    return next();
  }

  throw premiumRequired(
    'An active plan is required to open courses. Choose 1 month (₹1), 6 months (₹2), or 1 year (₹3).'
  );
});
