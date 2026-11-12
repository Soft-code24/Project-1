import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'

export const updateCustomerProfile = asyncHandler(async (req, res) => {
  const { full_name, phone } = req.body

  const updates = {}
  if (full_name !== undefined) updates.full_name = full_name.trim()
  if (phone !== undefined) updates.phone = phone.trim() || null

  if (Object.keys(updates).length === 0) {
    throw ApiError.badRequest('No fields to update')
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update(updates)
    .eq('id', req.user.id)
    .eq('role', 'customer')
    .select('id, full_name, email, phone, role, account_status')
    .single()

  if (error || !data) throw ApiError.notFound('Profile not found')

  res.json({
    profile: {
      id: data.id,
      fullName: data.full_name || null,
      email: data.email,
      phone: data.phone,
      role: data.role,
      accountStatus: data.account_status,
    },
  })
})
