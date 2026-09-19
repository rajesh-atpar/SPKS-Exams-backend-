import paymentService from '../services/payment.service.js';
import supportService from '../services/support.service.js';
import legalService from '../services/legal.service.js';
import notificationService from '../services/notification.service.js';
import analyticsService from '../services/analytics.service.js';
import { HTTP_STATUS, LEGAL_TYPES } from '../config/constants.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { paginatedResponse, successResponse } from '../utils/response.js';

export const paymentConfig = asyncHandler(async (_req, res) => {
  return successResponse(res, 'Payment config fetched successfully', paymentService.checkoutConfig());
});

export const listPlans = asyncHandler(async (req, res) => {
  const data = await paymentService.listPlans(req.query);
  return paginatedResponse(res, 'Plans fetched successfully', data.items, data);
});

export const getPlan = asyncHandler(async (req, res) => {
  return successResponse(res, 'Plan fetched successfully', await paymentService.getPlan(req.params.planId));
});

export const currentSubscription = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subscription fetched successfully', await paymentService.currentSubscription(req.user.id));
});

export const paymentHistory = asyncHandler(async (req, res) => {
  const data = await paymentService.paymentHistory(req.user.id, req.query);
  return paginatedResponse(res, 'Payments fetched successfully', data.items, data);
});

export const createOrder = asyncHandler(async (req, res) => {
  return successResponse(res, 'Order created', await paymentService.createOrder(req.user.id, req.body.planId), HTTP_STATUS.CREATED);
});

export const verifyPayment = asyncHandler(async (req, res) => {
  return successResponse(res, 'Payment verified', await paymentService.verifyPayment(req.user.id, req.body));
});

export const cancelSubscription = asyncHandler(async (req, res) => {
  return successResponse(res, 'Subscription cancelled', await paymentService.cancelSubscription(req.user.id, req.params.subscriptionId));
});

export const paymentWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  return successResponse(res, 'Webhook processed', await paymentService.handleWebhook(req.rawBody || JSON.stringify(req.body), signature));
});

export const listFaqs = asyncHandler(async (req, res) => {
  return successResponse(res, 'FAQs fetched successfully', await supportService.listFaqs());
});

export const getContact = asyncHandler(async (req, res) => {
  return successResponse(res, 'Contact fetched successfully', await supportService.getContact());
});

export const adminGetContact = asyncHandler(async (req, res) => {
  return successResponse(res, 'Contact fetched successfully', await supportService.getContact());
});

export const adminUpdateContact = asyncHandler(async (req, res) => {
  return successResponse(res, 'Contact updated', await supportService.updateContact(req.body, req.user.id));
});

export const adminListFaqs = asyncHandler(async (req, res) => {
  const data = await supportService.listAllFaqs(req.query);
  return paginatedResponse(res, 'FAQs fetched successfully', data.items, data);
});

export const adminGetFaq = asyncHandler(async (req, res) => {
  return successResponse(res, 'FAQ fetched successfully', await supportService.getFaq(req.params.faqId));
});

