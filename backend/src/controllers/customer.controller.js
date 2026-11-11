import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { query } from '../services/supabase.service.js'
import { BUSINESS_RULES } from '../config/env.js'

const SEGMENT_VIP = 'VIP'
const SEGMENT_LOYAL = 'Loyal'
const SEGMENT_RETURNING = 'Returning'
const SEGMENT_INACTIVE = 'Inactive'
const SEGMENT_NEW = 'New'

const {
  vipSpendThreshold: VIP_SPEND_THRESHOLD,
  vipOrderCountThreshold: VIP_ORDER_COUNT_THRESHOLD,
  loyalOrderCountThreshold: LOYAL_ORDER_COUNT_THRESHOLD,
  returningMinOrderCount: RETURNING_MIN_ORDER_COUNT,
  returningMaxOrderCount: RETURNING_MAX_ORDER_COUNT,
  inactiveDays: INACTIVE_DAYS,
  newCustomerDays: NEW_CUSTOMER_DAYS,
} = BUSINESS_RULES.segmentation

function nowUtc() {
  return new Date()
}

function daysAgo(date) {
  if (!date) return null
  return (nowUtc() - new Date(date)) / (1000 * 60 * 60 * 24)
}

function classifySegment(customer) {
  const { completedOrderCount, completedRevenue, lastOrderAt, createdAt } = customer

  // VIP: highest spend or completed order volume (takes precedence over everything)
  if (
    completedRevenue >= VIP_SPEND_THRESHOLD ||
    completedOrderCount >= VIP_ORDER_COUNT_THRESHOLD
  ) {
    return SEGMENT_VIP
  }

  // Inactive: has completed orders but no purchase within the inactive window
  if (completedOrderCount >= 1) {
    const days = daysAgo(lastOrderAt)
    if (days !== null && days > INACTIVE_DAYS) {
      return SEGMENT_INACTIVE
    }
  }

  // Loyal: 6+ completed orders (active)
  if (completedOrderCount >= LOYAL_ORDER_COUNT_THRESHOLD) {
    return SEGMENT_LOYAL
  }

  // Returning: 2-5 completed orders (active)
  if (completedOrderCount >= RETURNING_MIN_ORDER_COUNT && completedOrderCount <= RETURNING_MAX_ORDER_COUNT) {
    return SEGMENT_RETURNING
  }

  // New: 0-1 completed orders (or recently registered with no completed orders)
  return SEGMENT_NEW
}

function completedOrderStatuses() {
  return ['paid', 'preparing', 'out-for-delivery', 'delivered']
}

function isCompletedOrder(order) {
  return order.status !== 'cancelled' && completedOrderStatuses().includes(order.status)
}

async function fetchCustomers() {
  // Fetch all customer profiles (role = 'customer')
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, phone, role, created_at, account_status')
    .eq('role', 'customer')
    .order('created_at', { ascending: false })

  if (profilesError) throw profilesError

  // Fetch all orders to compute aggregates per customer
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, user_id, status, total, payment_status, created_at')

  if (ordersError) throw ordersError

  // Aggregate orders per customer
  const byCustomer = new Map()
  for (const order of orders || []) {
    const existing = byCustomer.get(order.user_id) || {
      orderCount: 0,
      totalSpent: 0,
      completedOrderCount: 0,
      completedRevenue: 0,
      firstOrderAt: null,
      lastOrderAt: null,
    }

    existing.orderCount += 1
    existing.totalSpent += Number(order.total || 0)

    if (isCompletedOrder(order)) {
      existing.completedOrderCount += 1
      existing.completedRevenue += Number(order.total || 0)
    }

    const orderDate = new Date(order.created_at)
    if (
      !existing.firstOrderAt ||
      orderDate < new Date(existing.firstOrderAt)
    ) {
      existing.firstOrderAt = order.created_at
    }
    if (
      !existing.lastOrderAt ||
      orderDate > new Date(existing.lastOrderAt)
    ) {
      existing.lastOrderAt = order.created_at
    }

    byCustomer.set(order.user_id, existing)
  }

  const customers = (profiles || []).map((profile) => {
    const agg = byCustomer.get(profile.id) || {
      orderCount: 0,
      totalSpent: 0,
      completedOrderCount: 0,
      completedRevenue: 0,
      firstOrderAt: null,
      lastOrderAt: null,
    }

    const customer = {
      id: profile.id,
      name: profile.full_name || '',
      email: profile.email || '',
      phone: profile.phone || null,
      accountStatus: profile.account_status,
      createdAt: profile.created_at,
      orderCount: agg.orderCount,
      totalSpent: agg.totalSpent,
      completedOrderCount: agg.completedOrderCount,
      completedRevenue: agg.completedRevenue,
      firstOrderAt: agg.firstOrderAt,
      lastOrderAt: agg.lastOrderAt,
      segment: classifySegment({
        orderCount: agg.orderCount,
        totalSpent: agg.totalSpent,
        lastOrderAt: agg.lastOrderAt,
        createdAt: profile.created_at,
      }),
    }
    return customer
  })

  return customers
}

