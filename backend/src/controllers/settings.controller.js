import multer from 'multer'
import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { BUSINESS_RULES } from '../config/env.js'
import { query, querySingle } from '../services/supabase.service.js'

const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/svg+xml',
  'image/x-icon',
]
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPEG, PNG, WebP, AVIF, SVG or ICO images are allowed'))
    }
    cb(null, true)
  },
}).single('file')

export const uploadSettingsLogo = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) return next(err)
    if (!req.file) return next(new ApiError(400, 'Image file is required'))
    next()
  })
}

const defaultSettings = {
  restaurant_name: 'SavorBite',
  tagline: 'Freshly crafted meals, delivered fast',
  description: '',
  logo_url: null,
  favicon_url: null,
  contact_email: 'hello@savorbite.ng',
  contact_phone: '+234 801 234 5678',
  whatsapp: null,
  address: '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  city: 'Lagos, NG',
  socials: [],
  hours: [],
  delivery_available: true,
  pickup_available: true,
  delivery_fee: 1500,
  free_delivery_threshold: 20000,
  min_order_amount: 0,
  estimated_prep_time: '30 minutes',
  primary_color: '#F28C28',
  accent_color: '#3FA34D',
}

const updatableScalarFields = [
  'restaurant_name',
  'tagline',
  'description',
  'favicon_url',
  'contact_email',
  'contact_phone',
  'whatsapp',
  'address',
  'city',
  'delivery_available',
  'pickup_available',
  'delivery_fee',
  'free_delivery_threshold',
  'min_order_amount',
  'estimated_prep_time',
  'primary_color',
  'accent_color',
]

const jsonFields = ['socials', 'hours']

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await querySingle(
    supabaseAdmin.from('business_settings').select('*').limit(1).single(),
    'Settings not found',
  )
  res.json({ settings })
})

export const updateSettings = asyncHandler(async (req, res) => {
  const payload = {}
  for (const field of updatableScalarFields) {
    if (req.body[field] !== undefined) payload[field] = req.body[field]
  }
  for (const field of jsonFields) {
    if (req.body[field] !== undefined) {
      payload[field] =
        typeof req.body[field] === 'string' ? JSON.parse(req.body[field]) : req.body[field]
    }
  }

  const existing = await query(
    supabaseAdmin.from('business_settings').select('id').limit(1),
    'Could not read settings',
  )
  let result
  if (existing.length === 0) {
    result = await querySingle(
      supabaseAdmin.from('business_settings').insert(payload).select().single(),
      'Could not create settings',
    )
  } else {
    result = await querySingle(
      supabaseAdmin
        .from('business_settings')
        .update(payload)
        .eq('id', existing[0].id)
        .select()
        .single(),
      'Could not update settings',
    )
  }
  res.json({ settings: result })
})

export const uploadLogo = asyncHandler(async (req, res) => {
  const extension = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase()
  const path = `brand/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUSINESS_RULES.brandAssetBucket)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: true,
    })
  if (uploadError) {
    throw ApiError.badRequest(`Logo upload failed: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUSINESS_RULES.brandAssetBucket).getPublicUrl(path)

  const existing = await query(
    supabaseAdmin.from('business_settings').select('id').limit(1),
    'Could not read settings',
  )
  let result
  if (existing.length === 0) {
    result = await querySingle(
      supabaseAdmin
        .from('business_settings')
        .insert({ logo_url: publicUrl })
        .select()
        .single(),
      'Could not create settings',
    )
  } else {
    result = await querySingle(
      supabaseAdmin
        .from('business_settings')
        .update({ logo_url: publicUrl })
        .eq('id', existing[0].id)
        .select()
        .single(),
      'Could not update logo',
    )
  }
  res.status(201).json({ logoUrl: publicUrl, settings: result })
})
