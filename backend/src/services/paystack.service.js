import crypto from 'node:crypto'
import env from '../config/env.js'

const PAYSTACK_BASE = 'https://api.paystack.co'

function assertConfigured() {
  if (!env.paystack.secretKey) {
    throw new Error('PAYSTACK_SECRET_KEY is not configured')
  }
}

async function paystackRequest(path, options = {}) {
  assertConfigured()
  const res = await fetch(`${PAYSTACK_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${env.paystack.secretKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body.status === false) {
    throw new Error(body.message || `Paystack request failed (${res.status})`)
  }
  return body.data
}

// Paystack amounts are in kobo (1 NGN = 100 kobo)
export const toKobo = (naira) => Math.round(Number(naira) * 100)

export async function initializeTransaction({ email, amountNaira, reference, metadata }) {
  return paystackRequest('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email,
      amount: toKobo(amountNaira),
      reference,
      callback_url: env.paystack.callbackUrl || undefined,
      metadata,
    }),
  })
}

export async function verifyTransaction(reference) {
  return paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`)
}

// Paystack signs webhooks with HMAC-SHA512 of the raw body using the secret key.
export function verifyWebhookSignature(rawBody, signature) {
  if (!env.paystack.secretKey || !signature) return false
  const hash = crypto.createHmac('sha512', env.paystack.secretKey).update(rawBody, 'utf8').digest('hex')
  const expected = Buffer.from(hash, 'utf8')
  const received = Buffer.from(String(signature), 'utf8')
  if (expected.length !== received.length) return false
  return crypto.timingSafeEqual(expected, received)
}

// Marks a webhook/verify event successful only when the amount truly matches.
export function isPaymentSuccessful(event) {
  return event?.status === 'success' && Boolean(event?.reference)
}
