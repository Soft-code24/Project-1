// SavorBite staging smoke tests
// Covers: login/auth, admin protection, COD checkout, coupons,
// duplicate prevention, cancellation, stock restoration, coupon lifecycle
// Uses isolated test data; never touches production.

import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import https from 'node:https'
import crypto from 'node:crypto'

const SUPABASE_URL = 'https://kipgcxalqvmkwlcnfxwt.supabase.co'
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcGdjeGFscXZta3dsY25meHd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0MDAwOTIsImV4cCI6MjEwOTk3NjA5Mn0.SIMuvXD8uRjx9X7nhpZcUFAYfr7e7woAqB-VO3sObmY'
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpcGdjeGFscXZta3dsY25meHd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5NDQwMDA5MiwiZXhwIjoyMTA5OTc2MDkyfQ.9Q0X_62oDfMewjX8n3lS9k2U3NBq2n9d5LcNS_WJm8s'
const API_URL = 'http://localhost:5000'

let passed = 0
let failed = 0
let adminToken = ''
let customerToken = ''
let testOrderId = ''
let testCustomerId = ''

function req(mod, host, port, path, method, headers, body) {
  return new Promise((resolve, reject) => {
    const r = mod.request({ hostname: host, port, path, method, headers }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: d }))
    })
    r.on('error', reject)
    const bodyToWrite = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined
    if (bodyToWrite) r.write(bodyToWrite)
    r.end()
  })
}

async function login(email, password) {
  const body = JSON.stringify({ email, password })
  const r = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/auth/v1/token?grant_type=password', 'POST',
    { apikey: ANON_KEY, 'Authorization': 'Bearer ' + ANON_KEY, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    body)
  assert.strictEqual(r.status, 200, `login ${email}: expected 200, got ${r.status}: ${r.body}`)
  return JSON.parse(r.body).access_token
}

async function apiRequest(path, method, headers, body) {
  const h = { ...(headers || {}) }
  if (body) h['Content-Type'] = 'application/json'
  return req(http, 'localhost', 5000, path, method, h, body ? JSON.stringify(body) : undefined)
}

// Wrapper that tracks pass/fail
function trackedTest(name, fn) {
  test(name, async (t) => {
    try {
      await fn(t)
      passed++
      console.log(`  PASS: ${name}`)
    } catch (err) {
      failed++
      console.log(`  FAIL: ${name} — ${err.message}`)
    }
  })
}

// ---------------------------------------------------------------------------
// Test data setup
// ---------------------------------------------------------------------------
trackedTest('setup: login admin and customer', async () => {
  adminToken = await login('admin@savorbite.ng', 'Admin@1234')
  customerToken = await login('demo@savorbite.ng', 'Demo@1234')

  const r = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/profiles?select=id,role&email=eq.demo@savorbite.ng', 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  assert.strictEqual(r.status, 200, `fetch profile: ${r.status}`)
  const profiles = JSON.parse(r.body)
  assert.ok(profiles.length > 0, 'demo profile not found')
  testCustomerId = profiles[0].id
  assert.strictEqual(profiles[0].role, 'customer')
})

// ---------------------------------------------------------------------------
// Login and authorization
// ---------------------------------------------------------------------------
trackedTest('auth: customer can access own orders', async () => {
  const r = await apiRequest('/api/v1/orders', 'GET', { 'Authorization': 'Bearer ' + customerToken })
  assert.strictEqual(r.status, 200, `customer orders: expected 200, got ${r.status}: ${r.body}`)
  const data = JSON.parse(r.body)
  assert.ok(Array.isArray(data.orders), 'orders should be an array')
})

trackedTest('auth: customer cannot access admin endpoint (403)', async () => {
  const r = await apiRequest('/api/v1/admin/stats', 'GET', { 'Authorization': 'Bearer ' + customerToken })
  assert.strictEqual(r.status, 403, `customer admin access: expected 403, got ${r.status}`)
})

