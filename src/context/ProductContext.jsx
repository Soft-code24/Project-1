import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { PRODUCTS } from '../data/products.js'

const ProductContext = createContext(null)
const STORAGE_KEY = 'savorbite.products.v1'

function loadProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch {
    // ignore malformed storage
  }
  return PRODUCTS
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState(loadProducts)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
    } catch {
      // storage may be unavailable
    }
  }, [products])

  const value = useMemo(() => {
    const getProduct = (id) => products.find((p) => p.id === id)
    const getBySlug = (slugOrId) =>
      products.find((p) => p.id === slugOrId || p.name.toLowerCase().replace(/\s+/g, '-') === slugOrId)
    const featured = () => products.filter((p) => p.featured && p.stock > 0)
    const related = (product, count = 4) =>
      products
        .filter((p) => p.category === product.category && p.id !== product.id)
        .concat(products.filter((p) => p.category !== product.category && p.stock > 0 && p.id !== product.id))
        .slice(0, count)
    const saveProduct = (product) => {
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id)
        if (exists) return prev.map((p) => (p.id === product.id ? { ...p, ...product } : p))
        return [{ ...product, id: product.id || `p${Date.now()}` }, ...prev]
      })
    }
    const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id))
    const resetProducts = () => setProducts(PRODUCTS)

    return { products, getProduct, getBySlug, featured, related, saveProduct, deleteProduct, resetProducts }
  }, [products])

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts must be used within ProductProvider')
  return ctx
}
