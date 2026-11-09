import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import env, { BUSINESS_RULES } from './config/env.js'
import routes from './routes/index.js'
import { notFound } from './middleware/notFound.js'
import { errorHandler } from './middleware/errorHandler.js'
import { apiLimiter } from './middleware/rateLimit.js'

const app = express()

// Behind Render / Vercel proxies we need the real client IP for rate limiting.
app.set('trust proxy', 1)
app.disable('x-powered-by')

// Security headers
app.use(helmet())

// CORS — only the configured storefront origins may call this API
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true)
      return callback(new Error(`Origin ${origin} is not allowed by CORS`))
    },
    credentials: true,
  }),
)

// Body parsing — keep the raw body available for Paystack webhook signatures.
app.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      req.rawBody = buf.toString('utf8')
    },
  }),
)
app.use(express.urlencoded({ extended: true }))

// Request logging (skip in tests for quiet output)
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'))
}

// Global rate limit
app.use('/api/', apiLimiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'savorbite-api', env: env.nodeEnv, time: new Date().toISOString() })
})

// API routes
app.use('/api/v1', routes)

// 404 + central error handling
app.use(notFound)
app.use(errorHandler)

export { app, BUSINESS_RULES }
