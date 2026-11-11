import { createHash } from 'node:crypto'
import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { BUSINESS_RULES, isProductionEnv, requireStagingEnv } from '../config/env.js'
import { query, querySingle } from '../services/supabase.service.js'

function computeTotals(subtotal, promoCode) {
  const promoApplied = promoCode?.trim().toUpperCase() === BUSINESS_RULES.promoCode
  const discount = promoApplied ? Math.round((subtotal * BUSINESS_RULES.promoDiscountPercent) / 100) : 0
  const deliveryFee = subtotal === 0 || subtotal >= BUSINESS_RULES.freeDeliveryThreshold ? 0 : BUSINESS_RULES.deliveryFee
  return { discount, deliveryFee, total: subtotal + deliveryFee - discount }
}

/**
 * Generates a deterministic SHA-256 hash of the request payload for
 * idempotency conflict detection.
 */
function computeIdempotencyHash(body) {
  const canonical = JSON.stringify({
    items: body.items,
    contact: body.contact,
    delivery: body.delivery,
    payment_method: body.payment_method,
    promo_code: body.promo_code,
    notes: body.notes,
  })
  return createHash('sha256').update(canonical).digest('hex')
}

/**
 * Creates an order using the unified atomic RPC (Phase 2G-C2B).
 * All operations (order, items, stock, coupon redemption) run in one
 * PostgreSQL transaction. Feature flag `atomicOrderRpc` must be enabled.
 */
/**
 * Validates and returns the client-provided idempotency key.
 * Retries of the same checkout attempt MUST reuse the same key so the
 * backend can idempotently reject duplicates. A new purchase attempt
 * must use a fresh key. We never generate a server-side fallback key
 * because that would silently allow duplicate orders on retry.
 */
function validateIdempotencyKey(inputKey) {
  const key = inputKey?.trim()
  if (!key) {
    throw ApiError.badRequest('Idempotency key is required')
  }
  // Basic UUID sanity check (not full validation, but catches obvious garbage)
  if (!/^[0-9a-fA-F-]{36}$/.test(key)) {
    throw ApiError.badRequest('Invalid idempotency key')
  }
  return key
}

async function createOrderAtomic(req, res) {
  const userId = req.user.id
  const { items, contact, delivery, payment_method: paymentMethod = 'cod',
    promo_code: promoCode, notes, idempotencyKey: clientKey } = req.body

  // Idempotency key: client-provided attempt ID for retry stability, or
  // server-generated for a new purchase attempt. Never trusted blindly — the
  // RPC checks that reusing a key with a changed payload is rejected.
  const idempotencyKey = validateIdempotencyKey(clientKey)

  // Canonical hash is computed exclusively on the backend. Any client
  // supplied hash is ignored.
  const idempotencyHash = computeIdempotencyHash(req.body)

  // Promo code is passed to the atomic RPC as a coupon code. If a matching
  // coupon exists in the database (e.g. SAVOR20), it is applied; otherwise
  // the RPC returns an error. Before enabling atomicOrderRpc, ensure a
  // SAVOR20 coupon record exists in the coupons table so existing customers
  // are not blocked.
  const { data: order, error } = await supabaseAdmin.rpc('create_order_with_coupon', {
    p_user_id: userId,
    p_contact: contact,
    p_delivery: delivery,
    p_notes: notes || null,
    p_payment_method: paymentMethod,
    p_promo_code: promoCode || null,
    p_idempotency_key: idempotencyKey,
    p_idempotency_hash: idempotencyHash,
    p_items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
  })

  if (error) throw ApiError.badRequest(error.message || 'Could not create order')

  return res.status(201).json({ order, idempotencyKey })
}

/**
 * Creates an order using the legacy flow (computeTotals + separate writes).
 * Feature flag `atomicOrderRpc` is disabled — existing production path.
 */
