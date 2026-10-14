import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Plus, ShoppingCart } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { formatNaira } from '../lib/currency.js'
import { StockBadge } from './ui/Badges.jsx'
import { Rating } from './Rating.jsx'

export function ProductCard({ product, layout = 'shop' }) {
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [favorite, setFavorite] = useState(false)
  const soldOut = product.stock <= 0
  const href = `/product/${product.id}`

  const handleAdd = (e) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product.id)
    showToast(`${product.name} added to cart`, 'success')
  }

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-border-subtle bg-white shadow-card transition-shadow hover:shadow-cardHover">
      <Link to={href} className="relative block aspect-[4/3] overflow-hidden bg-surface-container-low">
        <img
          src={product.image}
          alt={product.alt}
          loading="lazy"
          className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${soldOut ? 'grayscale-[35%]' : ''}`}
        />
        <span className="absolute left-2 top-2">
          <StockBadge stock={product.stock} />
        </span>
      </Link>
      <button
        type="button"
        aria-label={favorite ? `Remove ${product.name} from favorites` : `Save ${product.name} to favorites`}
        aria-pressed={favorite}
        onClick={() => setFavorite((f) => !f)}
        className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-text-secondary shadow-sm backdrop-blur transition-colors hover:text-primary active:scale-90"
      >
        <Heart size={16} className={favorite ? 'fill-primary text-primary' : ''} aria-hidden="true" />
      </button>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {layout === 'home' && <Rating value={product.rating} reviews={product.reviews} />}
        <Link
          to={href}
          className="font-display text-headline-sm text-text-primary line-clamp-1 transition-colors group-hover:text-primary"
        >
          {product.name}
        </Link>
        <p className={`line-clamp-1 text-body-sm ${soldOut ? 'text-text-tertiary' : 'text-text-secondary'}`}>
          {product.short}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div className="flex flex-col">
            {product.compareAt && (
              <span className="tnum text-body-sm text-text-tertiary line-through">
                {formatNaira(product.compareAt)}
              </span>
            )}
            <span className={`font-display text-price-md tnum ${soldOut ? 'text-text-tertiary line-through' : 'text-text-primary'}`}>
              {formatNaira(product.price)}
            </span>
          </div>
          {soldOut ? (
            <span className="inline-flex cursor-not-allowed items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1.5 text-label-sm text-text-tertiary">
              Sold out
            </span>
          ) : layout === 'shop' ? (
            <button
              type="button"
              aria-label={`Add ${product.name} to cart`}
              onClick={handleAdd}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95"
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleAdd}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-label-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover active:scale-95"
            >
              <ShoppingCart size={15} aria-hidden="true" />
              Add
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
