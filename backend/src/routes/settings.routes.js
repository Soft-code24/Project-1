import { Router } from 'express'
import * as settingsController from '../controllers/settings.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { body } from 'express-validator'

const router = Router()

// Public read-only settings for the storefront
router.get('/', settingsController.getSettings)

// Admin-only settings mutation (every route below is admin-protected)
router.use(requireAuth, requireAdmin)

router.patch(
  '/',
  body('restaurant_name').optional().trim().isLength({ min: 1, max: 120 }),
  body('tagline').optional().trim().isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('contact_email').optional().isEmail().normalizeEmail(),
  body('contact_phone').optional().trim().isLength({ min: 3, max: 40 }),
  body('whatsapp').optional().trim().isLength({ min: 3, max: 40 }),
  body('address').optional().trim().isLength({ max: 200 }),
  body('city').optional().trim().isLength({ min: 1, max: 80 }),
  body('delivery_available').optional().isBoolean(),
  body('pickup_available').optional().isBoolean(),
  body('delivery_fee').optional().isNumeric({ min: 0 }).toFloat(),
  body('free_delivery_threshold').optional().isNumeric({ min: 0 }).toFloat(),
  body('min_order_amount').optional().isNumeric({ min: 0 }).toFloat(),
  body('estimated_prep_time').optional().trim().isLength({ max: 80 }),
  body('primary_color').optional().matches(/^#[0-9a-f]{6}$/i),
  body('accent_color').optional().matches(/^#[0-9a-f]{6}$/i),
  body('socials').optional(),
  body('hours').optional(),
  validate,
  settingsController.updateSettings,
)

router.post(
  '/logo',
  settingsController.uploadSettingsLogo,
  settingsController.uploadLogo,
)

export default router
