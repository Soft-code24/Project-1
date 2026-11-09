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

export function uploadCollectionImage(req, res, next) {
  upload(req, res, (err) => {
    if (err) return next(err)
    if (!req.file) return next(new ApiError(400, 'Image file is required'))
    next()
  })
}

export const listCollections = asyncHandler(async (req, res) => {
  const { is_published: isPublished } = req.query

  let builder = supabaseAdmin
    .from('collections')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (isPublished === 'true' || (!req.user || req.user.role !== 'admin')) {
    builder = builder.eq('is_published', true)
  }

  const { data, error } = await builder
  if (error) throw ApiError.badRequest('Could not load collections')

  res.json({ collections: data || [] })
})

export const getCollection = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { include_products: includeProducts } = req.query

  const collection = await querySingle(
    supabaseAdmin.from('collections').select('*').eq('id', id).single(),
    'Collection not found',
  )

  if (!collection.is_published && (!req.user || req.user.role !== 'admin')) {
    throw ApiError.notFound('Collection not found')
  }

  let products = []
  if (includeProducts === 'true') {
    const { data: links } = await supabaseAdmin
      .from('collection_products')
      .select('product_id, position')
      .eq('collection_id', id)
      .order('position', { ascending: true })

    if (links && links.length) {
      const productIds = links.map((l) => l.product_id)
      const { data: productsData, error } = await supabaseAdmin
        .from('products')
        .select('*, categories(id, name, slug)')
        .in('id', productIds)
      if (error) throw ApiError.badRequest('Could not load collection products')

      // Preserve collection order
      const byId = new Map((productsData || []).map((p) => [p.id, p]))
      products = links
        .map((l) => byId.get(l.product_id))
        .filter(Boolean)
        .map((p, idx) => ({ ...p, position: links[idx].position }))
    }
  }

  res.json({ collection, products })
})

export const createCollection = asyncHandler(async (req, res) => {
  const {
    name,
    handle,
    description,
    image_url,
    type = 'manual',
    rules = [],
    is_published = true,
    sort_order = 0,
  } = req.body

  if (!name || !handle) {
    throw ApiError.badRequest('Name and handle are required')
  }

  const collection = await querySingle(
    supabaseAdmin
      .from('collections')
      .insert({
        name,
        handle,
        description: description || '',
        image_url: image_url || null,
        type,
        rules: Array.isArray(rules) ? rules : [],
        is_published,
        sort_order: Number(sort_order) || 0,
      })
      .select()
      .single(),
    'Could not create collection',
  )

  res.status(201).json({ collection })
})

export const updateCollection = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updatable = ['name', 'handle', 'description', 'image_url', 'type', 'rules', 'is_published', 'sort_order']
  const patch = {}
  for (const key of updatable) {
    if (req.body[key] !== undefined) patch[key] = req.body[key]
  }

  const collection = await querySingle(
    supabaseAdmin.from('collections').update(patch).eq('id', id).select().single(),
    'Could not update collection',
  )

  res.json({ collection })
})

export const deleteCollection = asyncHandler(async (req, res) => {
  await query(supabaseAdmin.from('collections').delete().eq('id', req.params.id))
  res.json({ message: 'Collection deleted' })
})

export const addProductToCollection = asyncHandler(async (req, res) => {
  const { id: collectionId } = req.params
  const { product_id: productId, position = 0 } = req.body

  if (!productId) throw ApiError.badRequest('product_id is required')

  // Verify product exists
  await querySingle(
    supabaseAdmin.from('products').select('id').eq('id', productId).single(),
    'Product not found',
  )

  const link = await querySingle(
    supabaseAdmin
      .from('collection_products')
      .insert({ collection_id: collectionId, product_id: productId, position: Number(position) || 0 })
      .select()
      .single(),
    'Could not add product to collection',
  )

  res.status(201).json({ link })
})

export const removeProductFromCollection = asyncHandler(async (req, res) => {
  const { id: collectionId, productId } = req.params
  await query(
    supabaseAdmin
      .from('collection_products')
      .delete()
      .eq('collection_id', collectionId)
      .eq('product_id', productId),
  )
  res.json({ message: 'Product removed from collection' })
})
