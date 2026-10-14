import { Link } from 'react-router-dom'

const variants = {
  primary: 'bg-primary text-white shadow-sm hover:bg-primary-hover active:scale-[0.98]',
  secondary: 'bg-white text-text-primary border border-border-default shadow-sm hover:bg-gray-50 active:bg-gray-100',
  destructive: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-container',
  subtle: 'bg-surface-container-low text-text-primary hover:bg-surface-container',
  dark: 'bg-charcoal text-white hover:bg-black/85',
}

const sizes = {
  sm: 'text-label-sm px-3 py-1.5 gap-1.5',
  md: 'text-label-md px-4 py-2.5',
  lg: 'text-body-md px-5 py-3',
}

const base =
  'inline-flex items-center justify-center rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60'

export function buttonClass(variant = 'primary', size = 'md', className = '') {
  return `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`
}

export function Button({ variant = 'primary', size = 'md', className = '', to, children, ...rest }) {
  const cls = buttonClass(variant, size, className)
  if (to) {
    return (
      <Link to={to} className={cls} {...rest}>
        {children}
      </Link>
    )
  }
  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  )
}
