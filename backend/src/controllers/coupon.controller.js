import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { mapSupabaseError } from '../utils/ApiError.js'

// ---------------------------------------------------------------------------
// List coupons (admin)
// ---------------------------------------------------------------------------
export const listCoupons = asyncHandler(async (req, res) => {
  const { search, is_active, type, page = 1, limit = 20 } = req.query

  let q = supabaseAdmin.from('coupons').select('*', { count: 'exact' })

  if (search) q = q.ilike('code', `%${search}%`)
  if (is_active !== undefined) q = q.eq('is_active', is_active === 'true')
  if (type) q = q.eq('type', type)

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  q = q.range(offset, offset + limitNum - 1).order('created_at', { ascending: false })

  const { data, error, count } = await q
  if (error) throw mapSupabaseError(error, 'Could not load coupons')

  res.json({
    coupons: data || [],
    meta: {
      total: count || 0,
      page: pageNum,
      per_page: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    },
  })
})

// ---------------------------------------------------------------------------
// Validate a coupon for the authenticated customer (customer-facing, no writes)
// ---------------------------------------------------------------------------
export const validateCoupon = asyncHandler(async (req, res) => {
  const userId = req.user.id
  const { code, items = [] } = req.body

  // Customer profile + suspension check
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, account_status, role')
    .eq('id', userId)
    .single()
  if (profileError || !profile) throw ApiError.notFound('Customer profile not found')
  if (profile.account_status === 'suspended') {
    throw ApiError.badRequest('Your account is suspended and cannot use coupons.')
  }

  // Fetch coupon by code (citext = case-insensitive)
  const { data: coupon, error: couponError } = await supabaseAdmin
    .from('coupons')
    .select('*')
    .eq('code', code)
    .single()
  if (couponError || !coupon) throw ApiError.badRequest('Invalid coupon code.')

  if (!coupon.is_active) {
    throw ApiError.badRequest('This coupon is no longer active.')
  }

  const now = new Date()
  if (coupon.starts_at && new Date(coupon.starts_at) > now) {
    throw ApiError.badRequest('This coupon is not yet valid.')
  }
  if (coupon.expires_at && new Date(coupon.expires_at) < now) {
    throw ApiError.badRequest('This coupon has expired.')
  }

  // --- Compute subtotal from real database product prices (never trust client) ---
  let subtotalKobo = 0
  if (Array.isArray(items) && items.length > 0) {
    const productIds = items.map((item) => item.product_id)
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, price, stock, is_active')
      .in('id', productIds)
    if (productsError) throw ApiError.badRequest('Could not validate cart items')

    const byId = new Map(products.map((p) => [p.id, p]))

    for (const item of items) {
      const product = byId.get(item.product_id)
      if (!product || !product.is_active) {
        throw ApiError.badRequest(`Item ${item.product_id} is no longer available`)
      }
      const qty = Number(item.quantity) || 1
      if (product.stock < qty) {
        throw ApiError.badRequest(`${product.name} only has ${product.stock} left in stock`)
      }
      subtotalKobo += Math.round(Number(product.price) * 100) * qty
    }
  }

  const subtotalNaira = subtotalKobo / 100

  // Minimum order requirement
  if (
    coupon.min_order_amount !== null &&
    coupon.min_order_amount !== undefined &&
    subtotalKobo < Math.round(Number(coupon.min_order_amount) * 100)
  ) {
    throw ApiError.badRequest(
      `Minimum order of ₦${Number(coupon.min_order_amount).toFixed(2)} required for this coupon.`,
    )
  }

  // Total usage limit not exceeded
  if (
    coupon.usage_limit !== null &&
    coupon.usage_limit !== undefined &&
    coupon.usage_count >= coupon.usage_limit
  ) {
    throw ApiError.badRequest('This coupon has reached its total usage limit.')
  }

  // Per-customer usage limit not exceeded (completed redemptions only)
  if (coupon.per_customer_limit) {
    const { data: redemptions, error: redemptionError } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('customer_id', userId)
      .not('order_id', 'is', null)
    if (redemptionError) throw ApiError.badRequest('Could not validate coupon usage')
    if (redemptions.length >= coupon.per_customer_limit) {
      throw ApiError.badRequest('You have reached the usage limit for this coupon.')
    }
  }

  // First-order-only restriction
  if (coupon.first_order_only) {
    const { data: existingOrders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
    if (ordersError) throw ApiError.badRequest('Could not validate order history')
    if (existingOrders && existingOrders.length > 0) {
      throw ApiError.badRequest('This coupon is for first-time customers only.')
    }
  }

  // --- Discount calculation using integer kobo arithmetic ---
  let discountKobo = 0
  if (coupon.type === 'percentage') {
    discountKobo = Math.round((subtotalKobo * Number(coupon.discount_value)) / 100)
  } else if (coupon.type === 'fixed_amount') {
    discountKobo = Math.round(Number(coupon.discount_value) * 100)
  }

  // Apply maximum discount cap where configured
  if (coupon.max_discount !== null && coupon.max_discount !== undefined) {
    const maxKobo = Math.round(Number(coupon.max_discount) * 100)
    discountKobo = Math.min(discountKobo, maxKobo)
  }

  // Discount never exceeds eligible subtotal
  discountKobo = Math.min(discountKobo, subtotalKobo)
  discountKobo = Math.max(discountKobo, 0)

  const discountNaira = discountKobo / 100
  const totalAfterDiscountNaira = (subtotalKobo - discountKobo) / 100

  res.json({
    valid: true,
    code: coupon.code,
    discount: discountNaira,
    subtotal: subtotalNaira,
    total_after_discount: totalAfterDiscountNaira,
    message:
      items.length === 0
        ? 'Coupon is valid. Add items to your cart to see the discount.'
        : discountKobo > 0
          ? `Coupon applied — ₦${discountNaira.toFixed(2)} off`
          : 'Coupon is valid but no discount applies to this cart.',
  })
})

// ---------------------------------------------------------------------------
// Create coupon (admin)
// ---------------------------------------------------------------------------
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    type,
    discount_value,
    min_order_amount,
    max_discount,
    starts_at,
    expires_at,
    usage_limit,
    per_customer_limit,
    first_order_only,
    is_active,
  } = req.body

  // Percentage discount cannot exceed 100%
  if (type === 'percentage' && Number(discount_value) > 100) {
    throw ApiError.badRequest('Percentage discount cannot exceed 100%')
  }

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .insert({
      code: code.trim().toUpperCase(),
      type,
      discount_value: Number(discount_value),
      min_order_amount: Number(min_order_amount || 0),
      max_discount: max_discount ? Number(max_discount) : null,
      starts_at: starts_at || new Date().toISOString(),
      expires_at: expires_at || null,
      usage_limit: usage_limit ? Number(usage_limit) : null,
      per_customer_limit: Number(per_customer_limit || 1),
      first_order_only: Boolean(first_order_only),
      is_active: is_active !== undefined ? Boolean(is_active) : true,
      created_by: req.user.id,
    })
    .select()
    .single()

  if (error) throw mapSupabaseError(error, 'Could not create coupon')

  res.status(201).json({ coupon: data })
})

