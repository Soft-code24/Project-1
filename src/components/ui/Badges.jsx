import {
  Croissant,
  CupSoda,
  Dumbbell,
  Flame,
  Leaf,
  Salad,
  Sandwich,
  Soup,
  UtensilsCrossed,
} from 'lucide-react'
import { ORDER_STATUSES } from '../../data/orders.js'
import { LOW_STOCK_THRESHOLD } from '../../data/products.js'

const CATEGORY_ICONS = {
  'gourmet-bowls': Soup,
  'salads-greens': Salad,
  'grills-suya': Flame,
  'burgers-mains': Sandwich,
  'fresh-drinks': CupSoda,
  'pastries-sides': Croissant,
}

export function CategoryIcon({ category, size = 16, className = '' }) {
  const Icon = CATEGORY_ICONS[category] || UtensilsCrossed
  return <Icon size={size} className={className} aria-hidden="true" />
}

export function categoryIconFor(category) {
  return CATEGORY_ICONS[category] || UtensilsCrossed
}

const DIET_ICONS = {
  popular: Flame,
  spicy: Flame,
  vegetarian: Leaf,
  'high-protein': Dumbbell,
}

export function dietIconFor(tag) {
  return DIET_ICONS[tag] || UtensilsCrossed
}

export function Badge({ className = '', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-badge-xs ${className}`}
    >
      {children}
    </span>
  )
}

export function StockBadge({ stock }) {
  if (stock <= 0) {
    return (
      <Badge className="bg-surface-container-highest text-text-secondary shadow-sm">
        Sold out
      </Badge>
    )
  }
  if (stock <= LOW_STOCK_THRESHOLD) {
    return (
      <Badge className="bg-amber-100 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 font-semibold shadow-sm">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
        Low stock ({stock} left)
      </Badge>
    )
  }
  return (
    <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
      In stock
    </Badge>
  )
}

export function PromoTag({ children, icon: Icon }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 py-0.5 text-badge-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
      {Icon && <Icon size={12} aria-hidden="true" />}
      {children}
    </span>
  )
}

export function StatusBadge({ status }) {
  const meta = ORDER_STATUSES[status] || ORDER_STATUSES.pending
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-badge-xs ${meta.className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  )
}

export function TagPill({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border-default bg-surface px-3.5 py-1.5 text-label-sm text-text-secondary ${className}`}
    >
      {children}
    </span>
  )
}
