import { Router } from 'express'
import * as blogController from '../controllers/blog.controller.js'
import { param, query, body } from 'express-validator'
import { validate } from '../middleware/validate.js'

const router = Router()

// Public: list published posts, get a single published post
router.get('/', query('include_unpublished').optional().isIn(['true', 'false']), validate, blogController.listBlogPosts)
router.get('/:slug', param('slug').notEmpty().withMessage('Slug is required.'), validate, blogController.getBlogPost)

// Admin: full CRUD
router.post(
  '/',
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required.'),
  body('slug').trim().isLength({ min: 1, max: 200 }).withMessage('Slug is required.'),
  body('published').optional().isBoolean(),
  validate,
  blogController.createBlogPost,
)
router.patch(
  '/:id',
  param('id').isUUID().withMessage('Invalid post id'),
  validate,
  blogController.updateBlogPost,
)
router.delete('/:id', param('id').isUUID().withMessage('Invalid post id'), validate, blogController.deleteBlogPost)

export default router
