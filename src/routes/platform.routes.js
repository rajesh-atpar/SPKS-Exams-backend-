import { Router } from 'express';
import { authenticate, authorizeAppUser, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { uuidParam } from '../validators/common.validator.js';
import { createOrderValidator, verifyPaymentValidator } from '../validators/payment.validator.js';
import * as platformController from '../controllers/platform.controller.js';

export const planRoutes = Router();
planRoutes.get('/', optionalAuth, platformController.listPlans);
planRoutes.get('/:planId', optionalAuth, uuidParam('planId'), validate, platformController.getPlan);

export const subscriptionRoutes = Router();
subscriptionRoutes.use(authenticate, authorizeAppUser);
subscriptionRoutes.get('/current', platformController.currentSubscription);
subscriptionRoutes.post('/:subscriptionId/cancel', uuidParam('subscriptionId'), validate, platformController.cancelSubscription);

export const paymentRoutes = Router();
paymentRoutes.get('/config', platformController.paymentConfig);
paymentRoutes.post('/webhook', platformController.paymentWebhook);
paymentRoutes.use(authenticate, authorizeAppUser);
paymentRoutes.get('/history', platformController.paymentHistory);
paymentRoutes.post('/create-order', createOrderValidator, validate, platformController.createOrder);
paymentRoutes.post('/verify', verifyPaymentValidator, validate, platformController.verifyPayment);

export const helpRoutes = Router();
helpRoutes.get('/faqs', platformController.listFaqs);
helpRoutes.get('/contact', platformController.getContact);

export const supportRoutes = Router();
supportRoutes.use(authenticate, authorizeAppUser);
supportRoutes.post('/tickets', platformController.createTicket);
supportRoutes.get('/tickets', platformController.listTickets);
supportRoutes.get('/tickets/:ticketId', uuidParam('ticketId'), validate, platformController.getTicket);
supportRoutes.post('/tickets/:ticketId/messages', uuidParam('ticketId'), validate, platformController.addTicketMessage);

export const legalRoutes = Router();
legalRoutes.get('/terms', platformController.getTerms);
legalRoutes.get('/privacy-policy', platformController.getPrivacy);
legalRoutes.get('/refund-policy', platformController.getRefund);

export const notificationRoutes = Router();
notificationRoutes.use(authenticate, authorizeAppUser);
notificationRoutes.get('/', platformController.listNotifications);
notificationRoutes.patch('/read-all', platformController.markAllNotificationsRead);
notificationRoutes.patch('/:notificationId/read', uuidParam('notificationId'), validate, platformController.markNotificationRead);