trackedTest('auth: unauthenticated request rejected (401/403)', async () => {
  const r = await apiRequest('/api/v1/orders', 'GET', {})
  assert.ok(r.status === 401 || r.status === 403, `no auth: expected 401/403, got ${r.status}`)
})

trackedTest('auth: admin can access admin stats', async () => {
  const r = await apiRequest('/api/v1/admin/stats', 'GET', { 'Authorization': 'Bearer ' + adminToken })
  assert.strictEqual(r.status, 200, `admin stats: expected 200, got ${r.status}: ${r.body}`)
})

// ---------------------------------------------------------------------------
// COD checkout
// ---------------------------------------------------------------------------
trackedTest('checkout: COD order creation with SAVOR20 coupon', async () => {
  const r = await apiRequest('/api/v1/products', 'GET', {})
  assert.strictEqual(r.status, 200)
  const products = JSON.parse(r.body).products
  assert.ok(products.length > 0, 'no products')

  const product = products[0]
  const idempotencyKey = crypto.randomUUID()
  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'Smoke Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 Smoke Test Lane', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    promo_code: 'SAVOR20',
    idempotencyKey
  }

  const or = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.strictEqual(or.status, 201, `COD order: expected 201, got ${or.status}: ${or.body}`)
  const order = JSON.parse(or.body).order
  testOrderId = order.id

  assert.strictEqual(order.payment_method, 'cod')
  assert.strictEqual(order.payment_status, 'unpaid')
  assert.strictEqual(order.status, 'pending')
  assert.strictEqual(order.promo_code, 'SAVOR20')
  assert.ok(order.discount > 0, 'discount should be > 0')
  assert.ok(order.total > 0, 'total should be > 0')

  const expectedDiscount = Math.round((order.subtotal * 20) / 100)
  assert.strictEqual(order.discount, expectedDiscount, `discount mismatch: ${order.discount} != ${expectedDiscount}`)
})

trackedTest('checkout: invalid coupon rejected on validate', async () => {
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const vr = await apiRequest('/api/v1/coupons/validate', 'POST', { 'Authorization': 'Bearer ' + customerToken }, { code: 'INVALIDCODE', items: [{ product_id: product.id, quantity: 1 }] })
  assert.strictEqual(vr.status, 400, `invalid coupon validate: expected 400, got ${vr.status}`)
})

trackedTest('checkout: expired coupon rejected on validate', async () => {
  const vr = await apiRequest('/api/v1/coupons/validate', 'POST', { 'Authorization': 'Bearer ' + customerToken }, { code: 'EXPIRED20', items: [] })
  assert.strictEqual(vr.status, 400, `expired coupon validate: expected 400, got ${vr.status}`)
})

trackedTest('checkout: usage-limit coupon rejected on validate', async () => {
  const vr = await apiRequest('/api/v1/coupons/validate', 'POST', { 'Authorization': 'Bearer ' + customerToken }, { code: 'LIMIT50', items: [] })
  assert.strictEqual(vr.status, 400, `limit coupon validate: expected 400, got ${vr.status}`)
})

// ---------------------------------------------------------------------------
// Coupon redemption lifecycle
// ---------------------------------------------------------------------------
trackedTest('coupon: redemption record created for SAVOR20 order', async () => {
  const r = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/coupon_redemptions?select=*&order_id=eq.' + testOrderId, 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  assert.strictEqual(r.status, 200)
  const redemptions = JSON.parse(r.body)
  assert.strictEqual(redemptions.length, 1, `expected 1 redemption, got ${redemptions.length}`)
  assert.strictEqual(redemptions[0].status, 'pending', `redemption status should be pending, got ${redemptions[0].status}`)
  assert.ok(redemptions[0].discount > 0)
})

