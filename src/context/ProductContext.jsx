import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api } from '../lib/api.js'
import { CATEGORIES, DIET_TAGS } from '../data/products.js'

const ProductContext = createContext(null)

function mapProduct(p) {
  // Build category slug from categories join (category_id uuid → slug)
  const categorySlug = p.categories?.slug || ''
  const imageUrl = p.image_url || `/images/${p.slug}.jpg`

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: categorySlug,
    category_id: p.category_id,
    price: Number(p.price) || 0,
    compareAt: p.compare_at_price ? Number(p.compare_at_price) : null,
    image: imageUrl,
    alt: p.name,
    serving: p.serving || '',
    prepTime: p.prep_time || '',
    tags: Array.isArray(p.tags) ? p.tags : [],
    rating: Number(p.rating) || 0,
    reviews: p.reviews_count || 0,
    short: p.short_description || '',
    description: p.description || '',
    featured: Boolean(p.is_featured),
    stock: Number(p.stock) || 0,
    isActive: Boolean(p.is_active),
  }
}

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await api.listProducts()
        if (mounted) {
          setProducts((data.products || []).map(mapProduct))
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setLoading(false)
          setError(err.message)
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(() => {
    const getProduct = (id) => products.find((p) => p.id === id)
    const getBySlug = (slugOrId) =>
      products.find(
        (p) =>
          p.id === slugOrId ||
          p.slug === slugOrId ||
          p.name.toLowerCase().replace(/\s+/g, '-') === slugOrId
      )
    const featured = () => products.filter((p) => p.featured && p.stock > 0)
    const related = (product, count = 4) =>
      products
        .filter((p) => p.category === product.category && p.id !== product.id)
        .concat(
          products.filter(
            (p) => p.category !== product.category && p.stock > 0 && p.id !== product.id
          )
        )
        .slice(0, count)
    const saveProduct = (product) => {
      setProducts((prev) => {
        const exists = prev.some((p) => p.id === product.id)
        if (exists) return prev.map((p) => (p.id === product.id ? { ...p, ...product } : p))
        return [{ ...product, id: product.id || crypto.randomUUID() }, ...prev]
      })
    }
    const deleteProduct = (id) => setProducts((prev) => prev.filter((p) => p.id !== id))
    const resetProducts = () => setProducts([])

    return {
      products,
      getProduct,
      getBySlug,
      featured,
      related,
      saveProduct,
      deleteProduct,
      resetProducts,
      loading,
      error,
    }
  }, [products, loading, error])

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
}

export function useProducts() {
  const ctx = useContext(ProductContext)
  if (!ctx) throw new Error('useProducts must be used within ProductProvider')
  return ctx
}
