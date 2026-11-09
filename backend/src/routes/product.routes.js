import { Router } from 'express'
import * as productController from '../controllers/product.controller.js'
import { requireAuth, requireAdmin, optionalAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createProductValidators,
  listProductsValidators,
  productIdValidators,
  stockValidators,
  updateProductValidators,
} from '../validators/product.validators.js'

const router = Router()

// Public catalogue
router.get('/', optionalAuth, listProductsValidators, validate, productController.listProducts)
router.get('/:id', productIdValidators, validate, productController.getProduct)

// Admin-only product management
router.post('/', requireAuth, requireAdmin, createProductValidators, validate, productController.createProduct)
router.put('/:id', requireAuth, requireAdmin, updateProductValidators, validate, productController.updateProduct)
router.delete('/:id', requireAuth, requireAdmin, productIdValidators, validate, productController.deleteProduct)
router.patch('/:id/stock', requireAuth, requireAdmin, stockValidators, validate, productController.updateStock)
router.post(
  '/:id/image',
  requireAuth,
  requireAdmin,
  productIdValidators,
  validate,
  productController.uploadProductImage,
  productController.uploadImage,
)

export default router
