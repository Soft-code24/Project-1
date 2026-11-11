import { Router } from 'express'
import * as couponController from '../controllers/coupon.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { body, param } from 'express-validator'

const router = Router()

// All admin coupon routes require an authenticated administrator
router.use(requireAuth, requireAdmin)

// List coupons with optional filters
router.get(
  '/',
  couponController.listCoupons,
)

// Create a new coupon
router.post(
  '/',
  requireAdmin,
  body('code').trim().isLength({ min: 3, max: 40 }).withMessage('Code must be 3-40 characters'),
  body('type').isIn(['percentage', 'fixed_amount']).withMessage('Invalid coupon type'),
  body('discount_value').isFloat({ gt: 0 }).withMessage('Discount value must be positive'),
  body('min_order_amount').optional({ nullable: true }).isFloat({ gte: 0 }).withMessage('Invalid minimum order amount'),
  body('max_discount').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('Invalid maximum discount'),
  body('starts_at').optional().isISO8601().withMessage('Invalid start date'),
  body('expires_at').optional().isISO8601().withMessage('Invalid expiry date'),
  body('usage_limit').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Invalid usage limit'),
  body('per_customer_limit').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Invalid per-customer limit'),
  body('first_order_only').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
  validate,
  couponController.createCoupon,
)

// Update a coupon
router.patch(
  '/:id',
  requireAdmin,
  param('id').isUUID().withMessage('Invalid coupon id'),
  body('code').optional().trim().isLength({ min: 3, max: 40 }).withMessage('Invalid code length'),
  body('type').optional().isIn(['percentage', 'fixed_amount']).withMessage('Invalid coupon type'),
  body('discount_value').optional().isFloat({ gt: 0 }).withMessage('Discount value must be positive'),
  body('min_order_amount').optional({ nullable: true }).isFloat({ gte: 0 }).withMessage('Invalid minimum order amount'),
  body('max_discount').optional({ nullable: true }).isFloat({ gt: 0 }).withMessage('Invalid maximum discount'),
  body('starts_at').optional().isISO8601().withMessage('Invalid start date'),
  body('expires_at').optional().isISO8601().withMessage('Invalid expiry date'),
  body('usage_limit').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Invalid usage limit'),
  body('per_customer_limit').optional({ nullable: true }).isInt({ gt: 0 }).withMessage('Invalid per-customer limit'),
  body('first_order_only').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
  validate,
  couponController.updateCoupon,
)

// Toggle coupon active status
router.patch(
  '/:id/activate',
  requireAdmin,
  param('id').isUUID().withMessage('Invalid coupon id'),
  body('is_active').isBoolean().withMessage('is_active must be boolean'),
  validate,
  couponController.toggleCouponActive,
)

// Delete coupon — only if unused
router.delete(
  '/:id',
  requireAdmin,
  param('id').isUUID().withMessage('Invalid coupon id'),
  validate,
  couponController.deleteCoupon,
)

// Coupon campaign statistics
router.get(
  '/stats',
  requireAdmin,
  couponController.getCouponStats,
)

export default router
