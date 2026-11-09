import { ApiError } from '../utils/ApiError.js'

// Catch-all for unmatched API routes
export function notFound(req, res, next) {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`))
}
