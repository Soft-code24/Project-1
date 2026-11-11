import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, UserPlus, Repeat, Crown, Clock, Search, Filter, DollarSign } from 'lucide-react'
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

const SEGMENT_TONES = {
  VIP: 'bg-amber-50 text-amber-700 border-amber-200',
  Loyal: 'bg-sky-50 text-sky-700 border-sky-200',
  Returning: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Inactive: 'bg-surface-container-highest text-text-secondary border-border-subtle',
  New: 'bg-orange-50 text-orange-700 border-orange-200',
}

const SKELETON_ROWS = 6

function skeletonList() {
  return Array.from({ length: SKELETON_ROWS })
}

export default function AdminCustomers() {
  const { showToast } = useToast()
  const [stats, setStats] = useState(null)
  const [customers, setCustomers] = useState([])
  const [meta, setMeta] = useState({ total: 0, page: 1, per_page: 20, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [segmentFilter, setSegmentFilter] = useState('all')
  const [spendFilter, setSpendFilter] = useState('all')
  const [sort, setSort] = useState('created_at')
  const [order, setOrder] = useState('desc')
  const [page, setPage] = useState(1)

  useEffect(() => {
    setPage(1)
  }, [search, segmentFilter, spendFilter, sort, order])

  useEffect(() => {
    let mounted = true
    async function loadStats() {
      try {
        const data = await api.getCustomerStats()
        if (mounted) {
          setStats(data.stats)
          setStatsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setStatsLoading(false)
          showToast(err.message || 'Failed to load customer statistics', 'error')
        }
      }
    }
    loadStats()
    return () => {
      mounted = false
    }
  }, [showToast])

  useEffect(() => {
    let mounted = true
    async function loadCustomers() {
      setLoading(true)
      try {
        const params = {
          search,
          segment: segmentFilter === 'all' ? undefined : segmentFilter,
          spend: spendFilter === 'all' ? undefined : spendFilter,
          sort,
          order,
          page,
          limit: 20,
        }
        const data = await api.getCustomers(params)
        if (mounted) {
          setCustomers(data.customers || [])
          setMeta(data.meta || { total: 0, page: 1, per_page: 20, total_pages: 0 })
          setError(null)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message || 'Failed to load customers')
          setLoading(false)
        }
      }
    }
    loadCustomers()
    return () => {
      mounted = false
    }
  }, [search, segmentFilter, spendFilter, sort, order, page, showToast])

  const sortedCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      let av = a[sort]
      let bv = b[sort]
      if (sort === 'totalSpent' || sort === 'orderCount') {
        av = Number(av || 0)
        bv = Number(bv || 0)
      } else {
        av = av ? new Date(av).getTime() : 0
        bv = bv ? new Date(bv).getTime() : 0
      }
      if (av < bv) return order === 'asc' ? -1 : 1
      if (av > bv) return order === 'asc' ? 1 : -1
      return 0
    })
  }, [customers, sort, order])

  const handleSort = (field) => {
    if (sort === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSort(field)
      setOrder('desc')
    }
  }

  const handlePageChange = (delta) => {
    const newPage = page + delta
    if (newPage >= 1 && newPage <= meta.total_pages) setPage(newPage)
  }

  const segmentColor = (segment) => SEGMENT_TONES[segment] || SEGMENT_TONES.New

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Customers</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            View your customer base, purchasing behaviour and lifetime value.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {stats?.totalCustomers ?? '--'}
              </span>
              <p className="text-body-sm text-text-secondary">Total customers</p>
            </div>
            <UserPlus size={17} className="text-primary" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {stats?.newThisMonth ?? '--'}
              </span>
              <p className="text-body-sm text-text-secondary">New this month</p>
            </div>
            <Users size={17} className="text-emerald-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {stats?.repeatCustomers ?? '--'}
              </span>
              <p className="text-body-sm text-text-secondary">Repeat customers</p>
            </div>
            <Repeat size={17} className="text-sky-600" aria-hidden="true" />
          </div>
        </div>
        <div className="rounded-2xl bg-surface p-4 shadow-card">
          <div className="flex items-center justify-between">
            <div>
              <span className="tnum font-display text-price-lg font-bold text-text-primary">
                {stats?.vipCustomers ?? '--'}
              </span>
              <p className="text-body-sm text-text-secondary">VIP customers</p>
            </div>
            <Crown size={17} className="text-amber-600" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="border-b border-border-subtle bg-surface-container-low px-4 py-3 flex flex-wrap items-center justify-between gap-3 sm:flex-nowrap">
          <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-3 py-2 sm:w-80">
            <Search size={15} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or phone"
              className="ml-2 w-full bg-transparent text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
              aria-label="Search customers"
            />
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 py-1.5 sm:w-56">
            <Filter size={14} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              aria-label="Filter by segment"
              className="bg-transparent text-body-sm text-text-primary focus:outline-none w-full"
            >
              <option value="all">All segments</option>
              <option value="VIP">VIP</option>
              <option value="Loyal">Loyal</option>
              <option value="Returning">Returning</option>
              <option value="Inactive">Inactive</option>
              <option value="New">New</option>
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-border-strong bg-surface px-2 py-1.5 sm:w-56">
            <DollarSign size={14} className="shrink-0 text-text-tertiary" aria-hidden="true" />
            <select
              value={spendFilter}
              onChange={(e) => setSpendFilter(e.target.value)}
              aria-label="Filter by spending"
              className="bg-transparent text-body-sm text-text-primary focus:outline-none w-full"
            >
              <option value="all">All spending</option>
              <option value="0-5000">₦0 – ₦5k</option>
              <option value="5000-15000">₦5k – ₦15k</option>
              <option value="15000-50000">₦15k – ₦50k</option>
              <option value="50000-100000">₦50k – ₦100k</option>
              <option value="100000+">₦100k+</option>
            </select>
          </div>
        </div>

        {customers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No customers found"
            description="No customer profiles match your current filters."
            action={
              <Button variant="secondary" onClick={() => {
                setSearch('')
                setSegmentFilter('all')
                setPage(1)
              }}>
                Reset filters
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-body-md">
              <thead>
                <tr className="border-b border-border-subtle text-body-sm text-text-tertiary">
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-surface-container-low" onClick={() => handleSort('name')}>
                    Customer
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-surface-container-low" onClick={() => handleSort('email')}>
                    Email
                  </th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-surface-container-low" onClick={() => handleSort('created_at')}>
                    Registered
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-surface-container-low text-right" onClick={() => handleSort('orderCount')}>
                    Orders
                  </th>
                  <th className="px-4 py-3 font-medium cursor-pointer hover:bg-surface-container-low text-right" onClick={() => handleSort('totalSpent')}>
                    Total spent
                  </th>
                  <th className="px-4 py-3 font-medium">Segment</th>
                  <th className="px-4 py-3 text-right font-medium">Last order</th>
                </tr>
              </thead>
              <tbody>
                {sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="border-b border-border-subtle last:border-0 hover:bg-surface-container-low group">
                    <td className="px-4 py-3">
                      <Link to={`/admin/customers/${customer.id}`}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-container-low flex items-center justify-center">
                            {customer.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-text-primary truncate">{customer.name}</p>
                            {customer.email && (
                              <p className="text-body-sm text-text-secondary truncate">{customer.email}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-text-secondary truncate max-w-xs">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-text-secondary">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-4 py-3 tnum text-text-secondary">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-primary">
                      {customer.orderCount}
                    </td>
                    <td className="px-4 py-3 tnum text-right font-semibold text-text-primary">
                      {formatNaira(customer.totalSpent)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={segmentColor(customer.segment)}>
                        {SEGMENT_LABELS[customer.segment]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 tnum text-right text-text-secondary">
                      {customer.lastOrderAt ? formatDate(customer.lastOrderAt) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {meta.total_pages > 1 && (
          <div className="border-t border-border-subtle bg-surface-container-low px-4 py-3 flex items-center justify-between sm:flex-nowrap">
            <div className="text-body-sm text-text-secondary">
              Showing {meta.total > 0 ? (meta.page - 1) * meta.per_page + 1 : 0}
              to {Math.min(meta.page * meta.per_page, meta.total)} of {meta.total}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(-1)}
                disabled={meta.page === 1}
              >
                Previous
              </Button>
              <span className="text-body-sm text-text-secondary">
                Page {meta.page} of {meta.total_pages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={meta.page >= meta.total_pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
  )
}
