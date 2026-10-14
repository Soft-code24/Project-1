import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom'
import { ExternalLink, LayoutDashboard, LogOut, Package, ReceiptText } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { SavorBiteLogo } from '../components/Logo.jsx'

const navItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package, end: false },
  { to: '/admin/orders', label: 'Orders', icon: ReceiptText, end: false },
]

export function AdminLayout() {
  const { isAdmin, user, logout } = useAuth()
  const { showToast } = useToast()
  const location = useLocation()

  if (!isAdmin) {
    return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname)}`} replace />
  }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-label-md transition-colors ${
      isActive ? 'bg-orange-50 font-semibold text-primary' : 'text-text-secondary hover:bg-surface-container hover:text-text-primary'
    }`

  const initial = user?.name?.charAt(0).toUpperCase() || 'A'

  return (
    <div className="flex min-h-dvh bg-page-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border-subtle bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-border-subtle px-4">
          <SavorBiteLogo className="h-8 w-8" />
          <div className="flex flex-col leading-none">
            <span className="font-display text-headline-sm text-text-primary">SavorBite</span>
            <span className="mt-1 text-badge-xs uppercase tracking-wider text-text-tertiary">Admin</span>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Admin">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
              <item.icon size={17} aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-border-subtle p-3">
          <Link
            to="/"
            className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-label-md text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
          >
            <ExternalLink size={17} aria-hidden="true" />
            View storefront
          </Link>
          <button
            type="button"
            onClick={() => {
              logout()
              showToast('Logged out of admin')
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-label-md text-text-secondary transition-colors hover:bg-red-50 hover:text-red-600"
          >
            <LogOut size={17} aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-border-subtle bg-white/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-3 px-4 md:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <SavorBiteLogo className="h-7 w-7" />
              <span className="font-display text-headline-sm text-text-primary">Admin</span>
            </div>
            <p className="hidden text-body-md text-text-secondary lg:block">
              Signed in as <span className="font-medium text-text-primary">{user?.email}</span>
            </p>
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className="hidden items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-label-sm text-text-secondary transition-colors hover:text-text-primary sm:flex"
              >
                <ExternalLink size={14} aria-hidden="true" />
                Storefront
              </Link>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-charcoal text-label-md font-semibold text-white">
                {initial}
              </span>
            </div>
          </div>
          {/* Mobile nav */}
          <nav className="flex gap-1 overflow-x-auto px-4 pb-2 no-scrollbar lg:hidden" aria-label="Admin mobile">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-label-sm transition-colors ${
                    isActive ? 'bg-primary font-semibold text-white' : 'bg-surface-container-low text-text-secondary'
                  }`
                }
              >
                <item.icon size={14} aria-hidden="true" />
                {item.label}
              </NavLink>
            ))}
            <button
              type="button"
              onClick={() => {
                logout()
                showToast('Logged out of admin')
              }}
              className="flex shrink-0 items-center gap-1.5 rounded-full bg-surface-container-low px-3.5 py-1.5 text-label-sm text-text-secondary"
            >
              <LogOut size={14} aria-hidden="true" />
              Log out
            </button>
          </nav>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
