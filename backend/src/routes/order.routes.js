import { Router } from 'express'
import * as orderController from '../controllers/order.controller.js'
import { requireAuth } from '../middleware/auth.js'
import { orderLimiter } from '../middleware/rateLimit.js'
import { validate } from '../middleware/validate.js'
import { createOrderValidators, orderIdValidators } from '../validators/order.validators.js'

const router = Router()

// All order routes require a signed-in customer
router.post('/', requireAuth, orderLimiter, createOrderValidators, validate, orderController.createOrder)
router.get('/', requireAuth, orderController.listMyOrders)
router.get('/:id', requireAuth, orderIdValidators, validate, orderController.getMyOrder)

export default router
