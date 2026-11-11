import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'
import { SavorBiteLogo } from '../components/Logo.jsx'

export default function AdminLogin() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/admin'

  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await login(form.email, form.password)
      if (!result.ok) {
        setError(result.error || 'Invalid email or password.')
        return
      }
      if (result.user.role !== 'admin') {
        setError('This account does not have admin access.')
        return
      }
      showToast('Welcome to the admin dashboard', 'success')
      navigate(next, { replace: true })
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-page-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <SavorBiteLogo className="h-11 w-11" />
          <h1 className="mt-4 font-display text-headline-lg text-text-primary">Admin Dashboard</h1>
          <p className="mt-1.5 text-body-md text-text-secondary">
            Sign in with an administrator account to manage products and orders.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl border border-border-subtle bg-surface p-6 shadow-card" noValidate>
          <Field label="Email address" htmlFor="admin-email" required>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              placeholder="admin@savorbite.ng"
              className={controlClass(false)}
              value={form.email}
              onChange={setField('email')}
            />
          </Field>
          <Field label="Password" htmlFor="admin-password" required>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              className={controlClass(false)}
              value={form.password}
              onChange={setField('password')}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-body-sm text-red-700">
              {error}
            </p>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            <Lock size={15} aria-hidden="true" />
            {submitting ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>

          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-border-default bg-surface p-4 text-body-sm text-text-secondary shadow-card">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
            <p>
              Sign in with an administrator account to manage products and orders. In production this
              is replaced by Supabase Auth with row-level security.
            </p>
          </div>

        <p className="mt-4 text-center text-body-sm text-text-secondary">
          <Link to="/" className="font-medium text-primary hover:underline">
            ← Back to storefront
          </Link>
        </p>
      </div>
    </div>
  )
}
