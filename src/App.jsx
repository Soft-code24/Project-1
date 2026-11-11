import { Routes, Route } from 'react-router-dom'
import { CustomerLayout } from './components/CustomerLayout.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Collections from './pages/Collections.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Auth from './pages/Auth.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import ResetPassword from './pages/ResetPassword.jsx'
import Orders from './pages/Orders.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Account from './pages/Account.jsx'
import Support from './pages/Support.jsx'
import Blog from './pages/Blog.jsx'
import BlogPost from './pages/BlogPost.jsx'
import Privacy from './pages/Privacy.jsx'
import Terms from './pages/Terms.jsx'
import Refunds from './pages/Refunds.jsx'
import Delivery from './pages/Delivery.jsx'
import NotFound from './pages/NotFound.jsx'
import { AdminLayout } from './admin/AdminLayout.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminOverview from './admin/AdminOverview.jsx'
import AdminProducts from './admin/AdminProducts.jsx'
import AdminOrders from './admin/AdminOrders.jsx'
import AdminCategories from './admin/AdminCategories.jsx'
import AdminCustomers from './admin/AdminCustomers.jsx'
import AdminCustomerDetail from './admin/AdminCustomerDetail.jsx'
import AdminCustomerAnalytics from './admin/AdminCustomerAnalytics.jsx'
import AdminCoupons from './admin/AdminCoupons.jsx'
import AdminSettings from './admin/AdminSettings.jsx'

// Dev-only coupon validation tester — never exposed in production.
import CouponValidateTest from './pages/CouponValidateTest.jsx'

export default function App() {
  return (
    <Routes>
      {/* Customer storefront */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/collections/:slug" element={<Collections />} />
        <Route path="/products/:slug" element={<ProductDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/signup" element={<Auth />} />
        <Route path="/order/:id" element={<OrderConfirmation />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="/support" element={<Support />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/delivery" element={<Delivery />} />
        <Route path="*" element={<NotFound />} />
        {import.meta.env.DEV && (
          <Route path="/dev/coupon-test" element={<CouponValidateTest />} />
        )}
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="customers" element={<AdminCustomers />} />
        <Route path="customers/:id" element={<AdminCustomerDetail />} />
        <Route path="coupons" element={<AdminCoupons />} />
        <Route path="customer-analytics" element={<AdminCustomerAnalytics />} />
        <Route path="settings" element={<AdminSettings />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
    </Routes>
  )
}