export const listCustomers = asyncHandler(async (req, res) => {
  const {
    search,
    segment,
    spend,
    sort = 'created_at',
    order = 'desc',
    page = 1,
    limit = 20,
  } = req.query

  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  const customers = await fetchCustomers()

  // Search + segment + spend filter
  const filtered = customers.filter((c) => {
    if (segment && c.segment !== segment) return false
    if (spend) {
      const [min, max] = spend.split('-').map(Number)
      const spent = Number(c.totalSpent || 0)
      if (max) {
        if (spent < min || spent >= max) return false
      } else {
        if (spent < min) return false
      }
    }
    if (search) {
      const q = search.trim().toLowerCase()
      const haystack = `${c.name} ${c.email} ${c.phone || ''}`.toLowerCase()
      return haystack.includes(q)
    }
    return true
  })

  // Sort
  filtered.sort((a, b) => {
    let av = a[sort]
    let bv = b[sort]
    if (sort === 'totalSpent' || sort === 'orderCount' || sort === 'completedRevenue') {
      av = Number(av || 0)
      bv = Number(bv || 0)
    } else {
      av = av ? new Date(av).getTime() : 0
      bv = bv ? new Date(bv).getTime() : 0
    }
    if (av < bv) return order === 'asc' ? -1 : 1
    if (av > bv) return order === 'asc' ? 1 : -1
    return 0
  })

  const total = filtered.length
  const pageCustomers = filtered.slice(offset, offset + limitNum)

  res.json({
    customers: pageCustomers,
    meta: {
      total,
      page: pageNum,
      per_page: limitNum,
      total_pages: Math.ceil(total / limitNum),
    },
  })
})

export const customerStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query
  const customers = await fetchCustomers()

  const now = nowUtc()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  // Optional date range filter for acquisition trend / new-this-month
  let filteredByDate = customers
  if (startDate || endDate) {
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    filteredByDate = customers.filter((c) => {
      const created = new Date(c.createdAt)
      if (start && created < start) return false
      if (end && created > end) return false
      return true
    })
  }

  const totalCustomers = customers.length
  const newThisMonth = filteredByDate.filter(
    (c) => new Date(c.createdAt) >= monthStart
  ).length
  const repeatCustomers = customers.filter((c) => c.orderCount >= 2).length
  const vipCustomers = customers.filter((c) => c.segment === SEGMENT_VIP).length

  const completedCustomers = customers.filter((c) => c.completedOrderCount >= 1)
  const totalCustomerRevenue = customers.reduce(
    (sum, c) => sum + Number(c.completedRevenue || 0),
    0
  )
  const averageCustomerLifetimeValue = completedCustomers.length
    ? Math.round(totalCustomerRevenue / completedCustomers.length)
    : 0

  // Revenue by segment (completed revenue only)
  const segmentRevenue = customers.reduce(
    (acc, c) => {
      if (!acc[c.segment]) acc[c.segment] = { count: 0, revenue: 0 }
      acc[c.segment].count += 1
      acc[c.segment].revenue += Number(c.completedRevenue || 0)
      return acc
    },
    {}
  )

  // Top customers by lifetime spending
  const topCustomers = [...customers]
    .sort((a, b) => Number(b.completedRevenue || 0) - Number(a.completedRevenue || 0))
    .slice(0, 10)
    .map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      segment: c.segment,
      totalSpent: Number(c.completedRevenue || 0),
      orderCount: c.completedOrderCount,
    }))

  const segmentBreakdown = customers.reduce(
    (acc, c) => {
      acc[c.segment] = (acc[c.segment] || 0) + 1
      return acc
    },
    {}
  )

  // Acquisition trend: customers registered per day (last 30 days)
  const acquisitionTrend = []
  for (let i = 29; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    day.setHours(0, 0, 0, 0)
    const dayStart = day
    const dayEnd = new Date(day.getTime() + 24 * 60 * 60 * 1000 - 1)
    const count = filteredByDate.filter(
      (c) => new Date(c.createdAt) >= dayStart && new Date(c.createdAt) <= dayEnd
    ).length
    acquisitionTrend.push({
      date: day.toISOString().slice(0, 10),
      count,
    })
  }

  res.json({
    stats: {
      totalCustomers,
      newThisMonth,
      repeatCustomers,
      vipCustomers,
      totalCustomerRevenue,
      averageCustomerLifetimeValue,
      repeatPurchaseRate: totalCustomers
        ? Math.round((repeatCustomers / totalCustomers) * 100)
        : 0,
      segmentBreakdown,
      segmentRevenue,
      topCustomers,
      acquisitionTrend,
    },
  })
})

