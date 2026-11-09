import { Router } from 'express'
import * as supportController from '../controllers/support.controller.js'
import { validate } from '../middleware/validate.js'
import { body, param, query } from 'express-validator'

const router = Router()

// Public: submit a support ticket
router.post(
  '/',
  body('name').trim().isLength({ min: 1, max: 120 }).withMessage('Name is required.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.'),
  body('subject').trim().isLength({ min: 1, max: 200 }).withMessage('Subject is required.'),
  body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be 5–2000 characters.'),
  validate,
  supportController.createSupportTicket,
)

// Admin: list and manage tickets
router.get('/', query('status').optional().isIn(['open', 'replied', 'closed']), validate, supportController.listSupportTickets)
router.patch(
  '/:id/status',
  param('id').isUUID().withMessage('Invalid ticket id'),
  body('status').isIn(['open', 'replied', 'closed']).withMessage('Invalid status.'),
  validate,
  supportController.updateTicketStatus,
)
router.delete('/:id', param('id').isUUID().withMessage('Invalid ticket id'), validate, supportController.deleteSupportTicket)

export default router
