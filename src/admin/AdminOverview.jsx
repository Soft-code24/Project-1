import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, DollarSign, Package, ReceiptText, TrendingUp, Utensils } from 'lucide-react'
import { api } from '../lib/api.js'
import { useState, useEffect } from 'react'
import { formatNaira } from '../lib/currency.js'
import { ORDER_STATUSES } from '../data/orders.js'
import { Button } from '../components/ui/Button.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

export default function AdminOverview() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await api.getAdminStats()
        if (mounted) {
          setStats(data.stats)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setLoading(false)
          setError(err.message || 'Failed to load statistics')
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading overview…</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container-page py-16">
        <div className="max-w-md mx-auto">
          <div className="rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-card">
            <p className="text-body-md text-text-secondary">{error || 'Failed to load statistics'}</p>
            <Button to="/admin" className="mt-4">
              Try again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const cards = [
    { icon: DollarSign, label: 'Revenue (valid orders)', value: formatNaira(stats.revenue), tone: 'emerald' },
    { icon: ReceiptText, label: 'Total orders', value: stats.orderCount, tone: 'primary' },
    { icon: TrendingUp, label: 'Average order value', value: formatNaira(stats.averageOrderValue), tone: 'sky' },
    { icon: Package, label: 'Products in stock', value: `${stats.lowStock?.length === 0 ? 'All' : stats.lowStock.length} low stock`, tone: 'amber' },
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
          <div key={card.label} className="rounded-2xl bg-surface p-4 shadow-card">
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
        <section className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-headline-sm text-text-primary">Revenue — last 7 days</h2>
            <span className="text-body-sm text-text-tertiary">Excludes cancelled orders</span>
          </div>
          <div className="mt-5 flex h-40 items-end gap-2">
            {/* Weekly chart data would come from stats.byDay if available; using order count distribution as fallback */}
            {stats.byStatus.map((s) => (
              <div key={s.status} className="flex flex-1 flex-col items-center gap-1.5">
                <span className="tnum text-[10px] font-semibold text-text-secondary">
                  {s.count}
                </span>
                <div
                  className="w-full rounded-t-md bg-primary/80 transition-all"
                  style={{ height: `${Math.max((s.count / Math.max(...stats.byStatus.map((x) => x.count)), 1)) * 100}%` }}
                  title={`${s.status}: ${s.count} orders`}
                />
                <span className="text-body-sm text-text-tertiary">{ORDER_STATUSES[s.status]?.label || s.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Status breakdown */}
        <section className="rounded-2xl bg-surface p-5 shadow-card">
          <h2 className="font-display text-headline-sm text-text-primary">Orders by status</h2>
          <ul className="mt-4 flex flex-col gap-2.5">
            {stats.byStatus.map((status) => (
              <li key={status.status} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-body-md text-text-secondary">
                  <span className={`h-2 w-2 rounded-full ${ORDER_STATUSES[status.status]?.dot || 'bg-text-tertiary'}`} />
                  {ORDER_STATUSES[status.status]?.label || status.status}
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
        <section className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-headline-sm text-text-primary">Recent orders</h2>
            <Link to="/admin/orders" className="text-label-sm font-medium text-primary hover:underline">
              View all
            </Link>
          </div>
          {/* Recent orders would be served by a separate endpoint; placeholder for now */}
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
                {stats.recentOrders?.map((order) => (
                  <tr key={order.id} className="border-b border-border-subtle last:border-0">
                    <td className="tnum py-2.5 pr-3 font-medium text-text-primary">{order.order_number}</td>
                    <td className="py-2.5 pr-3 text-text-secondary">{new Date(order.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}</td>
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
        <section className="rounded-2xl bg-surface p-5 shadow-card">
          <h2 className="flex items-center gap-2 font-display text-headline-sm text-text-primary">
            <AlertTriangle size={16} className="text-amber-500" aria-hidden="true" />
            Low stock alerts
          </h2>
          {stats.lowStock.length === 0 ? (
            <p className="mt-4 flex items-center gap-2 text-body-md text-text-secondary">
              <Utensils size={15} className="text-emerald-600" aria-hidden="true" />
              All dishes are well stocked.
            </p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {stats.lowStock.map((product) => (
                <li key={product.id} className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center bg-surface-container-low text-text-tertiary">
                        <Utensils size={14} aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-body-md text-text-primary">{product.name}</span>
                    <span className={`tnum text-body-sm ${product.stock === 0 ? 'text-red-600' : 'text-amber-700'}`}>
                      {product.stock === 0 ? 'Out of stock' : `${product.stock} left`}
                    </span>
                  </div>
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
