import 'dotenv/config'

const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET']

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
  clientUrls: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((url) => url.trim())
    .filter(Boolean),
  supabase: {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    jwtSecret: process.env.SUPABASE_JWT_SECRET,
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
  orderStatuses: ['pending', 'paid', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'],
  paymentMethods: ['paystack-card', 'paystack-transfer', 'flutterwave', 'cod'],
}

export default env
