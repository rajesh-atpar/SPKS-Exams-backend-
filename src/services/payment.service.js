import crypto from 'crypto';
import { repos } from '../repositories/repos.js';
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from '../config/constants.js';
import { getPaginationParams } from '../utils/pagination.js';
import { omit } from '../utils/case.js';
import { badRequest, conflict, notFound } from '../utils/errors.js';

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + Number(days || 0));
  return next;
};

const daysRemaining = (endsAt, from = new Date()) =>
  Math.max(0, Math.ceil((new Date(endsAt) - from) / 86400000));

const planInterval = (duration) => {
  const days = Number(duration || 0);
  if (days >= 360) return '1_year';
  if (days >= 150) return '6_months';
  if (days > 0) return '1_month';
  return 'none';
};

const publicUser = (user) => {
  if (!user) return null;
  return omit(user, ['passwordHash', 'password', 'hashedPassword']);
};

export class PaymentService {
  razorpayConfigured() {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  toIsoDate(value) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw badRequest('Invalid plan date');
    return date.toISOString();
  }

  daysBetween(start, end) {
    return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000));
  }

  planStartsAt(plan) {
    return plan?.startsAt || plan?.startDate || null;
  }

  planEndsAt(plan) {
    return plan?.endsAt || plan?.endDate || null;
  }

  isPlanExpired(plan, from = new Date()) {
    const endsAt = this.planEndsAt(plan);
    return Boolean(endsAt && new Date(endsAt) <= from);
  }

  isPaidPlan(plan) {
    if (Number(plan?.price) <= 0) return false;
    if (Number(plan?.duration) > 0) return true;
    return Boolean(this.planEndsAt(plan) && !this.isPlanExpired(plan));
  }

  presentPlan(plan) {
    if (!plan) return plan;
    const price = Number(plan.price || 0);
    const startsAt = this.planStartsAt(plan);
    const endsAt = this.planEndsAt(plan);
    return {
      ...plan,
      price,
      amount: price,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      startDate: startsAt || null,
      endDate: endsAt || null,
      interval: planInterval(plan.duration),
      amountPaise: Math.round(price * 100)
    };
  }

  normalizePlanPayload(payload = {}, existing = null) {
    const next = {};
    if (payload.name !== undefined) next.name = payload.name;
    if (payload.currency !== undefined) next.currency = payload.currency;
    if (payload.features !== undefined) next.features = payload.features;
    if (payload.courseAccess !== undefined) next.courseAccess = payload.courseAccess;
    if (payload.isActive !== undefined) next.isActive = payload.isActive;

    const amount = payload.amount ?? payload.price;
    if (amount !== undefined && amount !== null) next.price = Number(amount);

    if (payload.startsAt !== undefined || payload.startDate !== undefined) {
      next.startsAt = this.toIsoDate(payload.startsAt ?? payload.startDate);
    }
    if (payload.endsAt !== undefined || payload.endDate !== undefined) {
      next.endsAt = this.toIsoDate(payload.endsAt ?? payload.endDate);
    }

    const startsAt = next.startsAt !== undefined ? next.startsAt : existing?.startsAt;
    const endsAt = next.endsAt !== undefined ? next.endsAt : existing?.endsAt;
    const datesTouched = payload.startsAt !== undefined
      || payload.startDate !== undefined
      || payload.endsAt !== undefined
      || payload.endDate !== undefined;
    if (payload.duration !== undefined) {
      next.duration = Number(payload.duration);
    } else if (datesTouched && startsAt && endsAt) {
      next.duration = this.daysBetween(startsAt, endsAt);
    } else if (!existing) {
      next.duration = 30;
    }

    return next;
  }

  checkoutConfig() {
    return {
      keyId: process.env.RAZORPAY_KEY_ID || null,
      currency: 'INR',
      configured: this.razorpayConfigured()
    };
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
      searchFields: ['name'],
      orderBy: 'duration',
      order: 'asc'
    });
    const visible = admin
      ? items
      : items.filter((plan) => this.isPaidPlan(plan) && !this.isPlanExpired(plan));
    return {
      items: visible.map((plan) => this.presentPlan(plan)),
      total: admin ? total : visible.length,
      page,
      limit
    };
  }

  async getPlan(planId) {
    const plan = await repos.plans.findById(planId);
    if (!plan) throw notFound('Plan');
    return this.presentPlan(plan);
  }

  createPlan(payload) {
    return repos.plans.create(this.normalizePlanPayload(payload)).then((plan) => this.presentPlan(plan));
  }

  async updatePlan(planId, payload) {
    const existing = await this.getPlan(planId);
    return this.presentPlan(await repos.plans.update(planId, this.normalizePlanPayload(payload, existing)));
  }

  async deletePlan(planId) {
    await this.getPlan(planId);
    const { total } = await repos.subscriptions.findMany({ filters: { planId }, limit: 1 });
    if (total > 0) {
      throw conflict('This plan has subscriptions. Set isActive to false instead of deleting it.');
    }
    await repos.plans.remove(planId);
    return { message: 'Plan deleted' };
  }

  async currentSubscription(userId) {
    if (!userId) return null;
    const { items } = await repos.subscriptions.findMany({
      filters: { userId, status: SUBSCRIPTION_STATUS.ACTIVE },
      limit: 50
    });

    const now = new Date();
    let current = null;

    for (const subscription of items) {
      if (new Date(subscription.endsAt) < now) {
        await repos.subscriptions.update(subscription.id, { status: SUBSCRIPTION_STATUS.EXPIRED });
        continue;
      }
      if (!current || new Date(subscription.endsAt) > new Date(current.endsAt)) {
        current = subscription;
      }
    }

    if (!current) return null;

    const plan = current.planId ? await repos.plans.findById(current.planId) : null;
    if (plan && !this.isPaidPlan(plan)) return null;

    return {
      ...current,
      plan: this.presentPlan(plan),
      daysRemaining: daysRemaining(current.endsAt, now)
    };
  }

  async hasActiveSubscription(userId) {
    const subscription = await this.currentSubscription(userId);
    return Boolean(subscription);
  }

  async accessSnapshot(userId) {
    if (!userId) {
      return { hasActiveSubscription: false, subscription: null };
    }
    const subscription = await this.currentSubscription(userId);
    return {
      hasActiveSubscription: Boolean(subscription),
      subscription
    };
  }

  async paymentHistory(userId, query) {
    const { page, limit } = getPaginationParams(query);
    const { items, total } = await repos.payments.findMany({
      filters: { userId },
      page,
      limit
    });
    return {
      items: await this.enrichPayments(items),
      total,
      page,
      limit
    };
  }

  async createOrder(userId, planId) {
    if (!planId) throw badRequest('planId is required');
    const plan = await this.getPlan(planId);
    if (!plan.isActive) throw badRequest('This plan is not available');
    if (!this.isPaidPlan(plan)) throw badRequest('Choose a paid plan to access courses');
    if (this.isPlanExpired(plan)) throw badRequest('This plan has ended');

    const active = await this.currentSubscription(userId);
    if (active) {
      throw conflict(
        `You already have an active ${active.plan?.name || 'plan'} until ${new Date(active.endsAt).toISOString()}. Buy again after it expires.`
      );
    }

    const amountPaise = Math.round(Number(plan.price) * 100);
    if (amountPaise < 100) throw badRequest('Plan amount must be at least ₹1');
    if (!this.razorpayConfigured()) throw badRequest('Razorpay is not configured');

    const razorpay = await this.getRazorpay();
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: plan.currency || 'INR',
      notes: {
        userId: String(userId),
        planId: String(planId),
        planName: String(plan.name || '')
      }
    });

    const payment = await repos.payments.create({
      userId,
      planId,
      provider: 'razorpay',
      providerOrderId: order.id,
      amount: plan.price,
      currency: plan.currency || 'INR',
      status: PAYMENT_STATUS.CREATED
    });

    return {
      payment,
      plan,
      orderId: order.id,
      amount: amountPaise,
      currency: plan.currency || 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      name: 'SPKS Exams',
      description: `${plan.name} plan`
    };
  }

  async expireOtherSubscriptions(userId, keepId = null) {
    const { items } = await repos.subscriptions.findMany({
      filters: { userId, status: SUBSCRIPTION_STATUS.ACTIVE },
      limit: 50
    });
    await Promise.all(
      items
        .filter((subscription) => subscription.id !== keepId)
        .map((subscription) => repos.subscriptions.update(subscription.id, {
          status: SUBSCRIPTION_STATUS.EXPIRED
        }))
    );
  }

  async activateSubscription(userId, planId, paymentId) {
    const existingPayment = await repos.payments.findById(paymentId);
    if (existingPayment?.status === PAYMENT_STATUS.PAID && existingPayment.subscriptionId) {
      const existing = await repos.subscriptions.findById(existingPayment.subscriptionId);
      if (existing) return existing;
    }

    const plan = await this.getPlan(planId);
    const now = new Date();
    const plannedStart = this.planStartsAt(plan) ? new Date(this.planStartsAt(plan)) : now;
    const startsAt = plannedStart > now ? plannedStart : now;
    const plannedEnd = this.planEndsAt(plan) ? new Date(this.planEndsAt(plan)) : addDays(startsAt, plan.duration || 30);
    if (plannedEnd <= startsAt) throw badRequest('This plan has ended');
    const subscription = await repos.subscriptions.create({
      userId,
      planId,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startsAt: startsAt.toISOString(),
      endsAt: plannedEnd.toISOString()
    });

    await this.expireOtherSubscriptions(userId, subscription.id);
    await repos.payments.update(paymentId, {
      subscriptionId: subscription.id,
      status: PAYMENT_STATUS.PAID
    });
    return subscription;
  }

  async verifyPayment(userId, payload = {}) {
    const razorpayOrderId = payload.razorpayOrderId || payload.razorpay_order_id;
    const razorpayPaymentId = payload.razorpayPaymentId || payload.razorpay_payment_id;
    const razorpaySignature = payload.razorpaySignature || payload.razorpay_signature;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw badRequest('razorpayOrderId, razorpayPaymentId, and razorpaySignature are required');
    }

    const payment = await repos.payments.findOne({ providerOrderId: razorpayOrderId, userId });
    if (!payment) throw notFound('Payment');

    if (payment.status === PAYMENT_STATUS.PAID) {
      const subscription = payment.subscriptionId
        ? await repos.subscriptions.findById(payment.subscriptionId)
        : await this.currentSubscription(userId);
      return {
        payment: await repos.payments.findById(payment.id),
        subscription
      };
    }

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
    return {
      payment: await repos.payments.findById(payment.id),
      subscription: {
        ...subscription,
        plan: await this.getPlan(payment.planId),
        daysRemaining: daysRemaining(subscription.endsAt)
      }
    };
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

  async loadMap(repo, ids) {
    const unique = [...new Set((ids || []).filter(Boolean))];
    const entries = await Promise.all(
      unique.map(async (id) => {
        try {
          return [id, await repo.findById(id)];
        } catch {
          return [id, null];
        }
      })
    );
    return Object.fromEntries(entries);
  }

  async enrichSubscriptions(items) {
    const users = await this.loadMap(repos.users, items.map((item) => item.userId));
    const plans = await this.loadMap(repos.plans, items.map((item) => item.planId));
    const now = new Date();

    return items.map((item) => {
      const expired = item.status === SUBSCRIPTION_STATUS.ACTIVE && new Date(item.endsAt) < now;
      return {
        ...item,
        status: expired ? SUBSCRIPTION_STATUS.EXPIRED : item.status,
        daysRemaining: item.status === SUBSCRIPTION_STATUS.ACTIVE && !expired
          ? daysRemaining(item.endsAt, now)
          : 0,
        user: publicUser(users[item.userId]),
        plan: this.presentPlan(plans[item.planId])
      };
    });
  }

  async enrichPayments(items) {
    const users = await this.loadMap(repos.users, items.map((item) => item.userId));
    const plans = await this.loadMap(repos.plans, items.map((item) => item.planId));
    const subscriptions = await this.loadMap(
      repos.subscriptions,
      items.map((item) => item.subscriptionId)
    );

    return items.map((item) => ({
      ...item,
      user: publicUser(users[item.userId]),
      plan: this.presentPlan(plans[item.planId]),
      subscription: subscriptions[item.subscriptionId] || null
    }));
  }

  async adminSubscriptions(query) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.status) filters.status = query.status;
    if (query.userId) filters.userId = query.userId;
    if (query.planId) filters.planId = query.planId;
    const { items, total } = await repos.subscriptions.findMany({ filters, page, limit });
    return {
      items: await this.enrichSubscriptions(items),
      total,
      page,
      limit
    };
  }

  async adminPayments(query) {
    const { page, limit } = getPaginationParams(query);
    const filters = {};
    if (query.status) filters.status = query.status;
    if (query.userId) filters.userId = query.userId;
    if (query.planId) filters.planId = query.planId;
    const { items, total } = await repos.payments.findMany({ filters, page, limit });
    return {
      items: await this.enrichPayments(items),
      total,
      page,
      limit
    };
  }

  async adminUserBilling(userId) {
    const user = await repos.users.findById(userId);
    if (!user) throw notFound('User');
    const [subscription, payments, subscriptions] = await Promise.all([
      this.currentSubscription(userId),
      this.adminPayments({ userId, page: 1, limit: 50 }),
      this.adminSubscriptions({ userId, page: 1, limit: 50 })
    ]);
    return {
      user: publicUser(user),
      hasActiveSubscription: Boolean(subscription),
      subscription,
      subscriptions: subscriptions.items,
      payments: payments.items
    };
  }
}

export default new PaymentService();