async function createOrderLegacy(req, res) {
  const userId = req.user.id

  // Prevent suspended accounts from placing orders
  const { data: customer, error: customerError } = await supabaseAdmin
    .from('profiles')
    .select('id, account_status')
    .eq('id', userId)
    .eq('role', 'customer')
    .single()
  if (customerError || !customer) throw ApiError.notFound('Customer not found')
  if (customer.account_status === 'suspended') {
    throw ApiError.badRequest('Your account is suspended and cannot place orders.')
  }

  const { items, contact, delivery, payment_method: paymentMethod = 'cod', promo_code: promoCode, notes } = req.body

  const productIds = items.map((item) => item.product_id)
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, stock, is_active')
    .in('id', productIds)
  if (error) throw ApiError.badRequest('Could not validate cart items')

  const byId = new Map(products.map((p) => [p.id, p]))

  // Merge duplicate lines and validate every item
  const merged = new Map()
  for (const item of items) {
    const product = byId.get(item.product_id)
    if (!product || !product.is_active) {
      throw ApiError.badRequest(`Item ${item.product_id} is no longer available`)
    }
    const qty = (merged.get(item.product_id) || 0) + item.quantity
    if (product.stock < qty) {
      throw ApiError.badRequest(`${product.name} only has ${product.stock} left in stock`)
    }
    merged.set(item.product_id, qty)
  }

  // Server-side price computation (ignore any client amounts)
  let subtotal = 0
  const orderItems = []
  for (const [productId, qty] of merged.entries()) {
    const product = byId.get(productId)
    subtotal += Number(product.price) * qty
    orderItems.push({
      product_id: productId,
      product_name: product.name,
      unit_price: Number(product.price),
      quantity: qty,
      line_total: Number(product.price) * qty,
    })
  }

  const { discount, deliveryFee, total } = computeTotals(subtotal, promoCode)

  let order
  try {
    order = await querySingle(
      supabaseAdmin
        .from('orders')
        .insert({
          user_id: userId,
          status: 'pending',
          subtotal,
          discount,
          delivery_fee: deliveryFee,
          total,
          payment_method: paymentMethod,
          contact,
          delivery,
          notes: notes || null,
        })
        .select()
        .single(),
      'Could not create order',
    )

    await query(
      supabaseAdmin.from('order_items').insert(
        orderItems.map((item) => ({ ...item, order_id: order.id })),
      ),
      'Could not save order items',
    )

    // Reserve stock atomically in the database
    for (const item of orderItems) {
      await query(
        supabaseAdmin.rpc('decrement_product_stock', {
          p_id: item.product_id,
          p_qty: item.quantity,
        }),
        'Could not reserve stock',
      )
    }
  } catch (err) {
    // Keep the data consistent: remove the half-created order
    if (order?.id) {
      await query(supabaseAdmin.from('orders').delete().eq('id', order.id)).catch(() => null)
    }
    throw err
  }

  res.status(201).json({ order: { ...order, items: orderItems } })
}

export const createOrder = asyncHandler(async (req, res) => {
  // Safety: in non-production environments, refuse checkout unless connected
  // to staging Supabase (prevents accidental production writes during dev).
  // In production, legitimate authenticated orders proceed normally.
  if (!isProductionEnv()) {
    requireStagingEnv()
  }

  if (BUSINESS_RULES.atomicOrderRpc) {
    return createOrderAtomic(req, res)
  }
  return createOrderLegacy(req, res)
})

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await query(
    supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(image_url))')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false }),
    'Could not load orders',
  )
  res.json({ orders })
})

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await querySingle(
    supabaseAdmin
      .from('orders')
      .select('*, order_items(*, products(image_url))')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single(),
    'Order not found',
  )
  res.json({ order })
})

export const cancelOrder = asyncHandler(async (req, res) => {
  const { id: orderId } = req.params
  const userId = req.user.id

  const order = await querySingle(
    supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single(),
    'Order not found or you do not own this order',
  )

  if (order.status === 'cancelled') {
    throw ApiError.badRequest('Order is already cancelled')
  }

  if (order.status === 'paid') {
    throw ApiError.badRequest('Cannot cancel a paid order')
  }

  if (order.status === 'preparing') {
    throw ApiError.badRequest('Cannot cancel an order that is already being prepared')
  }

  // Void pending coupon redemption before cancelling (idempotent via RPC).
  // Stock is restored exactly once by the restore_stock_on_order_cancel trigger.
  if (order.promo_code) {
    const { data: redemption } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('id')
      .eq('order_id', order.id)
      .eq('status', 'pending')
      .single()

    if (redemption) {
      await supabaseAdmin.rpc('transition_coupon_redemption', {
        p_redemption_id: redemption.id,
        p_new_status: 'voided',
      })
    }
  }

  const { error } = await supabaseAdmin
    .from('orders')
    .update({ status: 'cancelled', payment_status: 'failed' })
    .eq('id', orderId)

  if (error) throw ApiError.badRequest('Could not cancel order')

  res.json({ message: 'Order cancelled successfully', order: { ...order, status: 'cancelled' } })
})
