import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { BUSINESS_RULES } from '../config/env.js'
import { query, querySingle } from '../services/supabase.service.js'

export const listOrders = asyncHandler(async (req, res) => {
  const { status } = req.query

  let builder = supabaseAdmin
    .from('orders')
    .select('*, order_items(*, products(image_url))')
    .order('created_at', { ascending: false })
  if (status && status !== 'all') {
    if (!BUSINESS_RULES.orderStatuses.includes(status)) {
      throw ApiError.badRequest('Invalid status filter')
    }
    builder = builder.eq('status', status)
  }

  const orders = await query(builder, 'Could not load orders')

  // Attach customer names (orders.user_id references auth.users, so we
  // resolve profiles in a second query)
  const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))]
  let profilesById = {}
  if (userIds.length) {
    const { data: profiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)
    profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]))
  }

  res.json({ orders: orders.map((o) => ({ ...o, customer: profilesById[o.user_id] || null })) })
})

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body
  if (!BUSINESS_RULES.orderStatuses.includes(status)) {
    throw ApiError.badRequest('Invalid status')
  }

  const order = await querySingle(
    supabaseAdmin.from('orders').select('*, order_items(*)').eq('id', req.params.id).single(),
    'Order not found',
  )

  // NOTE: cancelling an order restores stock via the
  // restore_stock_on_order_cancel database trigger, so no manual stock
  // restore is needed here.
  const updated = await querySingle(
    supabaseAdmin.from('orders').update({ status }).eq('id', req.params.id).select().single(),
    'Could not update order status',
  )

  res.json({ order: updated })
})

export const stats = asyncHandler(async (req, res) => {
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, status, total, created_at')
  if (error) throw ApiError.badRequest('Could not load statistics')

  const valid = orders.filter((o) => o.status !== 'cancelled')
  const revenue = valid.reduce((sum, o) => sum + Number(o.total), 0)

  const byStatus = BUSINESS_RULES.orderStatuses.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }))

  const { data: lowStock } = await supabaseAdmin
    .from('products')
    .select('id, name, stock, image_url')
    .lte('stock', 5)
    .order('stock', { ascending: true })

  res.json({
    stats: {
      revenue,
      orderCount: orders.length,
      activeOrders: valid.filter((o) => o.status !== 'delivered').length,
      averageOrderValue: valid.length ? Math.round(revenue / valid.length) : 0,
      byStatus,
      lowStock: lowStock || [],
    },
  })
})
