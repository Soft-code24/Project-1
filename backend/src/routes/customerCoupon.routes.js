import { Router } from 'express'
import * as couponController from '../controllers/coupon.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { couponLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { body } from 'express-validator'

const router = Router()

// Customer-facing coupon validation — authenticated customers only
router.post(
  '/validate',
  requireAuth,
  couponLimiter,
  body('code').trim().isLength({ min: 3, max: 40 }).withMessage('Invalid coupon code'),
  body('items').optional().isArray().withMessage('Items must be an array'),
  body('items.*.product_id').optional().isUUID().withMessage('Invalid product ID'),
  body('items.*.quantity').optional().isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  validate,
  couponController.validateCoupon,
)

export default router