export const getCustomerDetail = asyncHandler(async (req, res) => {
  const customers = await fetchCustomers()
  const customer = customers.find((c) => c.id === req.params.id)
  if (!customer) throw ApiError.notFound('Customer not found')
  res.json({ customer })
})

export const getCustomerOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const pageNum = Math.max(1, Number(page) || 1)
  const limitNum = Math.min(100, Math.max(1, Number(limit) || 20))
  const offset = (pageNum - 1) * limitNum

  // Verify customer exists
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from('profiles')
    .select('id, full_name, email, account_status')
    .eq('id', req.params.id)
    .eq('role', 'customer')
    .single()
  if (profilesError || !profiles) throw ApiError.notFound('Customer not found')

  const { data: orders, error: ordersError, count } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, status, total, payment_status, created_at, updated_at')
    .eq('user_id', req.params.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limitNum - 1)

  if (ordersError) throw ordersError

  res.json({
    customer: {
      id: profiles.id,
      name: profiles.full_name || '',
      email: profiles.email || '',
      accountStatus: profiles.account_status,
    },
    orders: (orders || []).map((o) => ({
      id: o.id,
      orderNumber: o.order_number,
      status: o.status,
      total: Number(o.total || 0),
      paymentStatus: o.payment_status,
      createdAt: o.created_at,
    })),
    meta: {
      total: count || 0,
      page: pageNum,
      per_page: limitNum,
      total_pages: Math.ceil((count || 0) / limitNum),
    },
  })
})

// ---------------------------------------------------------------------------
// Customer notes (internal admin-only, never exposed to customers)
// ---------------------------------------------------------------------------

export const listCustomerNotes = asyncHandler(async (req, res) => {
  const { data: notes, error } = await supabaseAdmin
    .from('customer_notes')
    .select('id, content, created_at, updated_at, author_id, author:profiles!author_id(full_name, email)')
    .eq('customer_id', req.params.id)
    .order('created_at', { ascending: false })

  if (error) throw mapSupabaseError(error, 'Could not load customer notes')

  res.json({
    notes: (notes || []).map((n) => ({
      id: n.id,
      content: n.content,
      createdAt: n.created_at,
      updatedAt: n.updated_at,
      authorId: n.author_id,
      authorName: n.author?.full_name || 'Unknown',
      authorEmail: n.author?.email || 'Unknown',
    })),
  })
})

export const createCustomerNote = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!content || typeof content !== 'string' || content.trim().length < 1) {
    throw ApiError.badRequest('Note content is required')
  }
  if (content.trim().length > 2000) {
    throw ApiError.badRequest('Note content must be 2000 characters or fewer')
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('id', req.params.id)
    .eq('role', 'customer')
    .single()
  if (customerError || !customer) throw ApiError.notFound('Customer not found')

  const { data: note, error } = await supabaseAdmin
    .from('customer_notes')
    .insert({
      customer_id: req.params.id,
      author_id: req.user.id,
      content: content.trim(),
    })
    .select('id, content, created_at')
    .single()

  if (error) throw mapSupabaseError(error, 'Could not create customer note')

  res.status(201).json({
    note: {
      id: note.id,
      content: note.content,
      createdAt: note.created_at,
      authorId: req.user.id,
      authorName: req.user.fullName || 'Unknown',
      authorEmail: req.user.email || 'Unknown',
    },
  })
})

