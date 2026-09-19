import { body } from 'express-validator';

export const createOrderValidator = [
  body('planId').isUUID().withMessage('planId is required')
];

export const verifyPaymentValidator = [
  body('razorpayOrderId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpayOrderId is required'),
  body('razorpay_order_id')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpay_order_id is required'),
  body('razorpayPaymentId')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpayPaymentId is required'),
  body('razorpay_payment_id')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpay_payment_id is required'),
  body('razorpaySignature')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpaySignature is required'),
  body('razorpay_signature')
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage('razorpay_signature is required'),
  body().custom((value) => {
    const orderId = value?.razorpayOrderId || value?.razorpay_order_id;
    const paymentId = value?.razorpayPaymentId || value?.razorpay_payment_id;
    const signature = value?.razorpaySignature || value?.razorpay_signature;
    if (!orderId || !paymentId || !signature) {
      throw new Error('razorpayOrderId, razorpayPaymentId, and razorpaySignature are required');
    }
    return true;
  })
];
