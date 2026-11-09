import { Router } from 'express'
import * as authController from '../controllers/auth.controller.js'
import { authLimiter } from '../middleware/rateLimit.js'
import { requireAuth } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { loginValidators, registerValidators } from '../validators/auth.validators.js'

const router = Router()

router.post('/register', authLimiter, registerValidators, validate, authController.register)
router.post('/login', authLimiter, loginValidators, validate, authController.login)
router.post('/logout', requireAuth, authController.logout)
router.get('/me', requireAuth, authController.me)

export default router
