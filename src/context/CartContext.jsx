import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useProducts } from './ProductContext.jsx'

const CartContext = createContext(null)
const STORAGE_KEY = 'savorbite.cart.v1'

function loadCart() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore malformed storage
  }
  return []
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)
  const { getProduct } = useProducts()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // storage may be unavailable
    }
  }, [items])

  const value = useMemo(() => {
    // detailed items resolved against the live product catalogue
    const detailedItems = items
      .map((line) => {
        const product = getProduct(line.id)
        return product ? { ...line, product, lineTotal: product.price * line.qty } : null
      })
      .filter(Boolean)

    const totalItems = items.reduce((sum, l) => sum + l.qty, 0)
    const subtotal = detailedItems.reduce((sum, l) => sum + l.lineTotal, 0)

    const addItem = (id, qty = 1) => {
      const product = getProduct(id)
      if (!product || product.stock <= 0) return
      setItems((prev) => {
        const existing = prev.find((l) => l.id === id)
        if (existing) {
          return prev.map((l) =>
            l.id === id ? { ...l, qty: Math.min(l.qty + qty, Math.max(product.stock, 1)) } : l,
          )
        }
        return [...prev, { id, qty: Math.min(qty, Math.max(product.stock, 1)) }]
      })
    }

    const setQty = (id, qty) => {
      const product = getProduct(id)
      const max = Math.max(product?.stock ?? 1, 1)
      if (qty <= 0) {
        setItems((prev) => prev.filter((l) => l.id !== id))
      } else {
        setItems((prev) => prev.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, max) } : l)))
      }
    }

    const removeItem = (id) => setItems((prev) => prev.filter((l) => l.id !== id))
    const clearCart = () => setItems([])
    const hasItem = (id) => items.some((l) => l.id === id)

    return { items, detailedItems, totalItems, subtotal, addItem, setQty, removeItem, clearCart, hasItem }
  }, [items, getProduct])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
