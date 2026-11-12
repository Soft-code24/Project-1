import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronRight, LayoutDashboard, LogOut, Package, ShoppingBag, User, Pencil } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'

const menuLinks = [
  { to: '/orders', label: 'My orders', description: 'Track and reorder', icon: Package },
  { to: '/cart', label: 'Shopping cart', description: 'Review your selection', icon: ShoppingBag },
]

export default function Account() {
  const { user, logout, updateProfile, isLoading } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [editMode, setEditMode] = useState(false)
  const [formName, setFormName] = useState(user?.fullName || '')
  const [formPhone, setFormPhone] = useState(user?.phone || '')
  const [saving, setSaving] = useState(false)

  if (isLoading) {
    return (
      <div className="container-page py-20 flex items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading account…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container-page py-10">
        <EmptyState
          icon={User}
          title="You are not logged in"
          description="Log in or create an account to sync your cart, track orders, and check out faster."
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button to="/login?next=/account">Log in</Button>
              <Button to="/register?next=/account" variant="secondary">
                Create account
              </Button>
            </div>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-6">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">My Account</h1>

      <div className="grid gap-5 lg:grid-cols-[7fr_5fr] lg:items-start">
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-4 rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-headline-md font-semibold text-white">
              {(user.fullName?.charAt(0) || user.email?.charAt(0) || '?').toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-headline-md text-text-primary">{user.fullName || 'Unknown'}</p>
              <p className="truncate text-body-md text-text-secondary">{user.email || 'No email'}</p>
              <span className="mt-1 inline-block rounded-full bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-0.5 text-badge-xs font-medium text-emerald-700 dark:text-emerald-400">
                {user.role === 'admin' ? 'Administrator' : 'Customer'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setFormName(user.fullName || '')
                  setFormPhone(user.phone || '')
                  setEditMode(true)
                }}
              >
                <Pencil size={14} aria-hidden="true" />
                Edit profile
              </Button>
              {editMode && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSaving(true)
                    updateProfile({ full_name: formName.trim(), phone: formPhone.trim() || undefined })
                      .then((result) => {
                        if (result.ok) {
                          setEditMode(false)
                          setSaving(false)
                          showToast('Profile updated')
                        } else {
                          setSaving(false)
                          showToast(result.error || 'Failed to update profile', 'error')
                        }
                      })
                  }}
                  className="mt-3 flex flex-col gap-2"
                >
                  <Field label="Full name" htmlFor="profile-name" required>
                    <input
                      id="profile-name"
                      name="profile-name"
                      type="text"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className={controlClass(!formName.trim())}
                      autoComplete="name"
                    />
                  </Field>
                  <Field label="Email address" htmlFor="profile-email">
                    <input
                      id="profile-email"
                      name="profile-email"
                      type="email"
                      value={user.email || ''}
                      readOnly
                      className={controlClass(false)}
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Phone number" htmlFor="profile-phone">
                    <input
                      id="profile-phone"
                      name="profile-phone"
                      type="tel"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className={controlClass(false)}
                      autoComplete="tel"
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button variant="secondary" type="button" onClick={() => setEditMode(false)} disabled={saving}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving || !formName.trim()}>
                      {saving ? 'Saving…' : 'Save'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border-subtle bg-surface shadow-card">
            {menuLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="flex items-center gap-3.5 border-b border-border-subtle px-5 py-4 transition-colors last:border-0 hover:bg-surface-container-low"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20 text-primary dark:text-text-primary">
                  <link.icon size={17} aria-hidden="true" />
                </span>
                <span className="flex-1">
                  <span className="block text-label-md font-semibold text-text-primary">{link.label}</span>
                  <span className="block text-body-sm text-text-secondary">{link.description}</span>
                </span>
                <ChevronRight size={16} className="text-text-tertiary" aria-hidden="true" />
              </Link>
            ))}
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="font-display text-headline-sm text-text-primary">Delivery preferences</h2>
            <p className="mt-1.5 text-body-md text-text-secondary">
              Default delivery area: <span className="font-medium text-text-primary">Lagos, NG</span> — Lekki,
              Victoria Island and Ikoyi.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="font-display text-headline-sm text-text-primary">Session</h2>
            <p className="mt-1.5 text-body-sm text-text-secondary">
              Manage your account access. You can log back in any time.
            </p>
            <Button
              variant="destructive"
              className="mt-4 w-full"
              onClick={() => {
                logout()
                showToast('Logged out')
                navigate('/')
              }}
            >
              <LogOut size={15} aria-hidden="true" />
              Log out
            </Button>
          </div>

          {user.role === 'admin' && (
            <Link
              to="/admin/login"
              className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-surface p-5 shadow-card transition-colors hover:border-border-strong"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-white">
                <LayoutDashboard size={17} aria-hidden="true" />
              </span>
              <span className="flex-1">
                <span className="block text-label-md font-semibold text-text-primary">Admin dashboard</span>
                <span className="block text-body-sm text-text-secondary">Manage products &amp; orders</span>
              </span>
              <ChevronRight size={16} className="text-text-tertiary" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}
