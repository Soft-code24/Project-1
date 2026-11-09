import { Router } from 'express'
import * as collectionController from '../controllers/collection.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { param, body, query } from 'express-validator'

const router = Router()

// Public catalogue
router.get('/', query('is_published').optional().isIn(['true', 'false']), validate, collectionController.listCollections)
router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid collection id'),
  query('include_products').optional().isIn(['true', 'false']),
  validate,
  collectionController.getCollection,
)

// Admin-only collection management
router.post(
  '/',
  requireAuth,
  requireAdmin,
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Collection name is required.'),
  body('handle').trim().isLength({ min: 1, max: 120 }).withMessage('Collection handle is required.'),
  body('type').optional().isIn(['manual', 'smart']),
  body('is_published').optional().isBoolean(),
  body('sort_order').optional().isInt({ min: 0 }),
  validate,
  collectionController.createCollection,
)

router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  param('id').isUUID().withMessage('Invalid collection id'),
  validate,
  collectionController.updateCollection,
)

router.delete('/:id', requireAuth, requireAdmin, param('id').isUUID(), validate, collectionController.deleteCollection)

// Product <-> collection membership
router.post(
  '/:id/products',
  requireAuth,
  requireAdmin,
  param('id').isUUID().withMessage('Invalid collection id'),
  body('product_id').isUUID().withMessage('Valid product id is required.'),
  body('position').optional().isInt({ min: 0 }),
  validate,
  collectionController.addProductToCollection,
)

router.delete(
  '/:id/products/:productId',
  requireAuth,
  requireAdmin,
  param('id').isUUID().withMessage('Invalid collection id'),
  param('productId').isUUID().withMessage('Invalid product id'),
  validate,
  collectionController.removeProductFromCollection,
)

export default router