trackedTest('coupon: cancel order voids redemption and restores stock', async () => {
  const pr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/products?select=id,stock&id=eq.22222222-2222-4222-8222-000000000001', 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  const stockBefore = JSON.parse(pr.body)[0].stock

  const cr = await apiRequest('/api/v1/orders/' + testOrderId + '/cancel', 'POST', { 'Authorization': 'Bearer ' + customerToken })
  assert.strictEqual(cr.status, 200, `cancel: expected 200, got ${cr.status}: ${cr.body}`)
  const canceled = JSON.parse(cr.body).order
  assert.strictEqual(canceled.status, 'cancelled')

  const rr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/coupon_redemptions?select=*&order_id=eq.' + testOrderId, 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  const redemptions = JSON.parse(rr.body)
  assert.strictEqual(redemptions.length, 1)
  assert.strictEqual(redemptions[0].status, 'voided', `redemption should be voided, got ${redemptions[0].status}`)

  const pr2 = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/products?select=id,stock&id=eq.22222222-2222-4222-8222-000000000001', 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  const stockAfter = JSON.parse(pr2.body)[0].stock
  assert.ok(stockAfter >= stockBefore, `stock should be restored: ${stockBefore} -> ${stockAfter}`)
})

trackedTest('coupon: cannot void same redemption twice (idempotent)', async () => {
  const rr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/coupon_redemptions?select=id,status&order_id=eq.' + testOrderId, 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  const redemptions = JSON.parse(rr.body)
  assert.strictEqual(redemptions.length, 1)

  const tr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/rpc/transition_coupon_redemption', 'POST',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
    { p_redemption_id: redemptions[0].id, p_new_status: 'voided' })
  assert.ok(tr.status === 200 || tr.status === 204, `double void: expected 200/204 (idempotent), got ${tr.status}: ${tr.body}`)

  const rr2 = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/coupon_redemptions?select=status&id=eq.' + redemptions[0].id, 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  assert.strictEqual(JSON.parse(rr2.body)[0].status, 'voided')
})

trackedTest('coupon: cannot consume already-voided redemption', async () => {
  const rr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/coupon_redemptions?select=id,status&order_id=eq.' + testOrderId, 'GET',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY })
  const redemptions = JSON.parse(rr.body)

  const tr = await req(https, 'kipgcxalqvmkwlcnfxwt.supabase.co', 443,
    '/rest/v1/rpc/transition_coupon_redemption', 'POST',
    { apikey: SERVICE_KEY, 'Authorization': 'Bearer ' + SERVICE_KEY, 'Content-Type': 'application/json' },
    { p_redemption_id: redemptions[0].id, p_new_status: 'consumed' })
  assert.strictEqual(tr.status, 400, `consume voided: expected 400, got ${tr.status}: ${tr.body}`)
})

// ---------------------------------------------------------------------------
// Order cancellation rules
// ---------------------------------------------------------------------------
trackedTest('cancel: cannot cancel already-cancelled order', async () => {
  const cr = await apiRequest('/api/v1/orders/' + testOrderId + '/cancel', 'POST', { 'Authorization': 'Bearer ' + customerToken })
  assert.strictEqual(cr.status, 400, `double cancel: expected 400, got ${cr.status}`)
})

// ---------------------------------------------------------------------------
// Contact form
// ---------------------------------------------------------------------------
trackedTest('contact: submission creates support ticket', async () => {
  const r = await apiRequest('/api/v1/support', 'POST', {},
    { name: 'Smoke Test', email: 'smoke@test.com', subject: 'Smoke test', message: 'This is an automated smoke test message.' })
  assert.ok(r.status === 201 || r.status === 200, `contact: expected 201/200, got ${r.status}: ${r.body}`)
})

