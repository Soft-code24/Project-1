import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgePercent, ShoppingBag, Trash2, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { computeTotals, isValidPromo } from '../lib/cartTotals.js'
import { formatNaira } from '../lib/currency.js'
import { FREE_DELIVERY_THRESHOLD } from '../data/site.js'
import { Button } from '../components/ui/Button.jsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.jsx'
import { EmptyState } from '../components/ui/Form.jsx'

export default function Cart() {
  const { detailedItems, subtotal, setQty, removeItem, clearCart } = useCart()
  const { showToast } = useToast()
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)

  const totals = computeTotals(subtotal, promoApplied)
  const freeDeliveryGap = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)

  const applyPromo = (e) => {
    e.preventDefault()
    if (isValidPromo(promoInput)) {
      setPromoApplied(true)
      showToast('Promo code applied — 20% off!', 'success')
    } else {
      setPromoApplied(false)
      showToast('That promo code is not valid.', 'error')
    }
  }

  if (detailedItems.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="mb-6 font-display text-headline-lg text-text-primary">Your Cart</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse the menu and add your favorites — the kitchen is ready when you are."
          action={
            <Button to="/shop">
              Browse the menu
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className="container-page py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-headline-lg text-text-primary">Your Cart</h1>
        <button
          type="button"
          onClick={() => {
            clearCart()
            showToast('Cart cleared')
          }}
          className="flex items-center gap-1.5 text-label-md text-red-600 transition-colors hover:text-red-700"
        >
          <Trash2 size={15} aria-hidden="true" />
          Clear cart
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        {/* Items */}
        <ul className="flex flex-col gap-3">
          {detailedItems.map(({ product, qty, lineTotal }) => (
            <li
              key={product.id}
              className="flex gap-3 rounded-2xl border border-border-subtle bg-surface p-3 shadow-card"
            >
              <Link
                to={`/product/${product.id}`}
                className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-low sm:h-24 sm:w-24"
              >
                <img src={product.image} alt={product.alt} className="h-full w-full object-cover" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Link
                      to={`/product/${product.id}`}
                      className="block truncate font-display text-headline-sm text-text-primary hover:text-primary"
                    >
                      {product.name}
                    </Link>
                    <p className="truncate text-body-sm text-text-secondary">{product.short}</p>
                    <p className="tnum mt-0.5 text-body-sm text-text-tertiary">
                      {formatNaira(product.price)} each · {product.serving}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${product.name} from cart`}
                    onClick={() => {
                      removeItem(product.id)
                      showToast(`${product.name} removed from cart`)
                    }}
                    className="-mr-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                  <QuantityStepper
                    value={qty}
                    onChange={(next) => setQty(product.id, next)}
                    max={Math.max(product.stock, 1)}
                    size="sm"
                    label={`${product.name} quantity`}
                  />
                  <span className="tnum font-display text-price-md font-bold text-text-primary">
                    {formatNaira(lineTotal)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Summary */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="font-display text-headline-md text-text-primary">Order Summary</h2>

            <form onSubmit={applyPromo} className="mt-4 flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-body-md text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                <BadgePercent size={15} aria-hidden="true" />
                Apply
              </Button>
            </form>

            <dl className="mt-4 flex flex-col gap-2.5 border-t border-border-subtle pt-4 text-body-md">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Subtotal</dt>
                <dd className="tnum font-semibold text-text-primary">{formatNaira(totals.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Delivery</dt>
                <dd className="tnum font-semibold text-text-primary">
                  {totals.deliveryFee === 0 ? (
                    <span className="text-emerald-600">Free</span>
                  ) : (
                    formatNaira(totals.deliveryFee)
                  )}
                </dd>
              </div>
              {promoApplied && (
                <div className="flex justify-between">
                  <dt className="text-emerald-700">Discount (SAVOR20)</dt>
                  <dd className="tnum font-semibold text-emerald-700">−{formatNaira(totals.discount)}</dd>
                </div>
              )}
              <div className="mt-1.5 flex justify-between border-t border-border-default pt-3">
                <dt className="text-label-md font-semibold text-text-primary">Total</dt>
                <dd className="tnum font-display text-price-lg font-bold text-text-primary">
                  {formatNaira(totals.total)}
                </dd>
              </div>
            </dl>

            {freeDeliveryGap > 0 && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-3 py-2 text-body-sm text-orange-700 dark:text-orange-400">
                <Truck size={14} aria-hidden="true" />
                Add {formatNaira(freeDeliveryGap)} more for free delivery
              </p>
            )}

            <Button to="/checkout" size="lg" className="mt-4 w-full">
              Proceed to checkout
              <ArrowRight size={16} aria-hidden="true" />
            </Button>
            <Link
              to="/shop"
              className="mt-3 block text-center text-label-md font-medium text-text-secondary transition-colors hover:text-primary"
            >
              Continue shopping
            </Link>
          </div>
          <p className="px-2 text-body-sm text-text-tertiary">
            Payments are secured by Paystack &amp; Flutterwave. Cash on delivery is available in select areas.
          </p>
        </div>
      </div>
    </div>
  )
}
