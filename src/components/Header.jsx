import { Link, NavLink } from 'react-router-dom'
import { MapPin, Moon, Search, Sun, User } from 'lucide-react'
import { SavorBiteLogo } from './Logo.jsx'
import { MiniCart } from './MiniCart.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'
import { FEATURED_LINKS } from '../data/site.js'

const navLinkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-label-md transition-colors ${
    isActive
      ? 'bg-orange-50 dark:bg-orange-900/20 font-semibold text-primary'
      : 'text-text-secondary hover:bg-surface-container hover:text-text-primary'
  }`

export function Header() {
  const { user } = useAuth()
  const { setTheme } = useTheme()
  const isDark = document.documentElement.classList.contains('dark')

  return (
    <header className="sticky top-0 z-50 border-b border-border-subtle bg-surface/90 pt-safe backdrop-blur-xl">
      <div className="container-page flex h-16 items-center justify-between gap-3">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <SavorBiteLogo className="h-8 w-8 shrink-0" />
          <div className="flex min-w-0 flex-col">
            <span className="font-display text-headline-sm leading-none tracking-tight text-text-primary">
              SavorBite
            </span>
            <span className="mt-0.5 flex items-center gap-1 text-label-sm text-text-secondary">
              <MapPin size={11} className="text-primary" aria-hidden="true" />
              Lagos, NG
            </span>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {FEATURED_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.to === '/'} className={navLinkClass}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to="/shop"
            aria-label="Search the menu"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary md:flex"
          >
            <Search size={20} aria-hidden="true" />
          </Link>

          <MiniCart />

          <button
            type="button"
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
          >
            {isDark ? (
              <Sun size={18} aria-hidden="true" />
            ) : (
              <Moon size={18} aria-hidden="true" />
            )}
          </button>

          <Link
            to="/account"
            aria-label={user ? `Account: ${user.name}` : 'Account'}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-sm transition-transform active:scale-95"
          >
            <User size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  )
}
