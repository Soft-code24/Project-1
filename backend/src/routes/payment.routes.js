import { Router } from 'express'
import * as paymentController from '../controllers/payment.controller.js'
import { requireAuth } from '../middleware/auth.js'
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

export default router
