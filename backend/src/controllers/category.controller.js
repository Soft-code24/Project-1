import { asyncHandler } from '../utils/ApiError.js'
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
  for (const key of ['name', 'slug', 'sort_order']) {
    if (req.body[key] !== undefined) patch[key] = req.body[key]
  }
  const category = await querySingle(
    supabaseAdmin.from('categories').update(patch).eq('id', id).select().single(),
  )
  res.json({ category })
})

export const deleteCategory = asyncHandler(async (req, res) => {
  await query(supabaseAdmin.from('categories').delete().eq('id', req.params.id))
  res.json({ message: 'Category deleted' })
})
