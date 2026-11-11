import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowRight, Bike, Leaf, Lock, Utensils } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'
import { SavorBiteLogo } from '../components/Logo.jsx'
import { HERO_IMAGE } from '../data/site.js'

const perks = [
  { icon: Bike, title: '30-minute delivery', text: 'Across Lekki, VI & Ikoyi' },
  { icon: Leaf, title: 'Fresh every day', text: 'Farm-sourced ingredients' },
  { icon: Lock, title: 'Secure payments', text: 'Cash on delivery' },
  { icon: Utensils, title: 'Chef-crafted menu', text: 'Prepared to order' },
]

export default function Auth() {
  const location = useLocation()
  const navigate = useNavigate()
  const params = new URLSearchParams(location.search)
  const next = params.get('next') || '/'
  const initialMode = location.pathname === '/signup' || location.pathname === '/register' ? 'register' : 'login'

  const { login, register, loginAsDemoCustomer } = useAuth()
  const { showToast } = useToast()

  const [mode, setMode] = useState(initialMode)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    const result =
      mode === 'login' ? await login(form.email, form.password) : await register(form.name, form.email, form.password)
    setSubmitting(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    showToast(mode === 'login' ? `Welcome back, ${result.user.fullName || result.user.email.split(' ')[0]}!` : 'Account created — welcome to SavorBite!', 'success')
    navigate(next, { replace: true })
  }

  return (
    <div className="container-page py-8">
      <div className="grid overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-card lg:grid-cols-2">
        <div className="p-6 sm:p-10">
          <div className="lg:hidden">
            <SavorBiteLogo className="h-10 w-10" showWordmark />
          </div>

          <h1 className="mt-0 font-display text-headline-lg text-text-primary lg:mt-0">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="mt-1.5 text-body-md text-text-secondary">
            {mode === 'login'
              ? 'Log in to order faster and track your deliveries.'
              : 'Join SavorBite to order in seconds and keep your order history.'}
          </p>

          <div className="mt-6 flex gap-1 rounded-xl bg-surface-container-low p-1" role="tablist">
            {[
              { id: 'login', label: 'Log in' },
              { id: 'register', label: 'Register' },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={mode === tab.id}
                type="button"
                onClick={() => {
                  setMode(tab.id)
                  setError('')
                }}
                className={`flex-1 rounded-lg py-2 text-label-md font-medium transition-colors ${
                  mode === tab.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4" noValidate>
            {mode === 'register' && (
              <Field label="Full name" htmlFor="auth-name" required>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Adaeze Okafor"
                  className={controlClass(false)}
                  value={form.name}
                  onChange={setField('name')}
                />
              </Field>
            )}
            <Field label="Email address" htmlFor="auth-email" required>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={controlClass(false)}
                value={form.email}
                onChange={setField('email')}
              />
            </Field>
            <Field label="Password" htmlFor="auth-password" required hint="At least 6 characters">
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder="••••••••"
                className={controlClass(false)}
                value={form.password}
                onChange={setField('password')}
              />
            </Field>

            {error && (
              <p role="alert" className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-body-sm text-red-700 dark:text-red-400">
                {error}
              </p>
            )}

            <Button type="submit" size="lg" disabled={submitting}>
              {mode === 'login' ? 'Log in' : 'Create account'}
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          </form>

          <div className="mt-5 flex flex-col gap-3 rounded-xl bg-page-bg p-4">
            <p className="text-body-sm text-text-secondary">
              Just browsing? You can check out as a guest at any time.
            </p>
            <Button
              variant="secondary"
              onClick={async () => {
                await loginAsDemoCustomer()
                showToast('Logged in as demo customer', 'success')
                navigate(next, { replace: true })
              }}
            >
              Continue as demo customer
            </Button>
            <p className="text-body-sm text-text-tertiary">
              Forgot your password?{' '}
              <Link to="/forgot-password" className="font-medium text-primary hover:underline">
                Reset it
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="relative hidden bg-charcoal lg:block">
          <img src={HERO_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/70 to-charcoal/30" />
          <div className="relative flex h-full flex-col justify-end p-10">
            <SavorBiteLogo className="h-12 w-12" />
            <h2 className="mt-5 font-display text-headline-lg text-white">
              Your next favorite meal is one tap away.
            </h2>
            <p className="mt-2 max-w-sm text-body-md text-white dark:text-text-secondary">
              Save your details once, reorder your favorites, and track every delivery from kitchen to
              doorstep.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {perks.map((perk) => (
                <div key={perk.title} className="flex items-center gap-2.5 rounded-xl bg-white/10 dark:bg-text-primary/10 p-3 backdrop-blur">
                  <perk.icon size={18} className="shrink-0 text-primary" aria-hidden="true" />
                  <div>
                    <p className="text-label-sm font-semibold text-white">{perk.title}</p>
                    <p className="text-body-sm text-white/80 dark:text-text-tertiary">{perk.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
