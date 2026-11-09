import { body, param, query } from 'express-validator'
import { BUSINESS_RULES } from '../config/env.js'

export const listProductsValidators = [
  query('search').optional().trim().isLength({ max: 120 }),
  query('category').optional().trim().isLength({ max: 60 }),
  query('collection').optional().trim().isLength({ max: 60 }),
  query('tag').optional().trim().isLength({ max: 40 }),
  query('sort').optional().isIn(['recommended', 'price-low', 'price-high', 'top-rated']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  query('include_inactive').optional().isIn(['true', 'false']),
]

export const productIdValidators = [param('id').isUUID().withMessage('Invalid product id')]

export const createProductValidators = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Dish name is required.'),
  body('category_id').isUUID().withMessage('A valid category is required.'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number.'),
  body('compare_at_price').optional({ nullable: true, values: 'falsy' }).isFloat({ min: 0 }),
  body('stock').optional().isInt({ min: 0 }).withMessage('Stock must be 0 or more.'),
  body('short_description').optional().trim().isLength({ max: 160 }),
  body('description').optional().trim().isLength({ max: 2000 }),
  body('image_url').optional().trim().isLength({ max: 500 }),
  body('tags').optional().isArray({ max: 8 }).withMessage('Tags must be an array.'),
  body('is_featured').optional().isBoolean(),
  body('is_active').optional().isBoolean(),
  body('serving').optional().trim().isLength({ max: 60 }),
  body('prep_time').optional().trim().isLength({ max: 60 }),
]

export const updateProductValidators = [
  ...productIdValidators,
  ...createProductValidators.map((v) => v.optional()),
]

export const stockValidators = [
  ...productIdValidators,
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more.'),
]

export const statusList = BUSINESS_RULES.orderStatuses
