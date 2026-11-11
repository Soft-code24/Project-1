import { useMemo, useState, useEffect } from 'react'
import { Eye, Package, ReceiptText } from 'lucide-react'
import { api } from '../lib/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { formatDate, formatDateTime, formatNaira } from '../lib/currency.js'
import { ORDER_STATUSES, PAYMENT_METHODS, STATUS_ORDER } from '../data/orders.js'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

const TABS = [{ id: 'all', label: 'All' }, ...STATUS_ORDER.map((id) => ({ id, label: ORDER_STATUSES[id].label }))]

export default function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { showToast } = useToast()
  const [tab, setTab] = useState('all')
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null)
  const [cancelling, setCancelling] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await api.getAdminOrders()
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
    load()
    return () => {
      mounted = false
    }
  }, [])

  function mapBackendOrder(order) {
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.user_id,
      customerName: order.customer?.full_name || '',
      customerEmail: order.customer?.email || '',
      createdAt: order.created_at,
      status: order.status,
      paymentMethod: order.payment_method,
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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...orders]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .filter((order) => {
        if (tab !== 'all' && order.status !== tab) return false
        if (q && !`${order.orderNumber} ${order.customerName} ${order.customerEmail}`.toLowerCase().includes(q)) return false
        return true
      })
  }, [orders, tab, query])

  const paymentLabel = (id) => PAYMENT_METHODS.find((p) => p.id === id)?.label || id

  const handleStatusChange = async (orderId, newStatus) => {
    if (newStatus === 'cancelled') {
      const confirmed = window.confirm(
        'Cancelling this order will restore stock for all items. Are you sure?'
      )
      if (!confirmed) return
      setCancelling(orderId)
    }
    try {
      await api.updateAdminOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      )
      setViewing((v) => (v?.id === orderId ? { ...v, status: newStatus } : v))
      showToast(`Order ${orderId} marked as ${ORDER_STATUSES[newStatus].label.toLowerCase()}`, 'success')
    } catch (err) {
      showToast(err.message || 'Failed to update order status', 'error')
    } finally {
      setCancelling(null)
    }
  }

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading orders…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={ReceiptText}
          title="Unable to load orders"
          description={error}
          action={<Button to="/admin">Try again</Button>}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-headline-lg text-text-primary">Orders</h1>
        <p className="mt-1 text-body-md text-text-secondary">
          Review customer orders and update fulfillment statuses.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-1 items-center rounded-lg border border-border-strong bg-surface px-3 py-2 shadow-sm sm:max-w-sm">
          <ReceiptText size={16} className="shrink-0 text-text-tertiary" aria-hidden="true" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order ID, name or email…"
            aria-label="Search orders"
            className="ml-2 w-full bg-transparent text-body-md text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3.5 py-1.5 text-label-sm transition-colors ${
                tab === t.id
                  ? 'bg-primary font-semibold text-white shadow-sm'
                  : 'bg-surface text-text-secondary border border-border-default hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No orders found"
          description="Orders will appear here as customers check out."
        />
      ) : (
        <div className="overflow-hidden rounded-2xl bg-surface shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low">
                    <td className="tnum px-4 py-3 font-medium text-text-primary">{order.orderNumber}</td>
                    <td className="px-4 py-3">
                      <p className="text-text-primary">{order.customerName}</p>
                      <p className="text-body-sm text-text-secondary">{order.customerEmail}</p>
                    </td>
                    <td className="tnum px-4 py-3 text-text-secondary">{formatDate(order.createdAt)}</td>
                    <td className="tnum px-4 py-3 text-text-secondary">
                      {order.items.reduce((sum, i) => sum + i.qty, 0)}
                    </td>
                    <td className="tnum px-4 py-3 font-semibold text-text-primary">{formatNaira(order.total)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        aria-label={`Status for order ${order.orderNumber}`}
                        className="rounded-lg border border-border-strong bg-surface px-2 py-1 text-body-sm text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        disabled={cancelling === order.id}
                      >
                        {STATUS_ORDER.map((status) => (
                          <option key={status} value={status}>
                            {ORDER_STATUSES[status].label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          aria-label={`View order ${order.orderNumber}`}
                          onClick={() => setViewing(order)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
                        >
                          <Eye size={15} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>)}

      <Modal
        open={viewing !== null}
        onClose={() => setViewing(null)}
        title={`Order ${viewing?.orderNumber || ''}`}
        description={viewing ? formatDateTime(viewing.createdAt) : ''}
        maxWidth="max-w-xl"
        footer={
          <div className="flex justify-between gap-3">
            <StatusBadge status={viewing?.status || 'pending'} />
            <Button variant="secondary" onClick={() => setViewing(null)}>
              Close
            </Button>
          </div>
        }
      >
        {viewing && (
          <div className="flex flex-col gap-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-page-bg p-4">
                <h3 className="text-label-md font-semibold text-text-primary">Customer</h3>
                <p className="mt-1.5 text-body-md text-text-secondary">{viewing.customerName}</p>
                <p className="text-body-md text-text-secondary">{viewing.customerEmail}</p>
                <p className="text-body-md text-text-secondary">{viewing.contact.phone}</p>
                <p className="text-body-md text-text-secondary">{viewing.contact.email}</p>
              </div>
              <div className="rounded-xl bg-page-bg p-4">
                <h3 className="text-label-md font-semibold text-text-primary">Delivery</h3>
                <p className="mt-1.5 text-body-md text-text-secondary">
                  {viewing.delivery.address}, {viewing.delivery.city}
                </p>
                {viewing.delivery.instructions && (
                  <p className="text-body-sm text-text-tertiary">Note: {viewing.delivery.instructions}</p>
                )}
                <p className="mt-1.5 text-body-sm text-text-secondary">
                  Payment: <span className="font-medium text-text-primary">{paymentLabel(viewing.paymentMethod)}</span>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-label-md font-semibold text-text-primary">Items</h3>
              <ul className="mt-2 flex flex-col gap-2.5">
                {viewing.items.map((item) => (
                  <li key={item.productId} className="flex items-center gap-3">
                    {item.image ? (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container-low flex items-center justify-center">
                        <Package size={14} className="text-text-tertiary" aria-hidden="true" />
                      </div>
                    )}
                    <span className="min-w-0 flex-1 truncate text-body-md text-text-primary">{item.name}</span>
                    <span className="tnum text-body-sm text-text-secondary">× {item.qty}</span>
                    <span className="tnum text-label-md font-semibold text-text-primary">
                      {formatNaira(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <dl className="flex flex-col gap-2 border-t border-border-subtle pt-3 text-body-md">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Subtotal</dt>
                <dd className="tnum text-text-primary">{formatNaira(viewing.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Delivery</dt>
                <dd className="tnum text-text-primary">{formatNaira(viewing.deliveryFee)}</dd>
              </div>
              {viewing.discount > 0 && (
                <div className="flex justify-between">
                  <dt className="text-emerald-700">Discount</dt>
                  <dd className="tnum text-emerald-700">−{formatNaira(viewing.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-border-default pt-2.5">
                <dt className="font-semibold text-text-primary">Total</dt>
                <dd className="tnum font-display text-price-md font-bold text-text-primary">
                  {formatNaira(viewing.total)}
              </dd>
            </div>
          </dl>

            <div>
              <h3 className="mb-2 text-label-md font-semibold text-text-primary">Update status</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_ORDER.map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleStatusChange(viewing.id, status)}
                    className={`rounded-full px-3.5 py-1.5 text-label-sm transition-colors ${
                      viewing.status === status
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {ORDER_STATUSES[status].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
