import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

const OrderContext = createContext(null)

function mapBackendOrder(order) {
  return {
    id: order.id,
    orderNumber: order.order_number,
    customerId: order.user_id,
    customerName: order.contact?.name || '',
    createdAt: order.created_at,
    status: order.status,
    paymentMethod: order.payment_method,
    paymentStatus: order.payment_status,
    items: (order.order_items || []).map((item) => ({
      productId: item.product_id,
      name: item.product_name,
      price: Number(item.unit_price) || 0,
      qty: item.quantity,
      image: item.products?.image_url || '',
    })),
    subtotal: Number(order.subtotal) || 0,
    discount: Number(order.discount) || 0,
    deliveryFee: Number(order.delivery_fee) || 0,
    total: Number(order.total) || 0,
    contact: order.contact || {},
    delivery: order.delivery || {},
    notes: order.notes || '',
  }
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await api.getMyOrders()
        if (mounted) {
          setOrders((data.orders || []).map(mapBackendOrder))
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setLoading(false)
          setError(err.message || 'Failed to load orders')
        }
      }
    }
    if (user) {
      load()
    } else {
      setOrders([])
      setLoading(false)
    }
    return () => {
      mounted = false
    }
  }, [user])

  const value = useMemo(() => {
    const placeOrder = async ({ items, contact, delivery, paymentMethod, totals }) => {
      if (user?.accountStatus === 'suspended') {
        throw new Error('Your account is suspended and cannot place orders.')
      }
      const created = await api.createOrder({
        items: items.map((l) => ({
          product_id: l.product.id,
          quantity: l.qty,
        })),
        contact: {
          name: contact.name.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
        },
        delivery: {
          address: delivery.address.trim(),
          city: delivery.city.trim(),
          instructions: (delivery.instructions || '').trim(),
        },
        payment_method: paymentMethod,
        promo_code: totals.promoCode || undefined,
      })
      const mapped = mapBackendOrder(created.order)
      setOrders((prev) => [mapped, ...prev])
      return mapped
    }

    const updateOrderStatus = (id, status) =>
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))

    const getOrder = (id) => orders.find((o) => o.id === id)

    return { orders, placeOrder, updateOrderStatus, getOrder, loading, error }
  }, [orders, loading, error])

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
