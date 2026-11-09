import { Router } from 'express'
import { body, param, query } from 'express-validator'
import * as adminController from '../controllers/admin.controller.js'
import * as blogController from '../controllers/blog.controller.js'
import * as supportController from '../controllers/support.controller.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { BUSINESS_RULES } from '../config/env.js'

const router = Router()

// Every admin route requires an authenticated administrator
router.use(requireAuth, requireAdmin)

router.get('/orders', query('status').optional().isLength({ max: 40 }), validate, adminController.listOrders)
router.get('/stats', adminController.stats)
router.patch(
  '/orders/:id/status',
  param('id').isUUID().withMessage('Invalid order id'),
  body('status').isIn(BUSINESS_RULES.orderStatuses).withMessage('Invalid status'),
  validate,
  adminController.updateOrderStatus,
)

// Blog management
router.get('/blog', blogController.listBlogPosts)
router.post(
  '/blog',
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required.'),
  body('slug').trim().isLength({ min: 1, max: 200 }).withMessage('Slug is required.'),
  body('published').optional().isBoolean(),
  validate,
  blogController.createBlogPost,
)
router.patch('/blog/:id', param('id').isUUID(), validate, blogController.updateBlogPost)
router.delete('/blog/:id', param('id').isUUID(), validate, blogController.deleteBlogPost)

// Support ticket management
router.get('/support', query('status').optional().isIn(['open', 'replied', 'closed']), validate, supportController.listSupportTickets)
router.patch(
  '/support/:id/status',
  param('id').isUUID().withMessage('Invalid ticket id'),
  body('status').isIn(['open', 'replied', 'closed']).withMessage('Invalid status.'),
  validate,
  supportController.updateTicketStatus,
)
router.delete('/support/:id', param('id').isUUID(), validate, supportController.deleteSupportTicket)

export default router
