import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { Button } from '../components/ui/Button.jsx'

export default function CouponValidateTest() {
  const { user, isLoading } = useAuth()
  const [code, setCode] = useState('')
  const [productId, setProductId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [apiUrl, setApiUrl] = useState('')

  useEffect(() => {
    setApiUrl(import.meta.env.VITE_API_URL || 'http://localhost:5000')
  }, [])

  useEffect(() => {
    let mounted = true
    async function loadProducts() {
      setProductsLoading(true)
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, price, stock, is_active')
          .eq('is_active', true)
          .order('name', { ascending: true })
          .limit(50)
        if (mounted) {
          if (error) {
            setError(`Could not load products: ${error.message}`)
          } else {
            setProducts(data || [])
          }
        }
      } catch (err) {
        if (mounted) setError(err.message || 'Failed to load products')
      } finally {
        if (mounted) setProductsLoading(false)
      }
    }
    loadProducts()
    return () => {
      mounted = false
    }
  }, [])

  const handleValidate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        setError('No active session. Please log in.')
        setLoading(false)
        return
      }

      const items = productId
        ? [{ product_id: productId, quantity: Number(quantity) || 1 }]
        : []

      const res = await fetch(`${apiUrl}/api/v1/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ code: code.trim(), items }),
      })

      const body = await res.json()
      if (!res.ok) {
        setError(body.error || `Validation failed (${res.status})`)
      } else {
        setResult(body)
      }
    } catch (err) {
      setError(err.message || 'Unexpected error')
    } finally {
      setLoading(false)
    }
  }

  if (isLoading) return <div className="p-4">Loading session…</div>
  if (!user) return <div className="p-4">Not authenticated.</div>

  const selectedProduct = products.find((p) => p.id === productId)

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-4 p-3 rounded-lg border border-amber-200 bg-amber-50 text-amber-900 text-sm">
        <strong>Dev-only coupon validation tester</strong> — available in development only. Uses your current
        Supabase session. No data is written to the database.
      </div>

      <div className="mb-2 text-xs text-text-secondary">
        Authenticated as: {user.email} ({user.role}) — account: {user.accountStatus}
      </div>

      <form onSubmit={handleValidate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-text-primary">
            Coupon code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. WELCOME10"
            className="w-full border border-border-strong bg-surface rounded-lg px-3 py-2 text-text-primary dark:bg-surface dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-text-primary">
              Product
            </label>
            <select
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full border border-border-strong bg-surface rounded-lg px-3 py-2 text-text-primary dark:bg-surface dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary focus:ring-1 focus:ring-primary"
            >
              <option value="">None (code only)</option>
              {productsLoading ? (
                <option disabled>Loading products…</option>
              ) : (
                products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ₦{Number(p.price).toFixed(2)} (stock: {p.stock})
                  </option>
                ))
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-text-primary">
              Quantity
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              min="1"
              disabled={!productId}
              className="w-full border border-border-strong bg-surface rounded-lg px-3 py-2 text-text-primary dark:bg-surface dark:text-text-primary placeholder:text-text-secondary dark:placeholder:text-text-secondary focus:ring-1 focus:ring-primary"
            />
          </div>
          {selectedProduct && (
            <div className="flex items-end">
              <span className="text-sm text-text-secondary">
                Price: ₦{Number(selectedProduct.price).toFixed(2)} | Stock: {selectedProduct.stock}
              </span>
            </div>
          )}
          <div className="flex items-end">
            <Button type="submit" disabled={loading || !code.trim()}>
              {loading ? 'Validating…' : 'Validate coupon'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
            <strong>Error:</strong> {error}
          </div>
        )}

        {result && (
          <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-900">
            <div className="flex justify-between text-sm mb-2">
              <span>Coupon:</span> <span className="font-mono">{result.code}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Cart subtotal:</span> <span>₦{result.subtotal?.toFixed(2) ?? '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Discount:</span> <span className="font-semibold">₦{result.discount?.toFixed(2) ?? '0.00'}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span>Total after discount:</span> <span className="font-semibold">₦{result.total_after_discount?.toFixed(2) ?? '0.00'}</span>
            </div>
            <div className="text-sm mt-2">{result.message}</div>
            <pre className="mt-3 text-[10px] overflow-x-auto bg-surface p-2 rounded border border-border-subtle">{JSON.stringify(result, null, 2)}</pre>
          </div>
        )}
      </form>

      <div className="mt-6 p-3 rounded-lg border border-border-subtle bg-surface text-sm text-text-secondary">
        <h3 className="font-medium mb-2">Test scenarios</h3>
        <ul className="space-y-1 list-disc list-inside">
            <li><strong>Valid percentage coupon:</strong> select a product &rarr; expect discount &gt; 0.</li>
            <li><strong>Valid fixed-amount coupon:</strong> select a product &rarr; expect fixed discount.</li>
            <li><strong>Invalid code:</strong> enter non-existent code &rarr; expect 400 "Invalid coupon code."</li>
          <li><strong>Expired / inactive / future coupon:</strong> expect 400.</li>
          <li><strong>Minimum order not met:</strong> select items below min_order_amount → expect 400.</li>
          <li><strong>Empty cart:</strong> no product → expect valid, zero discount.</li>
          <li><strong>Insufficient stock:</strong> quantity exceeds stock → expect 400.</li>
          <li><strong>Suspended account:</strong> expect 400 "account is suspended."</li>
        </ul>
        <p className="text-[10px] text-text-secondary mt-2">
          All prices and stock are read from the Supabase products table — client-submitted prices are never trusted.
          No usage counts or redemption records are created.
        </p>
      </div>
    </div>
  )
}
