import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { query, querySingle } from '../services/supabase.service.js'

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await query(
    supabaseAdmin.from('categories').select('*').order('sort_order', { ascending: true }),
    'Could not load categories',
  )
  res.json({ categories })
})

export const createCategory = asyncHandler(async (req, res) => {
  const { name, slug, sort_order } = req.body
  const category = await querySingle(
    supabaseAdmin.from('categories').insert({ name, slug, sort_order: sort_order ?? 0 }).select().single(),
  )
  res.status(201).json({ category })
})

export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const patch = {}
  for (const key of ['name', 'slug', 'description', 'image_url', 'sort_order', 'is_active']) {
    if (req.body[key] !== undefined) patch[key] = req.body[key]
  }
  const category = await querySingle(
    supabaseAdmin.from('categories').update(patch).eq('id', id).select().single(),
    'Category not found',
  )
  res.json({ category })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params
  const { reassign_to } = req.body

  const { data: products } = await supabaseAdmin.from('products').select('id').eq('category_id', id)

  const productCount = (products || []).length

  if (productCount > 0) {
    if (!reassign_to || typeof reassign_to !== 'string') {
      throw ApiError.conflict(
        `Category contains ${productCount} product(s). Reassign them to another category before deleting.`,
      )
    }

    const { data: target } = await supabaseAdmin
      .from('categories')
      .select('id, is_active')
      .eq('id', reassign_to)
      .single()

    if (!target) {
      throw ApiError.badRequest('Reassignment target category does not exist')
    }
    if (reassign_to === id) {
      throw ApiError.badRequest('Cannot reassign products to the category being deleted')
    }
    if (!target.is_active) {
      throw ApiError.badRequest('Reassignment target category must be active')
    }

    const { error: reassignError } = await supabaseAdmin
      .from('products')
      .update({ category_id: reassign_to })
      .eq('category_id', id)

    if (reassignError) {
      throw ApiError.badRequest('Could not reassign products: ' + reassignError.message)
    }
  }

  await query(supabaseAdmin.from('categories').delete().eq('id', id))
  res.json({ message: 'Category deleted', productsReassigned: productCount > 0 ? productCount : 0 })
})
