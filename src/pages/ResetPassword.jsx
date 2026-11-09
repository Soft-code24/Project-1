import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Lock, ArrowRight, CheckCircle2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { showToast } = useToast()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})
  const [resetting, setResetting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token) {
      setErrors({ token: 'No reset token found. Please request a new reset link.' })
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!token) next.token = 'Invalid reset link.'
    if (!password || password.length < 6) next.password = 'Password must be at least 6 characters.'
    if (password !== confirm) next.confirm = 'Passwords do not match.'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setResetting(true)
    try {
      if (!supabase) {
        showToast('Supabase is not configured.', 'error')
        return
      }
      // Verify the recovery token so the session is authorised to set a password.
      const { error: verifyError } = await supabase.auth.verifyOtp({ token, type: 'recovery' })
      if (verifyError) throw verifyError
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
    } catch (err) {
      showToast(err.message || 'Could not reset password.', 'error')
    } finally {
      setResetting(false)
    }
  }

  if (done) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-md animate-slide-up rounded-2xl border border-border-subtle bg-white p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Password reset</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <Button to="/login" size="lg" className="mt-6 w-full">
            <ArrowRight size={16} aria-hidden="true" />
            Sign in
          </Button>
        </div>
      </div>
    )
  }

  if (errors.token) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-md rounded-2xl border border-border-subtle bg-white p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Lock size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Invalid reset link</h1>
          <p className="mt-2 text-body-md text-text-secondary">{errors.token}</p>
          <Button to="/forgot-password" size="lg" className="mt-6 w-full">
            Request a new link
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-headline-lg text-text-primary">Set a new password</h1>
      <p className="mt-1.5 mb-6 text-body-md text-text-secondary">
        Choose a new password for your SavorBite account.
      </p>

      <form onSubmit={handleSubmit} className="max-w-md flex flex-col gap-4" noValidate>
        <Field label="New password" htmlFor="reset-password" error={errors.password} required hint="At least 6 characters">
          <input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={controlClass(errors.password)}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" htmlFor="reset-password-confirm" error={errors.confirm} required>
          <input
            id="reset-password-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="••••••••"
            className={controlClass(errors.confirm)}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" size="lg" disabled={resetting}>
          {resetting ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>

      <p className="mt-6 text-center text-body-sm text-text-secondary">
        Need a new link?{' '}
          <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Request again
        </Link>
      </p>
    </div>
  )
}
