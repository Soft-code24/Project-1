import { Router } from 'express'
import * as customerProfileController from '../controllers/customerProfile.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { body } from 'express-validator'

const router = Router()

// Customer updates their own profile (full_name, phone)
router.patch(
  '/profile',
  requireAuth,
  body('full_name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
  body('phone').optional().trim().isLength({ max: 20 }).withMessage('Phone must be at most 20 characters'),
  validate,
  customerProfileController.updateCustomerProfile,
)

export default router
