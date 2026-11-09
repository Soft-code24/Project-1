import { asyncHandler, ApiError } from '../utils/ApiError.js'
import { supabaseAdmin } from '../config/supabase.js'
import { query, querySingle } from '../services/supabase.service.js'

export const listBlogPosts = asyncHandler(async (req, res) => {
  const { include_unpublished: includeUnpublished } = req.query
  let builder = supabaseAdmin.from('blog_posts').select('*').order('created_at', { ascending: false })
  if (!includeUnpublished || includeUnpublished !== 'true') {
    builder = builder.eq('published', true)
  }
  const posts = await query(builder, 'Could not load blog posts')
  res.json({ posts })
})

export const getBlogPost = asyncHandler(async (req, res) => {
  const { slug } = req.params
  const post = await querySingle(
    supabaseAdmin.from('blog_posts').select('*').eq('slug', slug).single(),
    'Post not found',
  )
  if (!post.published) throw ApiError.notFound('Post not found')
  res.json({ post })
})

export const createBlogPost = asyncHandler(async (req, res) => {
  const { title, slug, cover_image, excerpt, content, published = false } = req.body
  if (!title || !title.trim()) throw ApiError.badRequest('Title is required.')
  if (!slug || !slug.trim()) throw ApiError.badRequest('Slug is required.')
  const post = await querySingle(
    supabaseAdmin
      .from('blog_posts')
      .insert({
        title: title.trim(),
        slug: slug.trim(),
        cover_image: cover_image || null,
        excerpt: excerpt || '',
        content: content || '',
        published: Boolean(published),
      })
      .select()
      .single(),
    'Could not create blog post',
  )
  res.status(201).json({ post })
})

export const updateBlogPost = asyncHandler(async (req, res) => {
  const { id } = req.params
  const updatable = ['title', 'slug', 'cover_image', 'excerpt', 'content', 'published']
  const patch = {}
  for (const key of updatable) {
    if (req.body[key] !== undefined) patch[key] = req.body[key]
  }
  const post = await querySingle(
    supabaseAdmin.from('blog_posts').update(patch).eq('id', id).select().single(),
    'Could not update blog post',
  )
  res.json({ post })
})

export const deleteBlogPost = asyncHandler(async (req, res) => {
  await query(supabaseAdmin.from('blog_posts').delete().eq('id', req.params.id))
  res.json({ message: 'Post deleted' })
})
