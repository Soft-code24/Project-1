import { body } from 'express-validator'

export const registerValidators = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Enter your full name.'),
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').isLength({ min: 6, max: 72 }).withMessage('Password must be at least 6 characters.'),
  body('phone').optional().trim().isLength({ min: 7, max: 20 }).withMessage('Enter a valid phone number.'),
]

export const loginValidators = [
  body('email').trim().isEmail().withMessage('Enter a valid email address.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
]
