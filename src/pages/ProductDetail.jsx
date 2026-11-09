import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  Bike,
  Check,
  ChefHat,
  Clock,
  Heart,
  Lock,
  ShoppingCart,
  Star,
  Timer,
  Utensils,
} from 'lucide-react'
import { getCategoryName } from '../data/products.js'
import { formatNaira } from '../lib/currency.js'
import { useProducts } from '../context/ProductContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.jsx'
import { StockBadge, TagPill } from '../components/ui/Badges.jsx'
import { EmptyState } from '../components/ui/Form.jsx'
import { Rating } from '../components/Rating.jsx'
import { ProductCard } from '../components/ProductCard.jsx'
import { SEO } from '../components/SEO.jsx'

export default function ProductDetail() {
  const { id } = useParams()
  const { getBySlug, related } = useProducts()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const product = getBySlug(id)
  const [qty, setQty] = useState(1)
  const [favorite, setFavorite] = useState(false)

  if (!product) {
    return (
      <>
      <SEO title="Dish not found | SavorBite" />
      <div className="container-page py-16">
        <EmptyState
          icon={Utensils}
          title="Dish not found"
          description="The dish you are looking for is no longer on the menu."
          action={<Button to="/shop">Browse the menu</Button>}
        />
      </div>
    </>
    )
  }

  const soldOut = product.stock <= 0
  const relatedItems = related(product, 4)

  const handleAdd = () => {
    if (soldOut) return
    addItem(product.id, qty)
    showToast(`${qty} × ${product.name} added to cart`, 'success')
  }

  return (
    <>
    <SEO
      title={`${product.name} | SavorBite`}
      description={product.short}
      image={product.image}
      path={`/products/${product.slug}`}
    />
    <div className="container-page py-4 pb-28 md:pb-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-body-sm text-text-secondary">
        <Link to="/" className="transition-colors hover:text-primary">
          Home
        </Link>
        <span aria-hidden="true">/</span>
        <Link to="/shop" className="transition-colors hover:text-primary">
          Shop
        </Link>
        <span aria-hidden="true">/</span>
        <Link to={`/shop?category=${product.category}`} className="transition-colors hover:text-primary">
          {getCategoryName(product.category)}
        </Link>
        <span aria-hidden="true">/</span>
        <span className="truncate text-text-primary">{product.name}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        {/* Media */}
        <div className="flex flex-col gap-3">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-surface-container-low shadow-card">
            <img src={product.image} alt={product.alt} className={`h-full w-full object-cover ${soldOut ? 'grayscale' : ''}`} />
            <span className="absolute left-3 top-3">
              <StockBadge stock={product.stock} />
            </span>
            {product.special && (
              <span className="absolute left-3 top-12 rounded-full bg-primary px-2.5 py-0.5 text-badge-xs font-semibold text-white shadow-sm">
                Chef’s daily special
              </span>
            )}
            <button
              type="button"
              aria-label={favorite ? 'Remove from favorites' : 'Save to favorites'}
              aria-pressed={favorite}
              onClick={() => setFavorite((f) => !f)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-surface/90 text-text-secondary shadow-sm backdrop-blur transition-colors hover:text-primary active:scale-90"
            >
              <Heart size={18} className={favorite ? 'fill-primary text-primary' : ''} aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Bike, label: '30-min delivery' },
              { icon: ChefHat, label: 'Freshly prepared' },
              { icon: Lock, label: 'Secure payment' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-surface px-2 py-3 text-center shadow-card"
              >
                <item.icon size={18} className="text-primary" aria-hidden="true" />
                <span className="text-label-sm text-text-secondary">{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="flex flex-col">
          <Link
            to={`/shop?category=${product.category}`}
            className="w-fit rounded-full bg-orange-50 dark:bg-orange-900/20 px-3 py-1 text-label-sm font-medium text-primary dark:text-text-primary transition-colors hover:bg-orange-100 dark:hover:bg-orange-900/40"
          >
            {getCategoryName(product.category)}
          </Link>
          <h1 className="mt-3 font-display text-hero-mobile text-text-primary md:text-headline-lg">
            {product.name}
          </h1>
          <div className="mt-2 flex items-center gap-3">
            <Rating value={product.rating} reviews={product.reviews} size={16} />
            <span className="flex items-center gap-1 text-body-sm text-text-secondary">
              <Clock size={14} aria-hidden="true" />
              {product.prepTime}
            </span>
            <span className="flex items-center gap-1 text-body-sm text-text-secondary">
              <Utensils size={14} aria-hidden="true" />
              {product.serving}
            </span>
          </div>

          <div className="mt-4 flex items-end gap-3">
            <span className="font-display text-price-lg font-bold tnum text-text-primary">
              {formatNaira(product.price)}
            </span>
            {product.compareAt && (
              <>
                <span className="tnum text-body-lg text-text-tertiary line-through">
                  {formatNaira(product.compareAt)}
                </span>
                <span className="rounded-full bg-amber-100 dark:bg-amber-900/20 px-2.5 py-0.5 text-badge-xs font-semibold text-amber-800 dark:text-amber-400">
                  Save {formatNaira(product.compareAt - product.price)}
                </span>
              </>
            )}
          </div>

          <p className="mt-4 text-body-lg text-text-secondary">{product.description}</p>

          <div className="mt-5">
            <h2 className="text-label-md font-semibold text-text-primary">What’s inside</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {product.ingredients.map((ingredient) => (
                <TagPill key={ingredient}>
                  <Check size={12} className="text-emerald-600" aria-hidden="true" />
                  {ingredient}
                </TagPill>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-semibold text-text-primary">Quantity</span>
              <QuantityStepper
                value={qty}
                onChange={setQty}
                max={Math.max(product.stock, 1)}
                label={`${product.name} quantity`}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={handleAdd} disabled={soldOut}>
                <ShoppingCart size={17} aria-hidden="true" />
                {soldOut ? 'Sold out' : `Add to cart · ${formatNaira(product.price * qty)}`}
              </Button>
              <Button size="lg" variant="secondary" to="/cart" className="flex-1">
                View cart
              </Button>
            </div>
            {!soldOut && product.stock <= 5 && (
              <p className="flex items-center gap-1.5 text-body-sm text-amber-700 dark:text-amber-400">
                <Timer size={14} aria-hidden="true" />
                Only {product.stock} left — order soon.
              </p>
            )}
            <p className="flex items-center gap-1.5 text-body-sm text-text-tertiary">
              <Star size={13} className="text-amber-500 dark:text-amber-400" aria-hidden="true" />
              Rated {product.rating.toFixed(1)} by {product.reviews} happy customers
            </p>
          </div>
        </div>
      </div>

      {/* Related dishes */}
      {relatedItems.length > 0 && (
        <section className="mt-10">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-headline-md text-text-primary">You might also like</h2>
            <Link to="/shop" className="flex items-center gap-1 text-label-md font-medium text-primary">
              View all <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
            {relatedItems.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky order bar */}
      {!soldOut && (
        <div className="fixed inset-x-0 bottom-16 z-40 flex items-center justify-between gap-3 border-t border-border-default bg-surface/95 dark:bg-surface/95 px-4 py-3 shadow-overlay backdrop-blur md:hidden">
          <div className="flex flex-col">
            <span className="tnum font-display text-price-md font-bold text-text-primary">
              {formatNaira(product.price * qty)}
            </span>
            <span className="text-body-sm text-text-tertiary">{qty} item{qty > 1 ? 's' : ''}</span>
          </div>
          <Button onClick={handleAdd} className="flex-1">
            <ShoppingCart size={16} aria-hidden="true" />
            Add to cart
          </Button>
        </div>
      )}
    </div>
    </>
  )
}
