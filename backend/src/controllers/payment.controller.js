import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import {
  initializeTransaction,
  verifyTransaction,
  verifyWebhookSignature,
  toKobo,
} from '../services/paystack.service.js'
import { sendOrderConfirmationEmail, sendNewOrderAlert } from '../services/email.service.js'
import { query, querySingle } from '../services/supabase.service.js'
import env, { BUSINESS_RULES, isProductionEnv, requireStagingEnv } from '../config/env.js'

async function markOrderPaid(orderId, reference) {
  const order = await querySingle(
    supabaseAdmin
      .from('orders')
      .select('id, status, promo_code, payment_status')
      .eq('id', orderId)
      .single(),
    'Order not found',
  )

  // Idempotent: already paid
  if (order.status === 'paid') {
    return order
  }

  // Atomic: confirm payment + consume coupon redemption together
  if (BUSINESS_RULES.atomicOrderRpc) {
    const { data: updated, error } = await supabaseAdmin.rpc(
      'confirm_order_payment',
      { p_order_id: orderId, p_reference: reference },
    )
    if (error) throw ApiError.badRequest(error.message || 'Could not confirm payment')

    // Send emails (non-blocking for the response)
    sendOrderConfirmationEmail(updated).catch((err) =>
      console.error('[email] order confirmation failed:', err.message),
    )
    sendNewOrderAlert(updated).catch((err) =>
      console.error('[email] new order alert failed:', err.message),
    )

    return updated
  }

  // Legacy path: transition coupon redemption first, then mark order paid
  if (order.promo_code) {
    const { data: redemption } = await supabaseAdmin
      .from('coupon_redemptions')
      .select('id')
      .eq('order_id', orderId)
      .eq('status', 'pending')
      .single()

    if (redemption) {
      await supabaseAdmin.rpc('transition_coupon_redemption', {
        p_redemption_id: redemption.id,
        p_new_status: 'consumed',
      })
    }
  }

  const updated = await querySingle(
    supabaseAdmin
      .from('orders')
      .update({
        status: 'paid',
        payment_reference: reference,
        paid_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single(),
    'Could not update order payment status',
  )

  // Send emails (non-blocking for the response)
  sendOrderConfirmationEmail(updated).catch((err) => console.error('[email] order confirmation failed:', err.message))
  sendNewOrderAlert(updated).catch((err) => console.error('[email] new order alert failed:', err.message))

  return updated
}

// POST /api/v1/payments/paystack/initialize — start a Paystack transaction
export const initializePaystack = asyncHandler(async (req, res) => {
  // Safety: in non-production environments, refuse unless connected to staging
  // Supabase (prevents accidental production writes during dev). In production,
  // legitimate authenticated operations proceed normally.
  if (!isProductionEnv()) {
    requireStagingEnv()
  }
  const orderId = req.body.order_id || req.params.id

  // Staging has no real Paystack credentials — online payments are disabled.
  if (
    !env.paystack.secretKey ||
    env.paystack.secretKey.includes('your-staging-secret-key')
  ) {
    throw ApiError.badRequest(
      'Online payments are not configured in staging. Use Cash on delivery.',
    )
  }

  const order = await querySingle(
    supabaseAdmin.from('orders').select('*').eq('id', orderId).eq('user_id', req.user.id).single(),
    'Order not found',
  )

  if (['paid', 'cancelled'].includes(order.status)) {
    throw ApiError.badRequest(`Order is already ${order.status}`)
  }

  const reference = `${order.order_number}-${Date.now().toString(36)}`
  await query(
    supabaseAdmin
      .from('orders')
      .update({ payment_reference: reference, paystack_reference: reference })
      .eq('id', order.id),
  )

  const result = await initializeTransaction({
    email: order.contact.email,
    amountNaira: order.total,
    reference,
    metadata: { order_id: order.id, order_number: order.order_number },
  })

  res.json({
    authorizationUrl: result.authorization_url,
    accessCode: result.access_code,
    reference: result.reference,
  })
})

// GET /api/v1/payments/paystack/verify/:reference — confirm transaction status
export const verifyPaystack = asyncHandler(async (req, res) => {
  // Safety: in non-production environments, refuse unless connected to staging
  // Supabase (prevents accidental production writes during dev). In production,
  // legitimate authenticated operations proceed normally.
  if (!isProductionEnv()) {
    requireStagingEnv()
  }
  const { reference } = req.params

  const order = await querySingle(
    supabaseAdmin.from('orders').select('*').eq('payment_reference', reference).single(),
    'Order not found for reference',
  )

  if (order.status !== 'paid') {
    const tx = await verifyTransaction(reference)
    if (tx.status === 'success') {
      // PRD §9: verify the amount server-side before marking the order paid
      if (Number(tx.amount) !== toKobo(order.total)) {
        throw ApiError.badRequest('Payment amount does not match the order total')
      }
      await markOrderPaid(order.id, reference)
      return res.json({ order: { ...order, status: 'paid' }, verified: true })
    }
  }

  res.json({ order, verified: order.status === 'paid' })
})

// POST /api/v1/payments/paystack/webhook — Paystack event listener
export const paystackWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature']
  if (!verifyWebhookSignature(req.rawBody || '', signature)) {
    throw ApiError.unauthorized('Invalid webhook signature')
  }

  const event = req.body
  if (event?.event === 'charge.success') {
    const data = event.data
    if (data?.status === 'success' && data?.reference) {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('*')
        .eq('payment_reference', data.reference)
        .single()

      // Idempotent: only transition if not already paid
      if (order && order.status !== 'paid') {
        if (Number(data.amount) !== toKobo(order.total)) {
          console.error('[webhook] amount mismatch for order', order.id)
        } else {
          await markOrderPaid(order.id, data.reference)
          console.log('[webhook] order paid:', order.id)
        }
      }
    }
  }

  // Always acknowledge quickly — Paystack retries non-2xx responses
  res.sendStatus(200)
})

