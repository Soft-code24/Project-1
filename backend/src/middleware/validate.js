import { validationResult } from 'express-validator'
import { ApiError } from '../utils/ApiError.js'

// Runs after express-validator chains — returns 422 with field-level errors.
export function validate(req, res, next) {
  const result = validationResult(req)
  if (result.isEmpty()) return next()

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }))
  return next(new ApiError(422, 'Validation failed', errors))
}
