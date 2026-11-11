import { useMemo, useState, useEffect } from 'react'
import { Package, Pencil, Plus, Search, Trash2, Utensils } from 'lucide-react'
import { DIET_TAGS, LOW_STOCK_THRESHOLD } from '../data/products.js'
import { useProducts } from '../context/ProductContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatNaira } from '../lib/currency.js'
import { api } from '../lib/api.js'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { StockBadge } from '../components/ui/Badges.jsx'

const emptyForm = {
  name: '',
  category_id: '',
  price: '',
  compare_at_price: '',
  stock: '',
  short_description: '',
  description: '',
  image_url: '',
  tags: [],
  is_featured: false,
  is_active: true,
}

export default function AdminProducts() {
  const { products, saveProduct, deleteProduct } = useProducts()
  const { showToast } = useToast()

  const [categories, setCategories] = useState([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [editing, setEditing] = useState(null) // product or 'new'
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)
  const [stockUpdating, setStockUpdating] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [catsLoaded, setCatsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true
    async function loadCats() {
      try {
        const data = await api.listCategories()
        if (mounted) {
          setCategories(data.categories || [])
          setCatsLoaded(true)
        }
      } catch {
        setCatsLoaded(true)
      }
    }
    loadCats()
    return () => {
      mounted = false
    }
  }, [])

  const categoryNameById = useMemo(() => {
    const map = {}
    categories.forEach((c) => {
      map[c.id] = c.name
    })
    return map
  }, [categories])

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }))

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return products.filter((p) => {
      if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false
      if (q && !p.name.toLowerCase().includes(q)) return false
      if (stockFilter === 'out-of-stock' && p.stock > 0) return false
      if (stockFilter === 'low-stock' && (p.stock <= 0 || p.stock > LOW_STOCK_THRESHOLD)) return false
      if (stockFilter === 'in-stock' && p.stock <= LOW_STOCK_THRESHOLD) return false
      return true
    })
  }, [products, search, categoryFilter, stockFilter])

  const openNew = () => {
    setForm(emptyForm)
    setErrors({})
    setImageFile(null)
    setImagePreview(null)
    setEditing('new')
  }

  const openEdit = (product) => {
    setForm({
      name: product.name || '',
      category_id: product.category_id || '',
      price: String(product.price || ''),
      compare_at_price: product.compare_at_price ? String(product.compare_at_price) : '',
      stock: String(product.stock || ''),
      short_description: product.short_description || '',
      description: product.description || '',
      image_url: product.image || '',
      tags: product.tags || [],
      is_featured: Boolean(product.is_featured),
      is_active: Boolean(product.is_active),
    })
    setErrors({})
    setImageFile(null)
    setImagePreview(product.image || null)
    setEditing(product)
  }

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleTag = (tagId) =>
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((t) => t !== tagId) : [...prev.tags, tagId],
    }))

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter a dish name.'
    if (!form.price || Number(form.price) <= 0) next.price = 'Enter a valid price.'
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Enter a stock quantity (0 for sold out).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildPayload = () => ({
    name: form.name.trim(),
    ...(form.category_id ? { category_id: form.category_id } : {}),
    price: Number(form.price),
    ...(form.compare_at_price ? { compare_at_price: Number(form.compare_at_price) } : {}),
    stock: Number(form.stock),
    short_description: form.short_description.trim(),
    description: form.description.trim() || form.short_description.trim(),
    image_url: form.image_url.trim() || null,
    tags: form.tags,
    is_featured: form.featured,
    is_active: form.is_active,
  })

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const maxSize = 5 * 1024 * 1024 // 5 MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
    if (!allowedTypes.includes(file.type)) {
      showToast('Only JPEG, PNG, WebP, or AVIF images are allowed.', 'error')
      return
    }
    if (file.size > maxSize) {
      showToast('Image must be 5 MB or smaller.', 'error')
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = buildPayload()
      let productId
      if (editing === 'new') {
        const data = await api.createProduct(payload)
        productId = data.product.id
        saveProduct({ ...data.product, rating: 4.5, reviews: 0, alt: payload.name })
        showToast('Product added', 'success')
      } else {
        await api.updateProduct(editing.id, payload)
        saveProduct({ ...editing, ...payload })
        showToast('Product updated', 'success')
        productId = editing.id
      }
      setEditing(null)

      // Upload image after product exists
      if (imageFile && productId) {
        setUploadingImage(true)
        try {
          const data = await api.uploadProductImage(productId, imageFile)
          saveProduct({ ...data.product, rating: product.rating ?? 4.5, reviews: product.reviews ?? 0 })
          showToast('Product image uploaded', 'success')
          setImageFile(null)
          setImagePreview(null)
        } catch (err) {
          showToast(err.message || 'Product saved but image upload failed', 'error')
        } finally {
          setUploadingImage(false)
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to save product', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(null)
    try {
      await api.deleteProduct(deleting.id)
      deleteProduct(deleting.id)
      showToast(`${deleting.name} deleted`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to delete product', 'error')
    }
  }

  const handleStockUpdate = async (productId, value) => {
    const stock = Math.max(0, Number(value) || 0)
    setStockUpdating(productId)
    try {
      await api.updateStock(productId, stock)
      saveProduct({ ...products.find((p) => p.id === productId), stock })
    } catch (err) {
      showToast(err.message || 'Failed to update stock', 'error')
    } finally {
      setStockUpdating(null)
    }
  }

  const handleToggleActive = async (product) => {
    const next = !product.is_active
    try {
      await api.updateProduct(product.id, { is_active: next })
      saveProduct({ ...product, is_active: next })
      showToast(`${next ? 'Activated' : 'Deactivated'} ${product.name}`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update availability', 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Products</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            {products.length} dishes on the menu · updates apply to the storefront instantly
          </p>
        </div>
        <Button onClick={openNew} disabled={saving}>
          <Plus size={16} aria-hidden="true" />
          Add product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex flex-1 items-center rounded-lg border border-border-strong bg-surface px-3 py-2 shadow-sm">
          <Search size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by name…"
            aria-label="Search products"
            className="ml-2 w-full bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          aria-label="Filter by category"
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          aria-label="Filter by stock"
          className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">All stock</option>
          <option value="in-stock">In stock</option>
          <option value="low-stock">Low stock</option>
          <option value="out-of-stock">Out of stock</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Adjust your search or add a new dish to the menu."
          action={<Button onClick={openNew}>Add product</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((product) => (
                  <tr key={product.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                          <img src={product.image_url || product.image || `/images/${product.slug}.jpg`} alt="" className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{product.name}</p>
                          <p className="truncate text-body-sm text-text-secondary">{product.short_description || ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary">{categoryNameById[product.category_id] || product.category_id}</td>
                    <td className="tnum px-4 py-3 font-semibold text-text-primary">{formatNaira(product.price)}</td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(e) => handleStockUpdate(product.id, e.target.value)}
                        aria-label={`Stock for ${product.name}`}
                        className="tnum w-16 rounded-lg border border-border-strong bg-surface px-2 py-1 text-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={stockUpdating === product.id}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StockBadge stock={product.stock} />
                      {product.is_active === false && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600">
                          Inactive
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={product.is_active ? `Deactivate ${product.name}` : `Activate ${product.name}`}
                        onClick={() => handleToggleActive(product)}
                        disabled={stockUpdating === product.id}
                        className="flex h-6 w-6 items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary disabled:opacity-50"
                      >
                        {product.is_active ? (
                          <Trash2 size={12} className="text-red-500" aria-hidden="true" />
                        ) : (
                          <Pencil size={12} className="text-emerald-500" aria-hidden="true" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${product.name}`}
                          onClick={() => openEdit(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${product.name}`}
                          onClick={() => setDeleting(product)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / edit modal */}
      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? 'Add product' : 'Edit product'}
        description={editing === 'new' ? 'Create a new dish for the storefront' : `Update ${editing?.name || ''}`}
        maxWidth="max-w-2xl"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>{editing === 'new' ? 'Add product' : 'Save changes'}</Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Dish name" htmlFor="p-name" error={errors.name} required className="sm:col-span-2">
            <input
              id="p-name"
              type="text"
              placeholder="Smokey Party Jollof"
              className={controlClass(errors.name)}
              value={form.name}
              onChange={setField('name')}
            />
          </Field>
          <Field label="Category" htmlFor="p-category" error={errors.category} required className="sm:col-span-2">
            <select
              id="p-category"
              className={controlClass(errors.category)}
              value={form.category_id}
              onChange={setField('category_id')}
            >
              <option value="">Select a category</option>
              {categoryOptions.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Short description" htmlFor="p-short">
            <input
              id="p-short"
              type="text"
              placeholder="Wood-fired rice & dodo"
              className={controlClass(false)}
              value={form.short_description}
              onChange={setField('short_description')}
            />
          </Field>
          <Field label="Price (₦)" htmlFor="p-price" error={errors.price} required>
            <input
              id="p-price"
              type="number"
              min={0}
              step={50}
              placeholder="3500"
              className={controlClass(errors.price)}
              value={form.price}
              onChange={setField('price')}
            />
          </Field>
          <Field label="Compare-at price (₦)" htmlFor="p-compare" hint="Optional — shows a strike-through price">
            <input
              id="p-compare"
              type="number"
              min={0}
              step={50}
              placeholder="7200"
              className={controlClass(false)}
              value={form.compare_at_price}
              onChange={setField('compare_at_price')}
            />
          </Field>
          <Field label="Stock quantity" htmlFor="p-stock" error={errors.stock} required>
            <input
              id="p-stock"
              type="number"
              min={0}
              placeholder="24"
              className={controlClass(errors.stock)}
              value={form.stock}
              onChange={setField('stock')}
            />
          </Field>
          <Field label="Product image" htmlFor="p-image" hint="JPEG, PNG, WebP or AVIF, max 5 MB" className="sm:col-span-2">
            <div className="flex flex-col gap-2">
              <input
                id="p-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={handleImageChange}
                className="block w-full text-body-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
              />
              {form.image_url && (
                <div className="mt-3 flex items-center gap-2">
                  <img src={form.image_url} alt="Current product image" className="h-20 w-20 object-cover rounded-lg" />
                  <button
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({ ...prev, image_url: '' }))
                      setImageFile(null)
                      setImagePreview(null)
                    }}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              )}
              {imagePreview && !form.image_url && (
                <div className="mt-3 flex items-center gap-2">
                  <img src={imagePreview} alt="Image preview" className="h-20 w-20 object-cover rounded-lg" />
                </div>
              )}
            </div>
          </Field>
          <Field label="Full description" htmlFor="p-description" className="sm:col-span-2">
            <textarea
              id="p-description"
              rows={3}
              placeholder="Describe the dish, ingredients and preparation…"
              className={controlClass(false)}
              value={form.description}
              onChange={setField('description')}
            />
          </Field>
          <div className="sm:col-span-2">
            <span className="text-label-md text-text-primary">Tags</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {DIET_TAGS.map((tag) => {
                const checked = form.tags.includes(tag.id)
                return (
                  <label
                    key={tag.id}
                    className={`flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-label-sm transition-colors ${
                      checked ? 'bg-primary text-white' : 'bg-surface-container-low text-text-secondary'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-primary"
                      checked={checked}
                      onChange={() => toggleTag(tag.id)}
                    />
                    {tag.name}
                  </label>
                )
              })}
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-border-strong accent-primary"
              checked={form.is_featured}
              onChange={setField('is_featured')}
            />
            <span className="text-label-md text-text-primary">Feature on homepage</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border border-border-strong accent-primary"
              checked={form.is_active}
              onChange={setField('is_active')}
            />
            <span className="text-label-md text-text-primary">Active on menu</span>
          </label>
          <button type="submit" className="hidden" aria-hidden="true" />
        </form>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete product"
        description="This removes the dish from the storefront menu."
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep product
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={stockUpdating !== null}>
              <Trash2 size={15} aria-hidden="true" />
              Delete
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
            {deleting && <img src={deleting.image_url || `/images/${deleting.slug}.jpg`} alt="" className="h-full w-full object-cover" />}
          </div>
          <div>
            <p className="font-medium text-text-primary">{deleting?.name}</p>
            <p className="tnum text-body-sm text-text-secondary">{deleting ? formatNaira(deleting.price) : ''}</p>
          </div>
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-body-sm text-text-tertiary">
          <Utensils size={13} aria-hidden="true" />
          Customers will no longer see this dish.
        </p>
      </Modal>
    </div>
  )
}