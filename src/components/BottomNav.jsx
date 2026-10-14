import { NavLink } from 'react-router-dom'
import { Home, ReceiptText, User, UtensilsCrossed } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/shop', label: 'Shop', icon: UtensilsCrossed, end: false },
  { to: '/orders', label: 'Orders', icon: ReceiptText, end: false },
  { to: '/account', label: 'Account', icon: User, end: false },
]

export function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-white/95 pb-safe shadow-bottomnav backdrop-blur-xl md:hidden"
      aria-label="Mobile"
    >
      <div className="flex items-center justify-around px-1">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              `flex min-h-[56px] min-w-[64px] flex-col items-center justify-center gap-0.5 transition-all active:scale-95 ${
                isActive ? 'font-semibold text-primary' : 'text-text-tertiary hover:text-text-primary'
              }`
            }
          >
            <tab.icon size={22} aria-hidden="true" />
            <span className="text-label-sm">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
