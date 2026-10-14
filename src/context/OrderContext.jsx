import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { MOCK_ORDERS } from '../data/orders.js'
import { orderNumber } from '../lib/currency.js'

const OrderContext = createContext(null)
const STORAGE_KEY = 'savorbite.orders.v1'

function loadOrders() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed)) {
        // merge in mock orders that may have been added after the user's session started
        const ids = new Set(parsed.map((o) => o.id))
        return [...parsed, ...MOCK_ORDERS.filter((o) => !ids.has(o.id))]
      }
    }
  } catch {
    // ignore malformed storage
  }
  return MOCK_ORDERS
}

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState(loadOrders)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
    } catch {
      // storage may be unavailable
    }
  }, [orders])

  const value = useMemo(() => {
    const placeOrder = ({ items, contact, delivery, paymentMethod, totals }) => {
      const order = {
        id: orderNumber(),
        customerId: 'you',
        customerName: contact.name,
        createdAt: new Date().toISOString(),
        status: paymentMethod === 'cod' ? 'pending' : 'paid',
        paymentMethod,
        items: items.map((l) => ({
          productId: l.product.id,
          name: l.product.name,
          price: l.product.price,
          qty: l.qty,
          image: l.product.image,
        })),
        subtotal: totals.subtotal,
        discount: totals.discount,
        deliveryFee: totals.deliveryFee,
        total: totals.total,
        contact,
        delivery,
      }
      setOrders((prev) => [order, ...prev])
      return order
    }

    const updateOrderStatus = (id, status) =>
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))

    const getOrder = (id) => orders.find((o) => o.id === id)

    return { orders, placeOrder, updateOrderStatus, getOrder }
  }, [orders])

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>
}

export function useOrders() {
  const ctx = useContext(OrderContext)
  if (!ctx) throw new Error('useOrders must be used within OrderProvider')
  return ctx
}
