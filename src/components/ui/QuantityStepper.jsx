import { Minus, Plus } from 'lucide-react'

export function QuantityStepper({ value, onChange, min = 1, max = 99, label = 'quantity', size = 'md' }) {
  const btnSize = size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'
  const iconSize = size === 'sm' ? 13 : 15
  return (
    <div className="inline-flex items-center rounded-md border border-border-default bg-surface p-0.5 shadow-sm">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        className={`${btnSize} flex items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-container-low active:bg-surface-container disabled:opacity-40`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus size={iconSize} aria-hidden="true" />
      </button>
      <span
        className="tnum min-w-[2.5ch] px-2 text-center text-label-md font-semibold text-text-primary"
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        className={`${btnSize} flex items-center justify-center rounded text-text-secondary transition-colors hover:bg-surface-container-low active:bg-surface-container disabled:opacity-40`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Plus size={iconSize} aria-hidden="true" />
      </button>
    </div>
  )
}