export const adminCreateFaq = asyncHandler(async (req, res) => {
  return successResponse(res, 'FAQ created', await supportService.createFaq(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdateFaq = asyncHandler(async (req, res) => {
  return successResponse(res, 'FAQ updated', await supportService.updateFaq(req.params.faqId, req.body));
});

export const adminDeleteFaq = asyncHandler(async (req, res) => {
  return successResponse(res, 'FAQ deleted', await supportService.deleteFaq(req.params.faqId));
});

export const createTicket = asyncHandler(async (req, res) => {
  return successResponse(res, 'Ticket created', await supportService.createTicket(req.user.id, req.body), HTTP_STATUS.CREATED);
});

export const listTickets = asyncHandler(async (req, res) => {
  const data = await supportService.listMyTickets(req.user.id, req.query);
  return paginatedResponse(res, 'Tickets fetched successfully', data.items, data);
});

export const getTicket = asyncHandler(async (req, res) => {
  return successResponse(res, 'Ticket fetched successfully', await supportService.getTicket(req.params.ticketId, req.user));
});

export const addTicketMessage = asyncHandler(async (req, res) => {
  return successResponse(res, 'Message added', await supportService.addMessage(req.params.ticketId, req.user, req.body.message));
});

export const getTerms = asyncHandler(async (req, res) => {
  return successResponse(res, 'Terms fetched successfully', await legalService.getTerms());
});

export const getPrivacy = asyncHandler(async (req, res) => {
  return successResponse(res, 'Privacy policy fetched successfully', await legalService.getPrivacy());
});

export const getRefund = asyncHandler(async (req, res) => {
  return successResponse(res, 'Refund policy fetched successfully', await legalService.getRefund());
});

export const listNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.listMine(req.user.id, req.query);
  return paginatedResponse(res, 'Notifications fetched successfully', data.items, data);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  return successResponse(res, 'Notification marked as read', await notificationService.markRead(req.user.id, req.params.notificationId));
});

export const markAllNotificationsRead = asyncHandler(async (req, res) => {
  return successResponse(res, 'All notifications marked as read', await notificationService.markAllRead(req.user.id));
});

export const adminListPlans = asyncHandler(async (req, res) => {
  const data = await paymentService.listPlans(req.query, { admin: true });
  return paginatedResponse(res, 'Plans fetched successfully', data.items, data);
});

export const adminCreatePlan = asyncHandler(async (req, res) => {
  return successResponse(res, 'Plan created', await paymentService.createPlan(req.body), HTTP_STATUS.CREATED);
});

export const adminUpdatePlan = asyncHandler(async (req, res) => {
  return successResponse(res, 'Plan updated', await paymentService.updatePlan(req.params.planId, req.body));
});

export const adminDeletePlan = asyncHandler(async (req, res) => {
  return successResponse(res, 'Plan deleted', await paymentService.deletePlan(req.params.planId));
});

export const adminSubscriptions = asyncHandler(async (req, res) => {
  const data = await paymentService.adminSubscriptions({
    ...req.query,
    userId: req.params.userId || req.query.userId
  });
  return paginatedResponse(res, 'Subscriptions fetched successfully', data.items, data);
});

export const adminPayments = asyncHandler(async (req, res) => {
  const data = await paymentService.adminPayments({
    ...req.query,
    userId: req.params.userId || req.query.userId
  });
  return paginatedResponse(res, 'Payments fetched successfully', data.items, data);
});

export const adminUserBilling = asyncHandler(async (req, res) => {
  return successResponse(res, 'User billing fetched successfully', await paymentService.adminUserBilling(req.params.userId));
});

export const adminTickets = asyncHandler(async (req, res) => {
  const data = await supportService.listAllTickets(req.query);
  return paginatedResponse(res, 'Tickets fetched successfully', data.items, data);
});

export const adminGetTicket = asyncHandler(async (req, res) => {
  return successResponse(res, 'Ticket fetched successfully', await supportService.getTicket(req.params.ticketId, req.user, { admin: true }));
});

export const adminUpdateTicketStatus = asyncHandler(async (req, res) => {
  return successResponse(res, 'Ticket status updated', await supportService.updateStatus(req.params.ticketId, req.body.status));
});

export const adminReplyTicket = asyncHandler(async (req, res) => {
  return successResponse(res, 'Reply added', await supportService.addMessage(req.params.ticketId, req.user, req.body.message, { admin: true }));
});

export const adminUpdateLegal = (type) => asyncHandler(async (req, res) => {
  return successResponse(res, 'Document updated', await legalService.update(type, req.body, req.user.id));
});

export const adminUpdateTerms = adminUpdateLegal(LEGAL_TYPES.TERMS);
export const adminUpdatePrivacy = adminUpdateLegal(LEGAL_TYPES.PRIVACY);
export const adminUpdateRefund = adminUpdateLegal(LEGAL_TYPES.REFUND);

export const adminListNotifications = asyncHandler(async (req, res) => {
  const data = await notificationService.listAll(req.query);
  return paginatedResponse(res, 'Notifications fetched successfully', data.items, data);
});

export const adminCreateNotification = asyncHandler(async (req, res) => {
  return successResponse(res, 'Notification created', await notificationService.create(req.body), HTTP_STATUS.CREATED);
});

export const adminSendNotification = asyncHandler(async (req, res) => {
  return successResponse(res, 'Notification sent', await notificationService.send(req.body));
});

export const analyticsOverview = asyncHandler(async (req, res) => {
  return successResponse(res, 'Analytics fetched successfully', await analyticsService.overview());
});

export const analyticsUsers = asyncHandler(async (req, res) => {
  return successResponse(res, 'User analytics fetched successfully', await analyticsService.users());
});

export const analyticsCourses = asyncHandler(async (req, res) => {
  return successResponse(res, 'Course analytics fetched successfully', await analyticsService.courses());
});

export const analyticsTests = asyncHandler(async (req, res) => {
  return successResponse(res, 'Test analytics fetched successfully', await analyticsService.tests());
});

export const analyticsRevenue = asyncHandler(async (req, res) => {
  return successResponse(res, 'Revenue analytics fetched successfully', await analyticsService.revenue());
});
