import jwt from 'jsonwebtoken'
import env from '../config/env.js'
import { supabaseAdmin } from '../config/supabase.js'
import { ApiError, asyncHandler } from '../utils/ApiError.js'

function extractToken(req) {
  const header = req.headers.authorization || ''
  const [scheme, token] = header.split(' ')
  if (scheme !== 'Bearer' || !token) return null
  return token
}

// Verifies the Supabase access token and attaches the user to the request.
// Profile (incl. role) is loaded server-side with the service-role client so
// the role can never be spoofed by the client.
export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) throw ApiError.unauthorized('Missing bearer token')

  let payload
  try {
    payload = jwt.verify(token, env.supabase.jwtSecret, { algorithms: ['HS256'] })
  } catch {
    throw ApiError.unauthorized('Invalid or expired token')
  }

  if (!payload.sub) throw ApiError.unauthorized('Invalid token payload')

  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, role')
    .eq('id', payload.sub)
    .single()

  if (error || !profile) throw ApiError.unauthorized('User profile not found')

  req.user = {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
  }
  next()
})

// Restricts a route to administrators (role stored in profiles.role).
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(ApiError.forbidden('Administrator access required'))
  }
  next()
}

// Optional auth — attaches req.user when a valid token is present.
export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extractToken(req)
  if (!token) return next()
  try {
    const payload = jwt.verify(token, env.supabase.jwtSecret, { algorithms: ['HS256'] })
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('id', payload.sub)
      .single()
    if (profile) {
      req.user = {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        role: profile.role,
      }
    }
  } catch {
    // fall through as guest
  }
  next()
})
