import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { BUSINESS_RULES } from '../config/env.js'
import { query, querySingle } from '../services/supabase.service.js'

function computeTotals(subtotal, promoCode) {
  const promoApplied = promoCode?.trim().toUpperCase() === BUSINESS_RULES.promoCode
  const discount = promoApplied ? Math.round((subtotal * BUSINESS_RULES.promoDiscountPercent) / 100) : 0
  const deliveryFee = subtotal === 0 || subtotal >= BUSINESS_RULES.freeDeliveryThreshold ? 0 : BUSINESS_RULES.deliveryFee
  return { discount, deliveryFee, total: subtotal + deliveryFee - discount }
}

/**
 * Creates an order. CRITICAL SECURITY REQUIREMENT (PRD §9): prices, totals and
 * stock are recalculated from the database here — client-supplied prices are
 * never trusted.
 */
export const createOrder = asyncHandler(async (req, res) => {
  const userId = req.user.id
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
          payment_reference: null,
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
})

export const listMyOrders = asyncHandler(async (req, res) => {
  const orders = await query(
    supabaseAdmin
      .from('orders')
      .select('*, order_items(*)')
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
      .select('*, order_items(*)')
      .eq('id', req.params.id)
      .eq('user_id', req.user.id)
      .single(),
    'Order not found',
  )
  res.json({ order })
})
