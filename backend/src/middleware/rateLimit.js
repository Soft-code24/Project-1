import rateLimit from 'express-rate-limit'

const windowMs = 15 * 60 * 1000

// Broad API protection
export const apiLimiter = rateLimit({
  windowMs,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests — please try again later.' },
})

// Brute-force protection for login/register
export const authLimiter = rateLimit({
  windowMs,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts — please try again in a few minutes.' },
})

// Order spam protection
export const orderLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many orders placed — please wait a moment.' },
})

// Payment endpoint protection
export const paymentLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many payment requests — please try again later.' },
})

// Coupon validation protection (customer-facing)
export const couponLimiter = rateLimit({
  windowMs,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many coupon validation requests — please try again later.' },
})
