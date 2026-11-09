import { Router } from 'express'
import * as categoryController from '../controllers/category.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { body, param } from 'express-validator'

const router = Router()

router.get('/', categoryController.listCategories)

// Admin-managed categories
router.post(
  '/',
  requireAuth,
  requireAdmin,
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Category name is required.'),
  body('slug').trim().isLength({ min: 2, max: 80 }).withMessage('Category slug is required.'),
  body('sort_order').optional().isInt({ min: 0 }),
  validate,
  categoryController.createCategory,
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  param('id').isUUID(),
  validate,
  categoryController.updateCategory,
)

router.delete('/:id', requireAuth, requireAdmin, param('id').isUUID(), validate, categoryController.deleteCategory)

export default router