// ---------------------------------------------------------------------------
// Update coupon (admin)
// ---------------------------------------------------------------------------
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updates = { ...req.body }
  delete updates.id

  if (updates.type === 'percentage' && updates.discount_value && Number(updates.discount_value) > 100) {
    throw ApiError.badRequest('Percentage discount cannot exceed 100%')
  }

  if (updates.code) updates.code = updates.code.trim().toUpperCase()
  if (updates.discount_value) updates.discount_value = Number(updates.discount_value)
  if (updates.min_order_amount !== undefined) updates.min_order_amount = Number(updates.min_order_amount)
  if (updates.max_discount !== undefined && updates.max_discount !== null) updates.max_discount = Number(updates.max_discount)
  if (updates.per_customer_limit !== undefined && updates.per_customer_limit !== null) updates.per_customer_limit = Number(updates.per_customer_limit)
  if (updates.first_order_only !== undefined) updates.first_order_only = Boolean(updates.first_order_only)
  if (updates.is_active !== undefined) updates.is_active = Boolean(updates.is_active)

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw mapSupabaseError(error, 'Could not update coupon')

  res.json({ coupon: data })
})

// ---------------------------------------------------------------------------
// Toggle coupon active status (admin)
// ---------------------------------------------------------------------------
export const toggleCouponActive = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { is_active } = req.body

  if (is_active === undefined) throw ApiError.badRequest('is_active is required')

  const { data, error } = await supabaseAdmin
    .from('coupons')
    .update({ is_active: Boolean(is_active) })
    .eq('id', id)
    .select()
    .single()

  if (error) throw mapSupabaseError(error, 'Could not update coupon')

  res.json({ coupon: data })
})

// ---------------------------------------------------------------------------
// Delete coupon (admin) — only if unused
// ---------------------------------------------------------------------------
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params

  const { data: coupon, error: fetchError } = await supabaseAdmin
    .from('coupons')
    .select('usage_count')
    .eq('id', id)
    .single()

  if (fetchError || !coupon) throw ApiError.notFound('Coupon not found')

  if (coupon.usage_count > 0) {
    throw ApiError.badRequest('Cannot delete a coupon that has been used')
  }

  const { error } = await supabaseAdmin.from('coupons').delete().eq('id', id)
  if (error) throw mapSupabaseError(error, 'Could not delete coupon')

  res.json({ message: 'Coupon deleted' })
})

// ---------------------------------------------------------------------------
// Coupon campaign stats (admin)
// ---------------------------------------------------------------------------
export const getCouponStats = asyncHandler(async (req, res) => {
  const { data: coupons, error } = await supabaseAdmin
    .from('coupons')
    .select('id, code, type, discount_value, usage_count, usage_limit, is_active, created_at')

  if (error) throw error

  const totalCoupons = coupons.length
  const activeCoupons = coupons.filter((c) => c.is_active).length
  const totalRedemptions = coupons.reduce((sum, c) => sum + (c.usage_count || 0), 0)

  res.json({
    totalCoupons,
    activeCoupons,
    totalRedemptions,
    coupons: coupons.map((c) => ({
      id: c.id,
      code: c.code,
      type: c.type,
      discountValue: c.discount_value,
      usageCount: c.usage_count,
      usageLimit: c.usage_limit,
      isActive: c.is_active,
    })),
  })
})
