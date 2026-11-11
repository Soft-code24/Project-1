import { useMemo, useState, useEffect } from 'react'
import { LayoutList, Plus, Pencil, Trash2, Shield, AlertCircle } from 'lucide-react'
import { api } from '../lib/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { Badge } from '../components/ui/Badges.jsx'

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image_url: '',
  sort_order: '0',
  is_active: true,
}

export default function AdminCategories() {
  const { showToast } = useToast()
  const [categories, setCategories] = useState([])
  const [productsByCategory, setProductsByCategory] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(null) // category or 'new'
  const [form, setForm] = useState(emptyForm)
  const [errors, setErrors] = useState({})
  const [deleting, setDeleting] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.listCategories(),
          api.listProducts({ limit: 50 }),
        ])
        if (mounted) {
          setCategories(catRes.categories || [])
          const counts = {}
          ;(prodRes.products || []).forEach((p) => {
            counts[p.category_id] = (counts[p.category_id] || 0) + 1
          })
          setProductsByCategory(counts)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load categories')
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const productCount = (id) => productsByCategory[id] || 0

  const openNew = () => {
    setForm(emptyForm)
    setErrors({})
    setEditing('new')
  }

  const openEdit = (category) => {
    setForm({
      name: category.name || '',
      slug: category.slug || '',
      description: category.description || '',
      image_url: category.image_url || '',
      sort_order: String(category.sort_order ?? ''),
      is_active: Boolean(category.is_active),
    })
    setErrors({})
    setEditing(category)
  }

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const validateForm = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter a category name.'
    if (!form.slug.trim()) next.slug = 'Enter a category slug.'
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug.trim()))
      next.slug = 'Use lowercase letters, numbers, and hyphens only.'
    if (!Number.isFinite(Number(form.sort_order)) || Number(form.sort_order) < 0)
      next.sort_order = 'Enter a valid sort order (0 or more).'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildPayload = () => ({
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim(),
    ...(form.image_url ? { image_url: form.image_url.trim() } : {}),
    sort_order: Number(form.sort_order) || 0,
    is_active: form.is_active,
  })

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      const payload = buildPayload()
      if (editing === 'new') {
        await api.createCategory(payload)
        showToast('Category created', 'success')
      } else {
        await api.updateCategory(editing.id, payload)
        showToast('Category updated', 'success')
      }
      setEditing(null)
      await loadCategories()
    } catch (err) {
      showToast(err.message || 'Failed to save category', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function loadCategories() {
    setLoading(true)
    try {
      const [catRes, prodRes] = await Promise.all([
        api.listCategories(),
        api.listProducts({ limit: 50 }),
      ])
      setCategories(catRes.categories || [])
      const counts = {}
      ;(prodRes.products || []).forEach((p) => {
        counts[p.category_id] = (counts[p.category_id] || 0) + 1
      })
      setProductsByCategory(counts)
    } catch (err) {
      setError(err.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(null)
    try {
      const body = {}
      if (deleting.productCount > 0 && deleting.reassignTo) {
        body.reassign_to = deleting.reassignTo
      }
      await api.deleteCategory(deleting.id, body)
      showToast('Category deleted', 'success')
      await loadCategories()
    } catch (err) {
      showToast(err.message || 'Failed to delete category', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const otherCategories = categories.filter((c) => c.id !== (deleting?.id || ''))

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <Shield size={28} className="mb-3 text-text-tertiary" aria-hidden="true" />
        <p className="text-body-md text-text-secondary">Loading categories…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <EmptyState
          icon={AlertCircle}
          title="Unable to load categories"
          description={error}
          action={<Button onClick={loadCategories}>Try again</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Categories</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            {categories.length} menu categories · changes apply to the storefront
          </p>
        </div>
        <Button onClick={openNew} disabled={saving}>
          <Plus size={16} aria-hidden="true" />
          Add category
        </Button>
      </div>

      {categories.length === 0 ? (
        <EmptyState
          icon={Shield}
          title="No categories found"
          description="Add your first menu category to group dishes."
          action={<Button onClick={openNew}>Add category</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium text-right">Sort order</th>
                  <th className="px-4 py-3 font-medium text-right">Products</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low">
                    <td className="px-4 py-3">
                      <p className="font-medium text-text-primary">{category.name}</p>
                    </td>
                    <td className="px-4 py-3 tnum text-body-sm text-text-secondary">{category.slug}</td>
                    <td className="px-4 py-3 text-text-secondary truncate max-w-xs">
                      {category.description || '—'}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-primary">
                      {category.sort_order ?? 0}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-secondary">
                      {productCount(category.id)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          category.is_active
                            ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                            : 'bg-surface-container-highest text-text-secondary'
                        }
                      >
                        {category.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => openEdit(category)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
                        >
                          <Pencil size={15} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => {
                            setDeleting({ ...category, productCount: productCount(category.id) })
                          }}
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
        title={editing === 'new' ? 'Add category' : 'Edit category'}
        description={editing === 'new' ? 'Create a new menu category to group dishes.' : `Update ${editing?.name || ''}`}
        maxWidth="max-w-md"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {editing === 'new' ? 'Add category' : 'Save changes'}
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Category name" htmlFor="c-name" error={errors.name} required className="sm:col-span-2">
            <input
              id="c-name"
              type="text"
              placeholder="Gourmet Bowls"
              className={controlClass(errors.name)}
              value={form.name}
              onChange={setField('name')}
            />
          </Field>
          <Field label="Slug" htmlFor="c-slug" error={errors.slug} required className="sm:col-span-2">
            <input
              id="c-slug"
              type="text"
              placeholder="gourmet-bowls"
              className={controlClass(errors.slug)}
              value={form.slug}
              onChange={setField('slug')}
            />
            <p className="text-body-sm text-text-tertiary">URL-friendly identifier, lowercase with hyphens.</p>
          </Field>
          <Field label="Description" htmlFor="c-desc" className="sm:col-span-2">
            <textarea
              id="c-desc"
              rows={2}
              placeholder="Description of this menu category…"
              className={controlClass(false)}
              value={form.description}
              onChange={setField('description')}
            />
          </Field>
          <Field label="Image URL" htmlFor="c-image" className="sm:col-span-2">
            <input
              id="c-image"
              type="text"
              placeholder="https://example.com/image.jpg"
              className={controlClass(false)}
              value={form.image_url}
              onChange={setField('image_url')}
            />
          </Field>
          <Field label="Sort order" htmlFor="c-sort" error={errors.sort_order}>
            <input
              id="c-sort"
              type="number"
              min={0}
              placeholder="0"
              className={controlClass(errors.sort_order)}
              value={form.sort_order}
              onChange={setField('sort_order')}
            />
            <p className="text-body-sm text-text-tertiary">Display order on the menu (lower = first).</p>
          </Field>
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
        title="Delete category"
        description="Removing a category will affect the dishes assigned to it."
        maxWidth="max-w-sm"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep category
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              <Trash2 size={15} aria-hidden="true" />
              Delete category
            </Button>
          </div>
        }
      >
        <div className="flex items-center gap-3.5">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low flex items-center justify-center">
            <Shield size={20} className="text-text-tertiary" aria-hidden="true" />
          </div>
          <div>
            <p className="font-medium text-text-primary">{deleting?.name}</p>
            <p className="tnum text-body-sm text-text-secondary">
              {deleting?.slug} · {productCount(deleting?.id)} product(s)
            </p>
          </div>
        </div>
        {deleting && deleting.productCount > 0 && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <p className="text-body-sm text-text-secondary mb-2">
              Reassign the {deleting.productCount} product(s) to another category before deleting:
            </p>
            <select
              value={deleting.reassignTo || ''}
              onChange={(e) =>
                setDeleting((prev) => ({ ...prev, reassignTo: e.target.value }))
              }
              className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a category…</option>
              {otherCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            {deleting.productCount > 0 && !deleting.reassignTo && (
              <p className="mt-1 text-body-sm text-red-600">
                Select a target category to reassign products before deleting.
              </p>
            )}
          </div>
        )}
        {!deleting || deleting.productCount === 0 ? (
          <p className="mt-3 flex items-center gap-1.5 text-body-sm text-text-tertiary">
            <Trash2 size={13} aria-hidden="true" />
            This category has no products and can be removed safely.
          </p>
        ) : null}
      </Modal>
    </div>
  )
}
