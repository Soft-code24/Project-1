import { body, param } from 'express-validator'
import { BUSINESS_RULES } from '../config/env.js'

export const createOrderValidators = [
  body('items')
    .isArray({ min: 1, max: BUSINESS_RULES.maxCartItems })
    .withMessage('Your cart is empty or has too many items.'),
  body('items.*.product_id')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Invalid product in cart.'),
  body('items.*.quantity').isInt({ min: 1, max: 30 }).withMessage('Quantity must be between 1 and 30.'),
  body('contact.name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter the name for this order.'),
  body('contact.email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('contact.phone').trim().isLength({ min: 7, max: 20 }).withMessage('Enter a reachable phone number.'),
  body('delivery.address').trim().isLength({ min: 5, max: 300 }).withMessage('Enter a delivery address.'),
  body('delivery.city').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your city or area.'),
  body('delivery.instructions').optional().trim().isLength({ max: 300 }),
  body('notes').optional().trim().isLength({ max: 300 }),
  body('payment_method')
    .optional()
    .isIn(BUSINESS_RULES.paymentMethods)
    .withMessage('Unsupported payment method.'),
  body('promo_code').optional().trim().isLength({ max: 40 }),
  body('idempotencyKey')
    .optional()
    .trim()
    .isUUID()
    .withMessage('Invalid idempotency key'),
  body('idempotencyHash')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Idempotency hash is required when idempotency key is provided'),
]

export const orderIdValidators = [param('id').isUUID().withMessage('Invalid order id')]

export const initializePaymentValidators = [
  body('order_id').optional().isUUID(),
]

export const verifyPaymentValidators = [
  param('reference').trim().isLength({ min: 4, max: 100 }).withMessage('Invalid payment reference.'),
]
