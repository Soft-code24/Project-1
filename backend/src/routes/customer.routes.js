import { Router } from 'express'
import * as customerController from '../controllers/customer.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { query, param, body } from 'express-validator'

const router = Router()

// All customer routes require an authenticated administrator
router.use(requireAuth, requireAdmin)

router.get(
  '/',
  query('search').optional().trim(),
  query('segment').optional().isIn(['VIP', 'Loyal', 'Returning', 'Inactive', 'New']),
  query('spend').optional().isIn(['0-5000', '5000-15000', '15000-50000', '50000-100000', '100000+']),
  query('sort').optional().isIn(['created_at', 'name', 'email', 'totalSpent', 'orderCount']),
  query('order').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  customerController.listCustomers,
)

router.get('/stats', customerController.customerStats)

router.get(
  '/:id',
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.getCustomerDetail,
)

router.get(
  '/:id/orders',
  param('id').isUUID().withMessage('Invalid customer id'),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate,
  customerController.getCustomerOrders,
)

// ---- Customer notes (internal admin-only) ----
router.get(
  '/:id/notes',
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.listCustomerNotes,
)

router.post(
  '/:id/notes',
  param('id').isUUID().withMessage('Invalid customer id'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Note content is required (1-2000 chars)'),
  validate,
  customerController.createCustomerNote,
)

router.put(
  '/notes/:noteId',
  param('noteId').isUUID().withMessage('Invalid note id'),
  param('id').isUUID().withMessage('Invalid customer id'),
  body('content').trim().isLength({ min: 1, max: 2000 }).withMessage('Note content is required (1-2000 chars)'),
  validate,
  customerController.updateCustomerNote,
)

router.delete(
  '/notes/:noteId',
  param('noteId').isUUID().withMessage('Invalid note id'),
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.deleteCustomerNote,
)

// ---- Customer account status ----
router.patch(
  '/:id/suspend',
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.suspendCustomerAccount,
)

router.patch(
  '/:id/reactivate',
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.reactivateCustomerAccount,
)

// ---- Delete customer account (admin-only) ----
router.delete(
  '/:id',
  param('id').isUUID().withMessage('Invalid customer id'),
  validate,
  customerController.deleteCustomerAccount,
)

export default router