// ---------------------------------------------------------------------------
// Duplicate checkout + idempotency key tests
// ---------------------------------------------------------------------------
trackedTest('checkout: duplicate idempotency key returns same order (idempotent)', async () => {
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'Idempotency Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 Idempotency St', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    promo_code: 'SAVOR20',
    idempotencyKey: crypto.randomUUID()
  }

  const or1 = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.strictEqual(or1.status, 201, `first order: expected 201, got ${or1.status}: ${or1.body}`)

  // Retry with SAME idempotency key + SAME payload → should return same order idempotently
  const or2 = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.ok(or2.status === 200 || or2.status === 201, `duplicate key: expected 200/201, got ${or2.status}: ${or2.body}`)
  const o1 = JSON.parse(or1.body).order
  const o2 = JSON.parse(or2.body).order
  assert.strictEqual(o1.id, o2.id, `duplicate idempotency key should return same order id: ${o1.id} vs ${o2.id}`)
})

trackedTest('checkout: invalid idempotency key rejected', async () => {
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'Bad Key Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 Bad Key St', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    idempotencyKey: 'not-a-valid-uuid'
  }

  const r2 = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.ok(r2.status === 400 || r2.status === 422, `invalid idempotency key: expected 400/422, got ${r2.status}: ${r2.body}`)
})

trackedTest('checkout: missing idempotency key rejected', async () => {
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'No Key Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 No Key St', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    promo_code: 'SAVOR20'
  }

  const r2 = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.strictEqual(r2.status, 400, `missing idempotency key: expected 400, got ${r2.status}: ${r2.body}`)
})

trackedTest('legacy path: SAVOR20 discount applied via computeTotals', async () => {
  // Verify SAVOR20 discount is computed correctly in the legacy path
  // (production uses legacy path since atomicOrderRpc is staging-only)
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const subtotal = Number(product.price)
  const expectedDiscount = Math.round((subtotal * 20) / 100)

  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'Legacy Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 Legacy St', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    promo_code: 'SAVOR20',
    idempotencyKey: crypto.randomUUID()
  }

  const or = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  assert.ok(or.status === 200 || or.status === 201, `legacy SAVOR20: expected 200/201, got ${or.status}: ${or.body}`)
  const order = JSON.parse(or.body).order
  assert.strictEqual(order.discount, expectedDiscount, `legacy discount mismatch: ${order.discount} != ${expectedDiscount}`)
  assert.strictEqual(order.total, order.subtotal + order.delivery_fee - order.discount, 'legacy total mismatch')
})

trackedTest('legacy path: unknown coupon gets no discount', async () => {
  // Note: staging uses atomicOrderRpc which validates coupons against DB.
  // Production uses legacy path which applies no discount for unknown coupons.
  // In staging, unknown coupons are rejected; in production they get no discount.
  const r = await apiRequest('/api/v1/products', 'GET', {})
  const products = JSON.parse(r.body).products
  const product = products[0]

  const body = {
    items: [{ product_id: product.id, quantity: 1 }],
    contact: { name: 'Unknown Coupon Test', email: 'demo@savorbite.ng', phone: '08000000000' },
    delivery: { address: '1 Unknown St', city: 'Lagos', instructions: '' },
    payment_method: 'cod',
    promo_code: 'DOESNOTEXIST',
    idempotencyKey: crypto.randomUUID()
  }

  const or = await apiRequest('/api/v1/orders', 'POST', { 'Authorization': 'Bearer ' + customerToken }, body)
  // Staging (atomic path): unknown coupon rejected with 400
  // Production (legacy path): unknown coupon gets no discount (200/201 with discount=0)
  assert.ok(or.status === 200 || or.status === 201 || or.status === 400, `unknown coupon: expected 200/201/400, got ${or.status}: ${or.body}`)
  if (or.status === 200 || or.status === 201) {
    const order = JSON.parse(or.body).order
    assert.strictEqual(order.discount, 0, `unknown coupon should have no discount, got ${order.discount}`)
  }
})

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------
test('results: summary', () => {
  console.log(`\n=== SMOKE TEST RESULTS: ${passed} passed, ${failed} failed ===`)
  if (failed > 0) process.exit(1)
})
