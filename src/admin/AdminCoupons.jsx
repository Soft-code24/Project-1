import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabase.js'
import { Button } from '../components/ui/Button.jsx'
import { formatNaira } from '../lib/currency.js'

export default function AdminCoupons() {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newCode, setNewCode] = useState('')
  const [newDiscount, setNewDiscount] = useState('')
  const [newType, setNewType] = useState('percentage')

  useEffect(() => {
    loadCoupons()
  }, [])

  async function loadCoupons() {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setCoupons(data || [])
    } catch (err) {
      setError(err.message || 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  async function createCoupon() {
    if (!newCode.trim() || !newDiscount) {
      setError('Please fill in all fields')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const { error } = await supabase
        .from('coupons')
        .insert({
          code: newCode.trim().toUpperCase(),
          type: newType,
          discount_value: parseFloat(newDiscount),
          min_order_amount: 0,
          max_discount: null,
          starts_at: new Date().toISOString(),
          expires_at: null,
          usage_limit: null,
          usage_count: 0,
          per_customer_limit: 1,
          first_order_only: false,
          is_active: true,
        })
      if (error) throw error
      setNewCode('')
      setNewDiscount('')
      await loadCoupons()
    } catch (err) {
      setError(err.message || 'Failed to create coupon')
    } finally {
      setCreating(false)
    }
  }

  async function toggleCoupon(id, currentIsActive) {
    setError(null)
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !currentIsActive })
        .eq('id', id)
      if (error) throw error
      await loadCoupons()
    } catch (err) {
      setError(err.message || 'Failed to update coupon')
    }
  }

  async function deleteCoupon(id) {
    if (!confirm('Are you sure you want to delete this coupon?')) return
    setError(null)
    try {
      const { error } = await supabase.from('coupons').delete().eq('id', id)
      if (error) throw error
      await loadCoupons()
    } catch (err) {
      setError(err.message || 'Failed to delete coupon')
    }
  }

  if (!user) return <div className="p-4">Not authenticated.</div>

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="mb-4 font-display text-headline-lg text-text-primary">Admin Coupons</h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Coupon Code</label>
          <input
            type="text"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value.toUpperCase())}
            placeholder="e.g. WELCOME10"
            className="w-full border border-border-strong rounded-lg px-3 py-2 text-text-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Discount Value (%)</label>
          <input
            type="number"
            value={newDiscount}
            onChange={(e) => setNewDiscount(e.target.value)}
            min="1"
            step="1"
            className="w-full border border-border-strong rounded-lg px-3 py-2 text-text-primary focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-text-secondary">Type</label>
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="w-full border border-border-strong rounded-lg px-3 py-2 text-text-primary focus:ring-1 focus:ring-primary"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed_amount">Fixed Amount</option>
          </select>
        </div>
        <Button type="button" onClick={createCoupon} disabled={creating}>
          {creating ? 'Creating...' : 'Create Coupon'}
        </Button>
      </div>

      <div className="mt-6">
        <table className="w-full border-collapse border border-border-subtle">
          <thead>
            <tr className="bg-surface text-text-secondary text-sm">
              <th className="p-3 text-left">Code</th>
              <th className="p-3 text-left">Type</th>
              <th className="p-3 text-left">Discount</th>
              <th className="p-3 text-left">Min Order</th>
              <th className="p-3 text-left">Max Discount</th>
              <th className="p-3 text-left">Usage</th>
              <th className="p-3 text-left">Per Customer</th>
              <th className="p-3 text-left">Active</th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-border-subtle hover:bg-surface-light">
                <td className="p-3 font-mono text-text-primary">{c.code}</td>
                <td className="p-3 text-text-secondary">{c.type}</td>
                <td className="p-3 text-text-primary">
                  {c.type === 'percentage' ? `${c.discount_value}%` : `₦${Number(c.discount_value).toFixed(2)}`}
                </td>
                <td className="p-3 text-text-secondary">
                  {c.min_order_amount == null || c.min_order_amount === 0 ? 'None' : `₦${Number(c.min_order_amount).toFixed(2)}`}
                </td>
                <td className="p-3 text-text-secondary">
                  {c.max_discount == null ? 'None' : `₦${Number(c.max_discount).toFixed(2)}`}
                </td>
                <td className="p-3 text-text-secondary">
                  {c.usage_count}/{c.usage_limit || '∞'}
                </td>
                <td className="p-3 text-text-secondary">{c.per_customer_limit || '∞'}</td>
                <td className="p-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                      c.is_active
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                        : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}
                  >
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleCoupon(c.id, c.is_active)}
                  >
                    {c.is_active ? 'Deactivate' : 'Activate'}
                  </Button>{' '}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => deleteCoupon(c.id)}
                  >
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}