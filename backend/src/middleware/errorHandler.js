import { ApiError } from '../utils/ApiError.js'

// Central error handler — never leak stack traces to clients.
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
    })
  }

  if (err && err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' })
  }

  if (err && /not allowed by CORS/i.test(err.message || '')) {
    return res.status(403).json({ error: 'Origin not allowed' })
  }

  if (err && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image too large (max 5MB)' })
  }

  console.error('[error]', err)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message || 'Unexpected error',
  })
}
