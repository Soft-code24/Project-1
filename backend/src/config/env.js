import 'dotenv/config'

// When NODE_ENV=staging, explicitly load backend/.env.staging
// to ensure we never accidentally connect to production Supabase
if (process.env.NODE_ENV === 'staging') {
  const dotenv = await import('dotenv/config')
  // dotenv.config is the function exported by dotenv/config
  dotenv.default.config({ path: 'backend/.env.staging' })
}

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
  console.error(`[config] Missing required environment variables: ${missing.join(', ')}`)
  console.error('[config] Copy .env.example to .env and fill in the values.')
  process.exit(1)
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:5178')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY || '',
    publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
    callbackUrl: process.env.PAYSTACK_CALLBACK_URL || '',
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY || '',
    senderEmail: process.env.BREVO_SENDER_EMAIL || '',
    senderName: process.env.BREVO_SENDER_NAME || 'SavorBite',
    ownerEmail: process.env.BREVO_OWNER_EMAIL || '',
  },
}

// Business rules shared with the storefront
export const BUSINESS_RULES = {
  currency: 'NGN',
  deliveryFee: 1500,
  freeDeliveryThreshold: 20000,
  promoCode: 'SAVOR20',
  promoDiscountPercent: 20,
  maxCartItems: 30,
  storageBucket: 'product-images',
  brandAssetBucket: 'brand-assets',
  orderStatuses: ['pending', 'paid', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
  paymentMethods: ['paystack-card', 'paystack-transfer', 'flutterwave', 'cod'],

  // Feature flag: unified atomic order + coupon redemption RPC (Phase 2G-C2B)
  // Disabled by default — existing computeTotals flow remains in production.
  atomicOrderRpc: (process.env.SUPABASE_URL || '').includes('kipgcxalqvmkwlcnfxwt.supabase.co'),

  // Abandoned order cleanup: orders pending + unpaid older than this many
  // minutes are cancelled and their coupon reservation released / stock restored.
  // Only applies to online payment methods (paystack-card, paystack-transfer,
  // flutterwave). COD orders are never auto-cancelled.
  abandonedOrderTimeoutMinutes: Number(process.env.ABANDONED_ORDER_TIMEOUT_MINUTES || 60),

  // Customer segmentation thresholds (configurable)
  segmentation: {
    vipSpendThreshold: Number(process.env.VIP_SPEND_THRESHOLD || 100000),
    vipOrderCountThreshold: Number(process.env.VIP_ORDER_COUNT_THRESHOLD || 10),
    loyalOrderCountThreshold: Number(process.env.VIP_ORDER_COUNT_THRESHOLD || 6),
    returningMinOrderCount: Number(process.env.RETURNING_MIN_ORDER_COUNT || 2),
    returningMaxOrderCount: Number(process.env.RETURNING_MAX_ORDER_COUNT || 5),
    inactiveDays: Number(process.env.INACTIVE_DAYS || 90),
    newCustomerDays: Number(process.env.NEW_CUSTOMER_DAYS || 30),
  },
}

// ----------------------------------------------------------------------------
// Staging safety guard: refuse to run checkout/payment operations against
// production Supabase. This prevents accidental writes to production data
// when the backend is accidentally pointed at the production project.
// ----------------------------------------------------------------------------
export const isStagingEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const stagingHost = 'kipgcxalqvmkwlcnfxwt.supabase.co'
  return supabaseUrl.includes(stagingHost)
}

export const isProductionEnv = () => {
  const supabaseUrl = process.env.SUPABASE_URL || ''
  const productionHost = 'vdzhcaalzeljiwstrzui.supabase.co'
  return supabaseUrl.includes(productionHost)
}

export const assertStagingOnly = () => {
  if (isProductionEnv()) {
    throw new Error(
      '[SAFETY] Backend is connected to PRODUCTION Supabase. ' +
      'Checkout/payment operations are disabled to prevent accidental production data modification. ' +
      'Set SUPABASE_URL to the staging project (kipgcxalqvmkwlcnfxwt.supabase.co) to enable checkout.'
    )
  }
}

export const requireStagingEnv = () => {
  if (!isStagingEnv()) {
    throw new Error(
      '[SAFETY] Backend is not connected to the staging Supabase project. ' +
      'Checkout/payment operations require SUPABASE_URL=https://kipgcxalqvmkwlcnfxwt.supabase.co'
    )
  }
}

export default env
