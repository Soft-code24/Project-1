import { Router } from 'express'
import * as paymentController from '../controllers/payment.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { paymentLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import {
  initializePaymentValidators,
  verifyPaymentValidators,
} from '../validators/order.validators.js'

const router = Router()

// Initialize a Paystack transaction for an order
router.post(
  '/paystack/initialize',
  requireAuth,
  paymentLimiter,
  initializePaymentValidators,
  validate,
  paymentController.initializePaystack,
)
router.post(
  '/paystack/initialize/:id',
  requireAuth,
  paymentLimiter,
  verifyPaymentValidators,
  validate,
  paymentController.initializePaystack,
)

// Verify a transaction (called from the checkout return page)
router.get(
  '/paystack/verify/:reference',
  requireAuth,
  paymentLimiter,
  verifyPaymentValidators,
  validate,
  paymentController.verifyPaystack,
)

// Paystack webhook — signature verified, no auth token required
router.post('/paystack/webhook', paymentController.paystackWebhook)

// Admin: cleanup abandoned pending orders (release coupon reservations + restore stock)
// Only targets online payment orders older than abandonedOrderTimeoutMinutes.
// COD orders are never auto-cancelled.
router.post(
  '/coupons/cleanup-abandoned',
  requireAuth,
  requireAdmin,
  paymentController.cleanupAbandonedOrders,
)

export default router
