import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, DollarSign, Package, ReceiptText, TrendingUp, Utensils } from 'lucide-react'
import { useProducts } from '../context/ProductContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { formatDate, formatNaira } from '../lib/currency.js'
import { ORDER_STATUSES } from '../data/orders.js'
import { StatusBadge } from '../components/ui/Badges.jsx'

export default function AdminOverview() {
  const { products } = useProducts()
  const { orders } = useOrders()

  const stats = useMemo(() => {
    const valid = orders.filter((o) => o.status !== 'cancelled')
    const revenue = valid.reduce((sum, o) => sum + o.total, 0)
    return {
      revenue,
      orderCount: orders.length,
      activeOrders: valid.filter((o) => o.status !== 'delivered').length,
      avgOrder: valid.length ? revenue / valid.length : 0,
      productCount: products.length,
      inStock: products.filter((p) => p.stock > 0).length,
    }
  }, [orders, products])

  const dailyRevenue = useMemo(() => {
    const days = []
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 6; i >= 0; i--) {
      const day = new Date(today)
      day.setDate(today.getDate() - i)
      days.push({ day, label: day.toLocaleDateString('en-NG', { weekday: 'short' }), total: 0 })
    }
    orders
      .filter((o) => o.status !== 'cancelled')
      .forEach((order) => {
        const created = new Date(order.createdAt)
        const match = days.find((d) => d.day.toDateString() === created.toDateString())
        if (match) match.total += order.total
      })
    const max = Math.max(...days.map((d) => d.total), 1)
    return days.map((d) => ({ ...d, height: `${Math.max((d.total / max) * 100, 4)}%` }))
  }, [orders])

  const lowStock = useMemo(
    () =>
      products
        .filter((p) => p.stock <= 5)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 6),
    [products],
  )

  const statusBreakdown = useMemo(() => {
    return Object.entries(ORDER_STATUSES).map(([id, meta]) => ({
      id,
      label: meta.label,
      count: orders.filter((o) => o.status === id).length,
    }))
  }, [orders])

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [orders],
  )

  const cards = [
    { icon: DollarSign, label: 'Revenue (valid orders)', value: formatNaira(stats.revenue), tone: 'emerald' },
    { icon: ReceiptText, label: 'Total orders', value: stats.orderCount, tone: 'primary' },
    { icon: TrendingUp, label: 'Average order value', value: formatNaira(stats.avgOrder), tone: 'sky' },
    { icon: Package, label: 'Products in stock', value: `${stats.inStock}/${stats.productCount}`, tone: 'amber' },
  ]

  const toneClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    primary: 'bg-orange-50 text-primary',
    sky: 'bg-sky-50 text-sky-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-headline-lg text-text-primary">Overview</h1>
        <p className="mt-1 text-body-md text-text-secondary">Kitchen performance at a glance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-white p-4 shadow-card">
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${toneClasses[card.tone]}`}>
              <card.icon size={17} aria-hidden="true" />
            </span>
            <p className="tnum mt-3 font-display text-price-lg font-bold text-text-primary">{card.value}</p>
            <p className="text-body-sm text-text-secondary">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Weekly revenue */}
        <section className="rounded-2xl bg-white p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-headline-sm text-text-primary">Revenue — last 7 days</h2>
            <span className="text-body-sm text-text-tertiary">Excludes cancelled orders</span>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2">
            {dailyRevenue.map((day) => (
              <div key={day.label} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="tnum text-[10px] font-semibold text-text-secondary">
                  {day.total ? formatNaira(day.total) : '—'}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{ height: day.height }}
                  title={`${day.label}: ${formatNaira(day.total)}`}
                />
                <span className="text-body-sm text-text-tertiary">{day.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status breakdown */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-display text-headline-sm text-text-primary">Orders by status</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {statusBreakdown.map((status) => (
              <li key={status.id} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-body-md text-text-secondary">
                  <span className={`h-2 w-2 rounded-full ${ORDER_STATUSES[status.id].dot}`} />
                  {status.label}
                </span>
                <span className="tnum text-label-md font-semibold text-text-primary">{status.count}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 border-t border-border-subtle pt-3">
            <p className="text-body-sm text-text-secondary">
              <span className="font-semibold text-text-primary">{stats.activeOrders}</span> active order
              {stats.activeOrders === 1 ? '' : 's'} in progress
            </p>
          </div>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Recent orders */}
        <section className="rounded-2xl bg-white p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-headline-sm text-text-primary">Recent orders</h2>
            <Link to="/admin/orders" className="text-label-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="pb-2 pr-3 font-medium">Order</th>
                  <th className="pb-2 pr-3 font-medium">Date</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle last:border-0">
                    <td className="tnum py-2.5 pr-3 font-medium text-text-primary">{order.id}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{formatDate(order.createdAt)}</td>
                    <td className="py-2.5 pr-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="tnum py-2.5 text-right font-semibold text-text-primary">
                      {formatNaira(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low stock alerts */}
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-headline-sm text-text-primary">
            <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
            Low stock alerts
          </h2>
          {lowStock.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-body-md text-text-secondary">
              <Utensils size={15} className="text-emerald-600" aria-hidden="true" />
              All dishes are well stocked.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {lowStock.map((product) => (
                <li key={product.id} className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-text-primary">{product.name}</span>
                    <span className={`tnum text-body-sm ${product.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                    </span>
                  </span>
                  <Link
                    to="/admin/products"
                    className="rounded-lg bg-surface-container-low px-2.5 py-1 text-label-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Restock
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