// POST /api/v1/orders/:id/cancel — cancel an order and void coupon redemption
export const cancelOrder = asyncHandler(async (req, res) => {
  // Safety: in non-production environments, refuse unless connected to staging
  // Supabase (prevents accidental production writes during dev). In production,
  // legitimate authenticated operations proceed normally.
  if (!isProductionEnv()) {
    requireStagingEnv()
  }
  const order = await querySingle(
    supabaseAdmin.from('orders').select('*').eq('id', req.params.id).eq('user_id', req.user.id).single(),
    'Order not found',
  )

  if (order.status === 'cancelled') {
    throw ApiError.badRequest('Order is already cancelled')
  }
  if (order.status === 'paid') {
    throw ApiError.badRequest('Cannot cancel a paid order')
  }

  // Atomic: cancel order + void coupon + restore stock together
  if (BUSINESS_RULES.atomicOrderRpc) {
    const { data: updated, error } = await supabaseAdmin.rpc(
      'cancel_order_atomic',
      { p_order_id: order.id, p_user_id: req.user.id },
    )
    if (error) throw ApiError.badRequest(error.message || 'Could not cancel order')

    return res.json({ order: { ...updated, status: 'cancelled' } })
  }

  // Legacy path: void coupon redemption first, then cancel order
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

  await query(
    supabaseAdmin
      .from('orders')
      .update({ status: 'cancelled', payment_status: 'failed' })
      .eq('id', order.id),
  )

  res.json({ order: { ...order, status: 'cancelled' } })
})

// POST /api/v1/admin/coupons/cleanup-abandoned — cancel abandoned pending orders
// Only targets online payment orders older than abandonedOrderTimeoutMinutes.
// Never touches COD orders or paid orders. Idempotent: safe to run repeatedly.
export const cleanupAbandonedOrders = asyncHandler(async (req, res) => {
  const timeoutMinutes = BUSINESS_RULES.abandonedOrderTimeoutMinutes
  // Safety: in non-production environments, refuse unless connected to staging
  // Supabase (prevents accidental production writes during dev). In production,
  // legitimate authenticated operations proceed normally.
  if (!isProductionEnv()) {
    requireStagingEnv()
  }
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString()

  // Find pending, unpaid, online-payment orders older than the cutoff.
  // COD orders are excluded — they are not time-limited the same way.
  const { data: orders, error } = await supabaseAdmin
    .from('orders')
    .select('id, order_number, user_id, payment_method, payment_status, created_at, promo_code')
    .eq('status', 'pending')
    .eq('payment_status', 'unpaid')
    .neq('payment_method', 'cod')
    .lt('created_at', cutoff)

  if (error) throw ApiError.badRequest(`Could not fetch abandoned orders: ${error.message}`)

  const results = {
    processed: 0,
    cancelled: 0,
    failed: 0,
    details: [],
  }

  // Process each abandoned order independently — one failure does not stop others.
  for (const order of orders || []) {
    try {
      if (BUSINESS_RULES.atomicOrderRpc) {
        const { data: updated, error } = await supabaseAdmin.rpc(
          'cancel_order_atomic',
          { p_order_id: order.id, p_user_id: order.user_id },
        )
        if (error) {
          results.failed++
          results.details.push({
            orderId: order.id,
            orderNumber: order.order_number,
            status: 'failed',
            error: error.message || 'Unknown error',
          })
          continue
        }
        results.cancelled++
        results.processed++
        results.details.push({
          orderId: order.id,
          orderNumber: order.order_number,
          status: 'cancelled',
          error: null,
        })
        console.log(`[abandoned-cleanup] order ${order.order_number} cancelled (atomic)`)
      } else {
        // Legacy path: void coupon redemption first, then cancel order
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

        await query(
          supabaseAdmin
            .from('orders')
            .update({ status: 'cancelled', payment_status: 'failed' })
            .eq('id', order.id),
        )

        results.cancelled++
        results.processed++
        results.details.push({
          orderId: order.id,
          orderNumber: order.order_number,
          status: 'cancelled',
          error: null,
        })
        console.log(`[abandoned-cleanup] order ${order.order_number} cancelled (legacy)`)
      }
    } catch (err) {
      results.failed++
      results.details.push({
        orderId: order.id,
        orderNumber: order.order_number,
        status: 'failed',
        error: err.message || 'Unknown error',
      })
      console.error(`[abandoned-cleanup] order ${order.order_number} failed:`, err.message)
    }
  }

  res.json({
    message: `Processed ${results.processed} abandoned orders: ${results.cancelled} cancelled, ${results.failed} failed`,
    summary: results,
  })
})
