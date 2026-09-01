import crypto from 'crypto';
import { repos } from '../repositories/repos.js';
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { badRequest, notFound } from '../utils/errors.js';

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

export class PaymentService {
  razorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async getRazorpay() {
    if (!this.razorpayConfigured()) {
      throw badRequest('Razorpay is not configured');
    }
    const { default: Razorpay } = await import('razorpay');
    return new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  async listPlans(query, { admin = false } = {}) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.plans.findMany({
      filters: admin ? {} : { isActive: true },
      page,
      limit,
      search: query.search,
      searchFields: ['name']
    });
    return { items, total, page, limit };
  }

  async getPlan(planId) {
    const plan = await repos.plans.findById(planId);
    if (!plan) throw notFound('Plan');
    return plan;
  }

  createPlan(payload) {
    return repos.plans.create(payload);
  }

  async updatePlan(planId, payload) {
    await this.getPlan(planId);
    return repos.plans.update(planId, payload);
  }

  async deletePlan(planId) {
    await this.getPlan(planId);
    await repos.plans.remove(planId);
    return { message: 'Plan deleted' };
  }

  async currentSubscription(userId) {
    const { items } = await repos.subscriptions.findMany({
      filters: { userId, status: SUBSCRIPTION_STATUS.ACTIVE },
      limit: 1
    });
    const subscription = items[0] || null;
    if (!subscription) return null;
    if (new Date(subscription.endsAt) < new Date()) {
      return repos.subscriptions.update(subscription.id, { status: SUBSCRIPTION_STATUS.EXPIRED });
    }
    const plan = await repos.plans.findById(subscription.planId);
    return { ...subscription, plan };
  }

  async paymentHistory(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.payments.findMany({
      filters: { userId },
      page,
      limit
    });
    return { items, total, page, limit };
  }

  async createOrder(userId, planId) {
    const plan = await this.getPlan(planId);
    const amountPaise = Math.round(Number(plan.price) * 100);
    let providerOrderId = `local_${crypto.randomUUID()}`;

    if (this.razorpayConfigured() && amountPaise > 0) {
      const razorpay = await this.getRazorpay();
      const order = await razorpay.orders.create({
        amount: amountPaise,
        currency: plan.currency || 'INR',
        notes: { userId, planId }
      });
      providerOrderId = order.id;
    }

    const payment = await repos.payments.create({
      userId,
      planId,
      provider: 'razorpay',
      providerOrderId,
      amount: plan.price,
      currency: plan.currency || 'INR',
      status: PAYMENT_STATUS.CREATED
    });

    return {
      payment,
      orderId: providerOrderId,
      amount: amountPaise,
      currency: plan.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || null
    };
  }

  async activateSubscription(userId, planId, paymentId) {
    const plan = await this.getPlan(planId);
    const startsAt = new Date();
    const subscription = await repos.subscriptions.create({
      userId,
      planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startsAt: startsAt.toISOString(),
      endsAt: addDays(startsAt, plan.duration || 30).toISOString()
    });
    await repos.payments.update(paymentId, {
      subscriptionId: subscription.id,
      status: PAYMENT_STATUS.PAID
    });
    return subscription;
  }

  async verifyPayment(userId, { razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
    const payment = await repos.payments.findOne({ providerOrderId: razorpayOrderId, userId });
    if (!payment) throw notFound('Payment');

    if (this.razorpayConfigured()) {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');
      if (expected !== razorpaySignature) {
        await repos.payments.update(payment.id, { status: PAYMENT_STATUS.FAILED });
        throw badRequest('Payment signature verification failed');
      }
    }

    await repos.payments.update(payment.id, { providerPaymentId: razorpayPaymentId });
    const subscription = await this.activateSubscription(userId, payment.planId, payment.id);
    return { payment: await repos.payments.findById(payment.id), subscription };
  }

  async handleWebhook(rawBody, signature) {
    if (this.razorpayConfigured() && process.env.RAZORPAY_WEBHOOK_SECRET) {
      const expected = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');
      if (expected !== signature) throw badRequest('Invalid webhook signature');
    }

    const event = JSON.parse(rawBody.toString());
    const entity = event?.payload?.payment?.entity;
    if (!entity?.order_id) return { received: true };

    const payment = await repos.payments.findOne({ providerOrderId: entity.order_id });
    if (!payment) return { received: true };

    if (event.event === 'payment.captured' && payment.status !== PAYMENT_STATUS.PAID) {
      await repos.payments.update(payment.id, {
        providerPaymentId: entity.id,
        rawPayload: event
      });
      await this.activateSubscription(payment.userId, payment.planId, payment.id);
    }

    if (event.event === 'payment.failed') {
      await repos.payments.update(payment.id, { status: PAYMENT_STATUS.FAILED, rawPayload: event });
    }

    return { received: true };
  }

  async cancelSubscription(userId, subscriptionId) {
    const subscription = await repos.subscriptions.findById(subscriptionId);
    if (!subscription || subscription.userId !== userId) throw notFound('Subscription');
    return repos.subscriptions.update(subscriptionId, {
      status: SUBSCRIPTION_STATUS.CANCELLED,
      cancelledAt: new Date().toISOString()
    });
  }

  async adminSubscriptions(query) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.status) filters.status = query.status;
    const { items, total } = await repos.subscriptions.findMany({ filters, page, limit });
    return { items, total, page, limit };
  }

  async adminPayments(query) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.status) filters.status = query.status;
    const { items, total } = await repos.payments.findMany({ filters, page, limit });
    return { items, total, page, limit };
  }
}

export default new PaymentService();
