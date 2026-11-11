import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Package, RotateCcw, ShoppingBag } from 'lucide-react'
import { useOrders } from '../context/OrderContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatDate, formatNaira } from '../lib/currency.js'
import { PAYMENT_METHODS } from '../data/orders.js'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

const TABS = [
  { id: 'all', label: 'All orders' },
  { id: 'active', label: 'Active' },
  { id: 'delivered', label: 'Delivered' },
]

const ACTIVE_STATUSES = ['pending', 'paid', 'preparing', 'out-for-delivery']

export default function Orders() {
  const { orders, loading, error } = useOrders()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [tab, setTab] = useState('all')

  const filtered = useMemo(() => {
    const list = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (tab === 'active') return list.filter((o) => ACTIVE_STATUSES.includes(o.status))
    if (tab === 'delivered') return list.filter((o) => o.status === 'delivered')
    return list
  }, [orders, tab])

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading your orders…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Package}
          title="Unable to load orders"
          description={error}
          action={<Button to="/shop">Browse the menu</Button>}
        />
      </div>
    )
  }

  const reorder = (order) => {
    let added = 0
    order.items.forEach((item) => {
      addItem(item.productId, item.qty)
      added += 1
    })
    showToast(`${added} item${added === 1 ? '' : 's'} from ${order.id} added to cart`, 'success')
    navigate('/cart')
  }

  const paymentLabel = (id) => PAYMENT_METHODS.find((p) => p.id === id)?.label || id

  return (
    <div className="container-page py-6">
      <h1 className="mb-1 font-display text-headline-lg text-text-primary">My Orders</h1>
      <p className="mb-5 text-body-md text-text-secondary">Track deliveries and reorder your favorites.</p>

      <div className="mb-5 flex gap-2 overflow-x-auto no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-label-md transition-colors ${
              tab === t.id
                ? 'bg-primary font-semibold text-white shadow-sm'
                : 'bg-surface text-text-secondary border border-border-default hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No orders here yet"
          description="When you place an order it will appear here with live status updates."
          action={<Button to="/shop">Browse the menu</Button>}
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {filtered.map((order) => (
            <li key={order.id} className="rounded-2xl border border-border-subtle bg-surface p-4 shadow-card sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="tnum font-display text-headline-sm text-text-primary">{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <span className="tnum text-body-sm text-text-secondary">{formatDate(order.createdAt)}</span>
              </div>

              <ul className="flex flex-col gap-2.5 py-3">
                {order.items.map((item) => (
                  <li key={`${order.id}-${item.productId}`} className="flex items-center gap-3">
                    {item.image ? (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                        <img src={item.image} alt="" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low flex items-center justify-center">
                        <Package size={16} className="text-text-tertiary" aria-hidden="true" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-body-md text-text-primary">{item.name}</p>
                      <p className="tnum text-body-sm text-text-secondary">
                        {formatNaira(item.price)} × {item.qty}
                      </p>
                    </div>
                    <span className="tnum text-label-md font-semibold text-text-primary">
                      {formatNaira(item.price * item.qty)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle pt-3">
                <div className="flex flex-col">
                  <span className="text-body-sm text-text-tertiary">
                    {order.items.length} item{order.items.length === 1 ? '' : 's'} · {paymentLabel(order.paymentMethod)}
                  </span>
                  <span className="tnum font-display text-price-md font-bold text-text-primary">
                    {formatNaira(order.total)}
                  </span>
                </div>
                <div className="flex gap-2">
                  {ACTIVE_STATUSES.includes(order.status) && (
                    <span className="flex items-center gap-1.5 rounded-lg bg-sky-50 dark:bg-sky-900/20 px-3 py-1.5 text-label-sm font-medium text-sky-700 dark:text-sky-400">
                      <Package size={14} aria-hidden="true" />
                      On the way
                    </span>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => reorder(order)}>
                    <RotateCcw size={14} aria-hidden="true" />
                    Reorder
                  </Button>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-body-sm text-text-tertiary">
                <ShoppingBag size={13} aria-hidden="true" />
                Delivering to {order.delivery.address}, {order.delivery.city}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
