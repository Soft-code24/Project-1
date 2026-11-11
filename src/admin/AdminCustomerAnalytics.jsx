import { useEffect, useMemo, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { Users, UserPlus, Repeat, Crown, Clock, TrendingUp, DollarSign, Filter } from 'lucide-react'
import { api } from '../lib/api.js'
import { formatNaira, formatDate } from '../lib/currency.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { Badge } from '../components/ui/Badges.jsx'

const SEGMENT_LABELS = {
  VIP: 'VIP Customer',
  Loyal: 'Loyal Customer',
  Returning: 'Returning Customer',
  Inactive: 'Inactive Customer',
  New: 'New Customer',
}

const SEGMENT_COLORS = {
  VIP: '#F59E0B',
  Loyal: '#0EA5E9',
  Returning: '#10B981',
  Inactive: '#94A3B8',
  New: '#FB923C',
}

const SEGMENT_TONES = {
  VIP: 'bg-amber-50 text-amber-700 border-amber-200',
  Loyal: 'bg-sky-50 text-sky-700 border-sky-200',
  Returning: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-surface-container-highest text-text-secondary border-border-subtle',
  New: 'bg-orange-50 text-orange-700 border-orange-200',
}

const PIE_COLORS = ['#F59E0B', '#0EA5E9', '#10B981', '#FB923C', '#94A3B8']

export default function AdminCustomerAnalytics() {
  const { showToast } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const data = await api.getCustomerStats()
        if (mounted) {
          setStats(data.stats)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setLoading(false)
          setError(err.message || 'Failed to load customer analytics')
          showToast(err.message || 'Failed to load customer analytics', 'error')
        }
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [showToast])

  const totalCustomers = stats?.totalCustomers ?? 0
  const newThisMonth = stats?.newThisMonth ?? 0
  const repeatCustomers = stats?.repeatCustomers ?? 0
  const vipCustomers = stats?.vipCustomers ?? 0
  const totalRevenue = Number(stats?.totalCustomerRevenue || 0)
  const avgLTV = Number(stats?.averageCustomerLifetimeValue || 0)
  const repeatRate = totalCustomers ? Math.round((repeatCustomers / totalCustomers) * 100) : 0
  const segmentBreakdown = stats?.segmentBreakdown || {}
  const segmentRevenue = stats?.segmentRevenue || {}
  const topCustomers = stats?.topCustomers || []
  const acquisitionTrend = stats?.acquisitionTrend || []

  const segmentColor = (segment) => SEGMENT_TONES[segment] || SEGMENT_TONES.New

  // Chart data prepared from real Supabase records (hooks must run before early returns)
  const trendData = useMemo(
    () => acquisitionTrend.map((d) => ({ name: d.date, customers: d.count })),
    [acquisitionTrend]
  )

  const pieData = useMemo(
    () => [
      { name: 'New', value: segmentBreakdown.New || 0 },
      { name: 'Returning', value: segmentBreakdown.Returning || 0 },
      { name: 'Loyal', value: segmentBreakdown.Loyal || 0 },
      { name: 'VIP', value: segmentBreakdown.VIP || 0 },
      { name: 'Inactive', value: segmentBreakdown.Inactive || 0 },
    ],
    [segmentBreakdown]
  )

  const revenueBySegment = useMemo(
    () => [
      { name: 'New', value: Number((segmentRevenue.New?.revenue || 0)) },
      { name: 'Returning', value: Number((segmentRevenue.Returning?.revenue || 0)) },
      { name: 'Loyal', value: Number((segmentRevenue.Loyal?.revenue || 0)) },
      { name: 'VIP', value: Number((segmentRevenue.VIP?.revenue || 0)) },
      { name: 'Inactive', value: Number((segmentRevenue.Inactive?.revenue || 0)) },
    ],
    [segmentRevenue]
  )

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <Users size={28} className="mb-3 text-text-tertiary" aria-hidden="true" />
        <p className="text-body-md text-text-secondary">Loading customer analytics…</p>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Users}
          title="Unable to load analytics"
          description={error}
          action={<Button variant="secondary" onClick={() => window.location.reload()}>Try again</Button>}
        />
      </div>
    )
  }

  if (totalCustomers === 0) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Customer Analytics</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            Understand your customer base and purchasing behaviour.
          </p>
        </div>
        <EmptyState
          icon={Users}
          title="No customers yet"
          description="Once customers place orders, their segments and lifetime value will appear here."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Customer Analytics</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            Customer segments, lifetime value and purchasing behaviour from real order data.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            window.location.reload()
          }}
        >
          <Filter size={14} className="mr-1.5" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {totalCustomers}
              </span>
              <p className="text-body-sm text-text-secondary">Total customers</p>
            </div>
            <Users size={17} className="text-primary" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {newThisMonth}
              </span>
              <p className="text-body-sm text-text-secondary">New this month</p>
            </div>
            <UserPlus size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {repeatRate}%
              </span>
              <p className="text-body-sm text-text-secondary">Repeat customer rate</p>
            </div>
            <Repeat size={17} className="text-sky-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {formatNaira(avgLTV)}
              </span>
              <p className="text-body-sm text-text-secondary">Avg. customer lifetime value</p>
            </div>
            <DollarSign size={17} className="text-amber-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {formatNaira(totalRevenue)}
              </span>
              <p className="text-body-sm text-text-secondary">Total completed revenue</p>
            </div>
            <TrendingUp size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {vipCustomers}
              </span>
              <p className="text-body-sm text-text-secondary">VIP customers</p>
            </div>
            <Crown size={17} className="text-amber-600" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        {/* Acquisition over time */}
        <section className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-headline-sm text-text-primary">
              Customer acquisition over time
            </h2>
            <span className="text-body-sm text-text-tertiary">Last 30 days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="customers"
                  stroke="#0EA5E9"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* New vs returning */}
        <section className="rounded-2xl bg-surface p-5 shadow-card">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-headline-sm text-text-primary">
              New vs returning customers
            </h2>
            <span className="text-body-sm text-text-tertiary">By segment count</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  innerRadius={60}
                  fill="#8884d8"
                  labelLine={false}
                  label={{ position: 'center', fontSize: 14, fill: '#333' }}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                  <Tooltip
                    formatter={(value) => value}
                    nameFormatter={(name) => SEGMENT_LABELS[name] || name}
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            {pieData.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between text-body-sm"
              >
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[pieData.indexOf(entry)] }}
                  />
                  {SEGMENT_LABELS[entry.name] || entry.name}
                </span>
                <span className="tnum font-semibold text-text-primary">{entry.value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue by segment */}
        <section className="rounded-2xl bg-surface p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display text-headline-sm text-text-primary">
              Revenue by customer segment
            </h2>
            <span className="text-body-sm text-text-tertiary">Completed orders only</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBySegment}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#0EA5E9" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            {revenueBySegment.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between text-body-sm"
              >
                <span className="flex items-center gap-2 text-text-secondary">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: SEGMENT_COLORS[entry.name] }}
                  />
                  {SEGMENT_LABELS[entry.name] || entry.name}
                </span>
                <span className="tnum font-semibold text-text-primary">
                  {formatNaira(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Top customers by lifetime spending */}
      <section className="rounded-2xl border border-border-subtle bg-surface shadow-card">
        <div className="border-b border-border-subtle bg-surface-container-low px-4 py-3 flex items-center justify-between">
          <h2 className="font-display text-headline-sm text-text-primary">
            Top customers by lifetime spending
          </h2>
        </div>
        {topCustomers.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-body-md text-text-secondary">No customer spending data available.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Lifetime spent</th>
                  <th className="px-4 py-3 font-medium text-right">Completed orders</th>
                  <th className="px-4 py-3 font-medium">Segment</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-surface-container-low flex items-center justify-center">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-text-primary truncate">{c.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-text-secondary truncate max-w-xs">
                      {c.email || '-'}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-primary">
                      {formatNaira(c.totalSpent)}
                    </td>
                    <td className="px-4 py-3 tnum text-right text-text-secondary">
                      {c.orderCount}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={segmentColor(c.segment)}>
                        {SEGMENT_LABELS[c.segment]}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
