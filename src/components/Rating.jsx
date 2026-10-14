import { Star } from 'lucide-react'

export function Rating({ value, reviews, showCount = true, size = 14 }) {
  return (
    <div className="flex items-center gap-1">
      <Star size={size} className="fill-amber-500 text-amber-500" aria-hidden="true" />
      <span className="tnum text-label-sm font-semibold text-text-primary">{value.toFixed(1)}</span>
      {showCount && reviews != null && (
        <span className="tnum text-body-sm text-text-tertiary">({reviews})</span>
      )}
      <span className="sr-only">out of 5</span>
    </div>
  )
}
