import { Routes, Route } from 'react-router-dom'
import { CustomerLayout } from './components/CustomerLayout.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Auth from './pages/Auth.jsx'
import Orders from './pages/Orders.jsx'
import About from './pages/About.jsx'
import Contact from './pages/Contact.jsx'
import Account from './pages/Account.jsx'
import NotFound from './pages/NotFound.jsx'
import { AdminLayout } from './admin/AdminLayout.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import AdminOverview from './admin/AdminOverview.jsx'
import AdminProducts from './admin/AdminProducts.jsx'
import AdminOrders from './admin/AdminOrders.jsx'

export default function App() {
  return (
    <Routes>
      {/* Customer storefront */}
      <Route element={<CustomerLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Auth />} />
        <Route path="/register" element={<Auth />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/account" element={<Account />} />
        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Admin dashboard */}
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminOverview />} />
        <Route path="products" element={<AdminProducts />} />
        <Route path="orders" element={<AdminOrders />} />
      </Route>
    </Routes>
  )
}
