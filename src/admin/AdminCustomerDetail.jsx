import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Edit,
  Mail,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { formatNaira, formatDate, formatDateTime } from '../lib/currency.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { Badge } from '../components/ui/Badges.jsx'
import { Modal } from '../components/ui/Modal.jsx'

const SEGMENT_LABELS = {
  VIP: 'VIP Customer',
  Loyal: 'Loyal Customer',
  Returning: 'Returning Customer',
  Inactive: 'Inactive Customer',
  New: 'New Customer',
}

const SEGMENT_TONES = {
  VIP: 'bg-amber-50 text-amber-700 border-amber-200',
  Loyal: 'bg-sky-50 text-sky-700 border-sky-200',
  Returning: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-surface-container-highest text-text-secondary border-border-subtle',
  New: 'bg-orange-50 text-orange-700 border-orange-200',
}

const STATUS_LABELS = {
  pending: 'Pending payment',
  paid: 'Paid',
  preparing: 'Preparing',
  'out-for-delivery': 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function AdminCustomerDetail() {
  const { showToast } = useToast()
  const { id } = useParams()
  const customerId = id

  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [orderMeta, setOrderMeta] = useState({ total: 0, page: 1, per_page: 20, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Notes state
  const [notes, setNotes] = useState([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState(null)
  const [editingNoteId, setEditingNoteId] = useState(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [editingNoteContent, setEditingNoteContent] = useState('')

  // Account status state
  const [suspending, setSuspending] = useState(false)
  const [reactivating, setReactivating] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false)
  const [showReactivateConfirm, setShowReactivateConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const [cRes, oRes] = await Promise.all([
          api.getCustomer(customerId),
          api.getCustomerOrders(customerId, { page: 1, limit: 20 }),
        ])
        if (mounted) {
          setCustomer(cRes.customer)
          setOrders(oRes.orders || [])
          setOrderMeta(oRes.meta || { total: 0, page: 1, per_page: 20, total_pages: 0 })
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load customer details')
          setLoading(false)
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [customerId, showToast])

  useEffect(() => {
    let mounted = true
    async function loadNotes() {
      try {
        setNotesLoading(true)
        const data = await api.getCustomerNotes(customerId)
        if (mounted) {
          setNotes(data.notes || [])
          setNotesLoading(false)
          setNotesError(null)
        }
      } catch (err) {
        if (mounted) {
          setNotesError(err.message || 'Failed to load notes')
          setNotesLoading(false)
        }
      }
    }
    if (customerId) {
      loadNotes()
    }
    return () => {
      mounted = false
    }
  }, [customerId, showToast])

  const totalCompletedRevenue = useMemo(() => {
    return customer?.completedRevenue || 0
  }, [customer])

  const averageOrderValue = useMemo(() => {
    if (!customer || customer.completedOrderCount === 0) return 0
    return Math.round(customer.completedRevenue / customer.completedOrderCount)
  }, [customer])

  const segmentColor = (segment) => SEGMENT_TONES[segment] || SEGMENT_TONES.New

  const statusLabel = (status) => STATUS_LABELS[status] || status

  const badgeClass = (status) =>
    status === 'cancelled'
      ? 'bg-red-50 text-red-700 border-red-200/60'
      : 'bg-surface-container-highest text-text-secondary border-border-subtle'

  // ---- Notes handlers ----
  const handleCreateNote = async () => {
    const content = newNoteContent.trim()
    if (!content) return
    try {
      await api.createCustomerNote(customerId, content)
      setNewNoteContent('')
      const data = await api.getCustomerNotes(customerId)
      setNotes(data.notes || [])
      setNotesError(null)
    } catch (err) {
      setNotesError(err.message || 'Failed to create note')
      showToast(err.message || 'Failed to create note', 'error')
    }
  }

  const handleUpdateNote = async (noteId) => {
    const content = editingNoteContent.trim()
    if (!content) return
    try {
      await api.updateCustomerNote(customerId, noteId, content)
      setEditingNoteId(null)
      setEditingNoteContent('')
      const data = await api.getCustomerNotes(customerId)
      setNotes(data.notes || [])
      setNotesError(null)
    } catch (err) {
      setNotesError(err.message || 'Failed to update note')
      showToast(err.message || 'Failed to update note', 'error')
    }
  }

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteCustomerNote(customerId, noteId)
      setNotes((prev) => prev.filter((n) => n.id !== noteId))
      setNotesError(null)
      showToast('Note deleted', 'success')
    } catch (err) {
      setNotesError(err.message || 'Failed to delete note')
      showToast(err.message || 'Failed to delete note', 'error')
    }
  }

  // ---- Account status handlers ----
  const handleSuspend = async () => {
    try {
      setSuspending(true)
      await api.suspendCustomerAccount(customerId)
      setShowSuspendConfirm(false)
      if (customer) {
        setCustomer({ ...customer, accountStatus: 'suspended' })
      }
      showToast('Customer account suspended', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to suspend account', 'error')
    } finally {
      setSuspending(false)
    }
  }

  const handleReactivate = async () => {
    try {
      setReactivating(true)
      await api.reactivateCustomerAccount(customerId)
      setShowReactivateConfirm(false)
      if (customer) {
        setCustomer({ ...customer, accountStatus: 'active' })
      }
      showToast('Customer account reactivated', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to reactivate account', 'error')
    } finally {
      setReactivating(false)
    }
  }

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true)
      await api.deleteCustomerAccount(customerId)
      setShowDeleteConfirm(false)
      showToast('Customer account deleted', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to delete account', 'error')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <Users size={28} className="mb-3 text-text-tertiary" aria-hidden="true" />
        <p className="text-body-md text-text-secondary">Loading customer details…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Users}
          title="Unable to load customer"
          description={error}
          action={<Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>}
        />
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Users}
          title="Customer not found"
          description="The requested customer does not exist."
          action={<Button variant="secondary" onClick={() => window.history.back()}>Go back</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => window.history.back()}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Back to customers
          </Button>
          <h1 className="font-display text-headline-lg text-text-primary mt-2">
            {customer.name || 'Unknown customer'}
          </h1>
          <p className="text-body-sm text-text-secondary">
            {customer.email || 'No email on file'}
          </p>
        </div>
        <Badge className={segmentColor(customer.segment)}>
          {SEGMENT_LABELS[customer.segment]}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {customer.orderCount}
              </span>
              <p className="text-body-sm text-text-secondary">Total orders</p>
            </div>
            <CreditCard size={17} className="text-primary" aria-hidden="true" />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {formatNaira(totalCompletedRevenue)}
              </span>
              <p className="text-body-sm text-text-secondary">Lifetime spending</p>
            </div>
            <TrendingUp size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {formatNaira(averageOrderValue)}
              </span>
              <p className="text-body-sm text-text-secondary">Avg. order value</p>
            </div>
            <CreditCard size={17} className="text-sky-600" aria-hidden="true" />
          </div>
        </div>

        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {customer.completedOrderCount}
              </span>
              <p className="text-body-sm text-text-secondary">Completed orders</p>
            </div>
            <Clock size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Customer info */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Users size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-display text-headline-sm text-text-primary">Customer information</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3">
            <Mail size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="text-label-sm text-text-tertiary">Email</p>
              <p className="text-body-md text-text-primary">{customer.email || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="text-label-sm text-text-tertiary">Phone</p>
              <p className="text-body-md text-text-primary">{customer.phone || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="text-label-sm text-text-tertiary">Member since</p>
              <p className="text-body-md text-text-primary">{formatDate(customer.createdAt || customer.firstOrderAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="text-label-sm text-text-tertiary">First order</p>
              <p className="text-body-md text-text-primary">{customer.firstOrderAt ? formatDate(customer.firstOrderAt) : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <div>
              <p className="text-label-sm text-text-tertiary">Latest order</p>
              <p className="text-body-md text-text-primary">{customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={segmentColor(customer.segment)} />
            <div>
              <p className="text-label-sm text-text-tertiary">Segment</p>
              <p className="text-body-md text-text-primary">{SEGMENT_LABELS[customer.segment]}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Order history */}
      <div className="rounded-2xl border border-border-subtle bg-surface shadow-card overflow-hidden">
        <div className="border-b border-border-subtle bg-surface-container-low px-4 py-3 flex items-center justify-between">
          <h2 className="font-display text-headline-sm text-text-primary">Order history</h2>
        </div>

        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={CreditCard}
              title="No orders yet"
              description="This customer has not placed any orders."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Order number</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium text-right">Total</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low group">
                    <td className="px-4 py-3 tnum font-medium text-text-primary">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 tnum text-text-secondary">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-primary">
                      {formatNaira(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={badgeClass(order.status)}>
                        {statusLabel(order.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" size="sm" className="hidden sm:inline-flex">
                        View details
                        <ArrowLeft size={13} className="ml-1" aria-hidden="true" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {orderMeta.total_pages > 1 && (
          <div className="border-t border-border-subtle bg-surface-container-low px-4 py-3 flex items-center justify-between sm:flex-nowrap">
            <div className="text-body-sm text-text-secondary">
              Showing orders {orderMeta.total > 0 ? (orderMeta.page - 1) * orderMeta.per_page + 1 : 0}
              to {Math.min(orderMeta.page * orderMeta.per_page, orderMeta.total)} of {orderMeta.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {}}
                disabled={orderMeta.page === 1}
              >
                Previous
              </Button>
              <span className="text-body-sm text-text-secondary">
                Page {orderMeta.page} of {orderMeta.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {}}
                disabled={orderMeta.page >= orderMeta.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Account status */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <ShieldAlert size={17} className="text-primary" aria-hidden="true" />
          <h2 className="font-display text-headline-sm text-text-primary">Account status</h2>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Badge
              className={
                customer.accountStatus === 'suspended'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }
            >
              {customer.accountStatus === 'suspended' ? 'Suspended' : 'Active'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {customer.accountStatus === 'active' ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowSuspendConfirm(true)}
                disabled={suspending}
              >
                {suspending ? 'Suspending…' : 'Suspend account'}
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowReactivateConfirm(true)}
                disabled={reactivating}
              >
                {reactivating ? 'Reactivating…' : 'Reactivate account'}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={deleting}
            >
              {deleting ? 'Deleting…' : 'Delete account'}
            </Button>
          </div>
        </div>
        {customer.accountStatus === 'suspended' && (
          <p className="mt-3 text-body-sm text-text-tertiary">
            This customer cannot place new orders while suspended.
          </p>
        )}
      </section>

      {/* Internal notes */}
      <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <Users size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-sm text-text-primary">Internal notes</h2>
          </div>
          <p className="text-body-sm text-text-tertiary">
            Admin-only — never visible to customers
          </p>
        </div>

        {/* Add note form */}
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="relative flex flex-1 items-center rounded-lg border border-border-strong bg-surface px-3 py-2 shadow-sm">
            <textarea
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              placeholder="Add an internal note about this customer…"
              rows={2}
              className="ml-2 w-full bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none resize-none"
            />
          </div>
          <Button onClick={handleCreateNote} disabled={!newNoteContent.trim()}>
            <Plus size={14} className="mr-1" aria-hidden="true" />
            Add note
          </Button>
        </div>

        {notesError && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-body-sm">
            {notesError}
          </div>
        )}

        {notes.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={Users}
              title="No notes yet"
              description="Add an internal note to track important customer information."
            />
          </div>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-border-subtle bg-surface p-4 shadow-sm"
              >
                {editingNoteId === note.id ? (
                  <div className="flex flex-col gap-3">
                    <textarea
                      value={editingNoteContent}
                      onChange={(e) => setEditingNoteContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setEditingNoteId(null)
                          setEditingNoteContent('')
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={() => handleUpdateNote(note.id)} disabled={!editingNoteContent.trim()}>
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-body-sm text-text-primary break-words">{note.content}</p>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingNoteId(note.id)
                            setEditingNoteContent(note.content)
                          }}
                        >
                          <Edit size={13} aria-hidden="true" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 size={13} aria-hidden="true" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-body-xs text-text-tertiary">
                      <span>{note.authorName}</span>
                      <span>·</span>
                      <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Confirmation modals */}
      <Modal
        open={showSuspendConfirm}
        onClose={() => setShowSuspendConfirm(false)}
        title="Suspend customer account"
        description="This customer will not be able to place new orders while suspended. This action cannot be undone by the customer."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowSuspendConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={suspending}>
              Suspend account
            </Button>
          </div>
        }
      />

      <Modal
        open={showReactivateConfirm}
        onClose={() => setShowReactivateConfirm(false)}
        title="Reactivate customer account"
        description="This customer will be able to place new orders again."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowReactivateConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={handleReactivate} disabled={reactivating}>
              Reactivate account
            </Button>
          </div>
        }
      />

      <Modal
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete customer account"
        description="This permanently removes the customer profile. This action cannot be undone. Order history remains but will no longer be linked to a customer profile."
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              Delete account
            </Button>
          </div>
        }
      />
    </div>
  )
}