export const updateCustomerNote = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!content || typeof content !== 'string' || content.trim().length < 1) {
    throw ApiError.badRequest('Note content is required')
  }
  if (content.trim().length > 2000) {
    throw ApiError.badRequest('Note content must be 2000 characters or fewer')
  }

  // Verify note exists and belongs to this customer
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('customer_notes')
    .select('id, author_id, customer_id')
    .eq('id', req.params.noteId)
    .eq('customer_id', req.params.id)
    .single()
  if (fetchError || !existing) throw ApiError.notFound('Note not found')

  // Only the author or an admin can edit
  if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only edit your own notes')
  }

  const { data: note, error } = await supabaseAdmin
    .from('customer_notes')
    .update({ content: content.trim() })
    .eq('id', req.params.noteId)
    .select('id, content, updated_at')
    .single()

  if (error) throw mapSupabaseError(error, 'Could not update customer note')

  res.json({
    note: {
      id: note.id,
      content: note.content,
      updatedAt: note.updated_at,
    },
  })
})

export const deleteCustomerNote = asyncHandler(async (req, res) => {
  // Verify note exists and belongs to this customer
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from('customer_notes')
    .select('id, author_id, customer_id')
    .eq('id', req.params.noteId)
    .eq('customer_id', req.params.id)
    .single()
  if (fetchError || !existing) throw ApiError.notFound('Note not found')

  // Only the author or an admin can delete
  if (existing.author_id !== req.user.id && req.user.role !== 'admin') {
    throw ApiError.forbidden('You can only delete your own notes')
  }

  const { error } = await supabaseAdmin
    .from('customer_notes')
    .delete()
    .eq('id', req.params.noteId)

  if (error) throw mapSupabaseError(error, 'Could not delete customer note')

  res.json({ message: 'Note deleted' })
})

// ---------------------------------------------------------------------------
// Customer account status (suspend / reactivate)
// ---------------------------------------------------------------------------

export const suspendCustomerAccount = asyncHandler(async (req, res) => {
  // Prevent admins from suspending their own account
  if (req.user.id === req.params.id) {
    throw ApiError.badRequest('You cannot suspend your own account')
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, account_status')
    .eq('id', req.params.id)
    .eq('role', 'customer')
    .single()
  if (customerError || !customer) throw ApiError.notFound('Customer not found')

  if (customer.account_status === 'suspended') {
    throw ApiError.badRequest('Customer account is already suspended')
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profiles')
    .update({ account_status: 'suspended' })
    .eq('id', req.params.id)
    .select('id, account_status')
    .single()

  if (error) throw mapSupabaseError(error, 'Could not suspend customer account')

  res.json({
    customer: {
      id: updated.id,
      accountStatus: updated.account_status,
    },
    message: 'Customer account suspended',
  })
})

export const reactivateCustomerAccount = asyncHandler(async (req, res) => {
  // Verify customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, account_status')
    .eq('id', req.params.id)
    .eq('role', 'customer')
    .single()
  if (customerError || !customer) throw ApiError.notFound('Customer not found')

  if (customer.account_status === 'active') {
    throw ApiError.badRequest('Customer account is already active')
  }

  const { data: updated, error } = await supabaseAdmin
    .from('profiles')
    .update({ account_status: 'active' })
    .eq('id', req.params.id)
    .select('id, account_status')
    .single()

  if (error) throw mapSupabaseError(error, 'Could not reactivate customer account')

  res.json({
    customer: {
      id: updated.id,
      accountStatus: updated.account_status,
    },
    message: 'Customer account reactivated',
  })
})

// ---------------------------------------------------------------------------
// Delete customer account (admin-only, never touches Supabase Auth tables)
// ---------------------------------------------------------------------------

export const deleteCustomerAccount = asyncHandler(async (req, res) => {
  // Prevent admins from deleting their own account
  if (req.user.id === req.params.id) {
    throw ApiError.badRequest('You cannot delete your own account')
  }

  // Verify customer exists
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, account_status')
    .eq('id', req.params.id)
    .eq('role', 'customer')
    .single()
  if (customerError || !customer) throw ApiError.notFound('Customer not found')

  const { error } = await supabaseAdmin
    .from('profiles')
    .delete()
    .eq('id', req.params.id)

  if (error) throw mapSupabaseError(error, 'Could not delete customer account')

  res.json({
    customer: {
      id: customer.id,
    },
    message: 'Customer account deleted',
  })
})
