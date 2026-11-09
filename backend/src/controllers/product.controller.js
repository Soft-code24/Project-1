import multer from 'multer'
import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { BUSINESS_RULES } from '../config/env.js'
import { query, querySingle } from '../services/supabase.service.js'

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      return cb(new ApiError(400, 'Only JPEG, PNG, WebP or AVIF images are allowed'))
    }
    cb(null, true)
  },
}).single('image')

export function uploadProductImage(req, res, next) {
  upload(req, res, (err) => {
    if (err) return next(err)
    if (!req.file) return next(new ApiError(400, 'Image file is required'))
    next()
  })
}

const SORT_MAP = {
  'price-low': { column: 'price', ascending: true },
  'price-high': { column: 'price', ascending: false },
  'top-rated': { column: 'rating', ascending: false },
  recommended: { column: 'created_at', ascending: false },
}

export const listProducts = asyncHandler(async (req, res) => {
  const {
    search,
    category,
    collection,
    tag,
    sort = 'recommended',
    page = 1,
    limit = 50,
    include_inactive: includeInactive,
  } = req.query

  const isAdminView = includeInactive === 'true' && req.user?.role === 'admin'
  const from = (page - 1) * limit
  const to = from + limit - 1
  const sortOption = SORT_MAP[sort] || SORT_MAP.recommended

  let builder = supabaseAdmin
    .from('products')
    .select('*, categories(id, name, slug), product_images(*, id desc)', { count: 'exact' })
    .order(sortOption.column, { ascending: sortOption.ascending })

  if (!isAdminView) builder = builder.eq('is_active', true)
  if (category && category !== 'all') builder = builder.eq('category_id', category)
  if (collection && collection !== 'all') {
    const { data: links } = await supabaseAdmin
      .from('collection_products')
      .select('product_id')
      .eq('collection_id', collection)
    const productIds = (links || []).map((l) => l.product_id)
    builder = builder.in('id', productIds.length ? productIds : [''])
  }
  if (tag) builder = builder.contains('tags', [tag])
  if (search) {
    builder = builder.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`)
  }

  const { data, error, count } = await builder.range(from, to)
  if (error) {
    throw ApiError.badRequest('Could not load products')
  }

  res.json({
    products: data || [],
    count: count ?? (data || []).length,
    page,
    limit,
    totalPages: count ? Math.ceil(count / limit) : 1,
  })
})

export const getProduct = asyncHandler(async (req, res) => {
  const product = await querySingle(
    supabaseAdmin.from('products').select('*, categories(id, name, slug)').eq('id', req.params.id).single(),
    'Product not found',
  )
  res.json({ product })
})

export const createProduct = asyncHandler(async (req, res) => {
  const payload = mapProductPayload(req.body)
  const product = await querySingle(
    supabaseAdmin.from('products').insert(payload).select().single(),
    'Could not create product',
  )
  res.status(201).json({ product })
})

export const updateProduct = asyncHandler(async (req, res) => {
  const payload = mapProductPayload(req.body)
  const product = await querySingle(
    supabaseAdmin.from('products').update(payload).eq('id', req.params.id).select().single(),
    'Could not update product',
  )
  res.json({ product })
})

export const deleteProduct = asyncHandler(async (req, res) => {
  await query(supabaseAdmin.from('products').delete().eq('id', req.params.id))
  res.json({ message: 'Product deleted' })
})

export const updateStock = asyncHandler(async (req, res) => {
  const product = await querySingle(
    supabaseAdmin.from('products').update({ stock: req.body.stock }).eq('id', req.params.id).select().single(),
    'Could not update stock',
  )
  res.json({ product })
})

// Uploads an image to Supabase Storage and links it to the product
export const uploadImage = asyncHandler(async (req, res) => {
  const { id } = req.params
  const extension = req.file.originalname.split('.').pop() || 'jpg'
  const path = `products/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUSINESS_RULES.storageBucket)
    .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: true })
  if (uploadError) {
    throw ApiError.badRequest(`Image upload failed: ${uploadError.message}`)
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUSINESS_RULES.storageBucket).getPublicUrl(path)

  const product = await querySingle(
    supabaseAdmin.from('products').update({ image_url: publicUrl }).eq('id', id).select().single(),
    'Could not link image to product',
  )

  res.status(201).json({ imageUrl: publicUrl, product })
})

function mapProductPayload(body) {
  const payload = {}
  const fields = [
    'name',
    'category_id',
    'price',
    'compare_at_price',
    'stock',
    'short_description',
    'description',
    'image_url',
    'is_featured',
    'is_active',
    'serving',
    'prep_time',
  ]
  for (const field of fields) {
    if (body[field] !== undefined) payload[field] = body[field]
  }
  if (body.tags !== undefined) {
    payload.tags = Array.isArray(body.tags) ? body.tags.filter((t) => typeof t === 'string') : []
  }
  // Auto-generate a url-friendly slug when the name is provided
  if (body.name !== undefined) {
    payload.slug = slugify(body.name)
  }
  return payload
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 120)
}
