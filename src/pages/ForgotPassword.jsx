import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPassword() {
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!emailPattern.test(email.trim())) next.email = 'Enter a valid email address.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSending(true)
    try {
      if (supabase) {
        await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/reset-password`,
        })
      }
      setSent(true)
    } catch (err) {
      // Don't reveal whether the email exists.
      setSent(true)
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-md animate-slide-up rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <Mail size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Check your email</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            If an account exists for that address, you will receive a password reset link.
          </p>
          <Button to="/login" size="lg" className="mt-6 w-full">
            <ArrowRight size={16} aria-hidden="true" />
            Back to sign in
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-headline-lg text-text-primary">Reset your password</h1>
      <p className="mt-1.5 mb-6 text-body-md text-text-secondary">
        Enter your email address and we will send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4" noValidate>
        <Field label="Email address" htmlFor="reset-email" error={errors.email} required>
          <input
            id="reset-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            className={controlClass(errors.email)}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
