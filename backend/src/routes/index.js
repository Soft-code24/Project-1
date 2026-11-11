import { Router } from 'express'
import authRoutes from './auth.routes.js'
import categoryRoutes from './category.routes.js'
import customerRoutes from './customer.routes.js'
import couponRoutes from './coupon.routes.js'
import customerCouponRoutes from './customerCoupon.routes.js'
import productRoutes from './product.routes.js'
import settingsRoutes from './settings.routes.js'
import collectionRoutes from './collection.routes.js'
import blogRoutes from './blog.routes.js'
import supportRoutes from './support.routes.js'
import orderRoutes from './order.routes.js'
import paymentRoutes from './payment.routes.js'
import adminRoutes from './admin.routes.js'

const router = Router()

router.use('/auth', authRoutes)
router.use('/categories', categoryRoutes)
router.use('/admin/customers', customerRoutes)
router.use('/admin/coupons', couponRoutes)
router.use('/coupons', customerCouponRoutes)
router.use('/products', productRoutes)
router.use('/settings', settingsRoutes)
router.use('/collections', collectionRoutes)
router.use('/blog', blogRoutes)
router.use('/support', supportRoutes)
router.use('/orders', orderRoutes)
router.use('/payments', paymentRoutes)
router.use('/admin', adminRoutes)

export default router
