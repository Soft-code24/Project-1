import { asyncHandler } from '../utils/ApiError.js'
import { supabaseAnon, supabaseAdmin } from '../config/supabase.js'

async function fetchProfile(userId) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, role')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return data
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body

  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: { data: { full_name: name, phone: phone || null } },
  })
  if (error) {
    return res.status(400).json({ error: error.message })
  }

  // The `handle_new_user` database trigger creates the profiles row.
  if (!data.session) {
    return res.status(201).json({
      message: 'Account created. Check your email to confirm your account before logging in.',
    })
  }

  const profile = await fetchProfile(data.user.id)
  res.status(201).json({
    user: {
      id: data.user.id,
      email,
      fullName: profile?.full_name || name,
      role: profile?.role || 'customer',
    },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  })
})

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password })
  if (error || !data.session) {
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const profile = await fetchProfile(data.user.id)
  if (!profile) {
    return res.status(403).json({ error: 'No profile found for this account.' })
  }

  res.json({
    user: {
      id: profile.id,
      email: profile.email,
      fullName: profile.full_name,
      role: profile.role,
    },
    token: data.session.access_token,
    refreshToken: data.session.refresh_token,
  })
})

export const logout = asyncHandler(async (req, res) => {
  // JWTs are stateless: the client discards the token. We also try to revoke
  // the session server-side so the token cannot be refreshed.
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '')
    if (token) await supabaseAdmin.auth.admin.signOut(token)
  } catch {
    // revocation is best-effort
  }
  res.json({ message: 'Logged out' })
})

export const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user })
})
