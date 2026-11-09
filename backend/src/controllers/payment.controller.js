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

async function markOrderPaid(orderId, reference) {
  const order = await querySingle(
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
  sendOrderConfirmationEmail(order).catch((err) => console.error('[email] order confirmation failed:', err.message))
  sendNewOrderAlert(order).catch((err) => console.error('[email] new order alert failed:', err.message))

  return order
}

// POST /api/v1/payments/paystack/initialize — start a Paystack transaction
export const initializePaystack = asyncHandler(async (req, res) => {
  const orderId = req.body.order_id || req.params.id

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
