export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message)
    this.statusCode = statusCode
    this.details = details
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details)
  }

  static unauthorized(message = 'Authentication required') {
    return new ApiError(401, message)
  }

  static forbidden(message = 'You do not have access to this resource') {
    return new ApiError(403, message)
  }

  static notFound(message = 'Resource not found') {
    return new ApiError(404, message)
  }

  static conflict(message, details) {
    return new ApiError(409, message, details)
  }
}

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Maps Postgres error codes to meaningful HTTP errors
export function mapSupabaseError(error, fallbackMessage = 'Database error') {
  if (!error) return null
  const postgrestCode = error.code || ''
  const statusMap = {
    '23505': 409, // unique_violation
    '23503': 400, // foreign_key_violation
    '23514': 400, // check_violation
    '42501': 403, // insufficient_privilege
    PGRST116: 404, // no rows returned
  }
  const status = statusMap[postgrestCode] || 500
  const message =
    status === 500 ? fallbackMessage : error.message || fallbackMessage
  return new ApiError(status, message)
}
