import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, Receipt, Truck, Clock } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { formatNaira } from '../lib/currency.js'

export default function OrderConfirmation() {
  const { id } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id || id === 'undefined' || id === 'null') {
      setLoading(false)
      setError('No order ID provided')
      return
    }
    loadOrder()
  }, [id])

  async function loadOrder() {
    try {
      setLoading(true)
      // Fetch via Supabase (RLS ensures customers see only their own orders)
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (!data) {
        setError('Order not found')
        return
      }
      // Ensure the order belongs to the current user (guest orders have no user_id match)
      if (user && data.user_id !== user.id) {
        setError('You do not have access to this order')
        return
      }
      setOrder(data)
    } catch (err) {
      setError(err.message || 'Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading your order…</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="container-page py-16">
        <EmptyState
          icon={Receipt}
          title={error || 'Order not found'}
          description={
            error
              ? error
              : "We couldn't find this order. It may belong to a different account or may not exist."
          }
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button to="/shop">Browse the menu</Button>
              <Button to="/orders" variant="secondary">
                My orders
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-xl animate-slide-up rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-card sm:p-10">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <h1 className="mt-5 font-display text-headline-lg text-text-primary">Order confirmed!</h1>
        <p className="mt-2 text-body-md text-text-secondary">
          Thank you, {order.contact.name.split(' ')[0]}. Your food is being prepared and will be on its way
          shortly.
        </p>

        <dl className="mt-6 flex flex-col gap-2.5 rounded-xl bg-page-bg p-4 text-left text-body-md">
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Order number</dt>
            <dd className="tnum font-semibold text-text-primary">{order.order_number}</dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Status</dt>
            <dd>
              <span className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-badge-xs ${
                order.status === 'delivered'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                  : order.status === 'cancelled'
                  ? 'bg-red-50 text-red-700 border-red-200/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200/60'
              }`}>
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Payment</dt>
            <dd className="tnum font-semibold text-text-primary">
              {order.payment_status === 'paid' ? 'Paid' : 'Pending'} · {formatNaira(order.total)}
            </dd>
          </div>
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Delivery to</dt>
            <dd className="max-w-[60%] text-right text-text-primary">
              {order.delivery.address}, {order.delivery.city}
            </dd>
          </div>
          {order.delivery.instructions && (
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Note</dt>
              <dd className="text-left text-text-secondary">{order.delivery.instructions}</dd>
            </div>
          )}
        </dl>

        <div className="mt-6">
          <h3 className="text-label-md font-semibold text-text-primary">Items</h3>
          <ul className="mt-2 flex flex-col gap-2.5">
            {order.order_items.map((item) => (
              <li key={item.id} className="flex items-center gap-3">
                <span className="min-w-0 flex-1 truncate text-body-md text-text-primary">{item.name}</span>
                <span className="tnum text-body-sm text-text-secondary">× {item.quantity}</span>
                <span className="tnum text-label-md font-semibold text-text-primary">
                  {formatNaira(item.line_total)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Button to="/orders" size="lg" className="flex-1">
            <Receipt size={16} aria-hidden="true" />
            Track my order
          </Button>
          <Button to="/shop" variant="secondary" size="lg" className="flex-1">
            Continue shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
