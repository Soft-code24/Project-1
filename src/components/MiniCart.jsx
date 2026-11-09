import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Trash2, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { computeTotals } from '../lib/cartTotals.js'
import { formatNaira } from '../lib/currency.js'
import { FREE_DELIVERY_THRESHOLD } from '../data/site.js'
import { Button } from '../components/ui/Button.jsx'
import { QuantityStepper } from '../components/ui/QuantityStepper.jsx'

export function MiniCart() {
  const { detailedItems, subtotal, setQty, removeItem, clearCart } = useCart()
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  const totals = computeTotals(subtotal, false)
  const freeDeliveryGap = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)

  const toggle = () => setOpen((o) => !o)

  const closeCart = () => {
    document.activeElement?.blur()
    setOpen(false)
  }

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        aria-label={detailedItems.length === 0 ? 'Cart' : `Cart, ${detailedItems.length} items`}
        aria-expanded={open}
        onClick={toggle}
        className="relative flex h-11 items-center gap-2 rounded-full px-2.5 text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
      >
        <span className="relative">
          <ShoppingBag size={20} aria-hidden="true" />
          {detailedItems.length > 0 && (
            <span className="tnum absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
              {detailedItems.length}
            </span>
          )}
        </span>
        <span className="hidden text-label-md md:inline">Cart</span>
      </button>

      {/* Slide-out panel - rendered into document.body via portal */}
      {open && (
        createPortal(
          <div className="fixed inset-y-0 right-0 z-[9999] flex h-full w-[90vw] max-w-[420px] flex-col bg-surface shadow-card transition-transform duration-300 ease-in-out translate-x-0" aria-hidden={false} aria-label="Shopping cart">
            {/* Cart header */}
            <div className="flex h-16 items-center justify-between border-b border-border-subtle bg-surface px-5">
              <h2 className="font-display text-headline-sm text-text-primary">Your Cart</h2>
              <button
                type="button"
                aria-label="Close cart"
                onClick={closeCart}
                className="-mr-2 -mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-container hover:text-text-primary"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto p-5">
              {detailedItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-body-md text-text-secondary">Your cart is empty</p>
                  <Button className="mt-6" onClick={closeCart}>Browse the menu</Button>
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-3">
                    {detailedItems.map(({ product, qty, lineTotal }) => (
                      <li key={product.id} className="flex gap-3 rounded-xl border border-border-subtle bg-surface p-3 shadow-sm">
                        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                          <Link to={`/product/${product.id}`} className="h-full w-full object-cover" aria-hidden="true">
                            <img src={product.image} alt={product.alt} className="h-full w-full object-cover" />
                          </Link>
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Link to={`/product/${product.id}`} className="block truncate font-display text-headline-sm text-text-primary hover:text-primary">
                                {product.name}
                              </Link>
                              <p className="truncate text-body-sm text-text-secondary">{product.short}</p>
                              <p className="tnum mt-0.5 text-body-sm text-text-tertiary">{formatNaira(product.price)} each</p>
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
                            <QuantityStepper value={qty} onChange={(next) => setQty(product.id, next)} max={Math.max(product.stock, 1)} size="sm" label={`${product.name} quantity`} />
                            <span className="tnum font-display text-price-md font-bold text-text-primary">{formatNaira(lineTotal)}</span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Order summary */}
                  <div className="mt-5 border-t border-border-subtle pt-4">
                    <dl className="flex flex-col gap-2.5 text-body-md">
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Subtotal</dt>
                        <dd className="tnum font-semibold text-text-primary">{formatNaira(totals.subtotal)}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-text-secondary">Delivery</dt>
                        <dd className="tnum font-semibold text-text-primary">
                          {totals.deliveryFee === 0 ? <span className="text-emerald-600">Free</span> : formatNaira(totals.deliveryFee)}
                        </dd>
                      </div>
                      <div className="mt-1.5 flex justify-between border-t border-border-default pt-3">
                        <dt className="text-label-md font-semibold text-text-primary">Total</dt>
                        <dd className="tnum font-display text-price-lg font-bold text-text-primary">{formatNaira(totals.total)}</dd>
                      </div>
                    </dl>

                    {freeDeliveryGap > 0 && (
                      <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-3 py-2 text-body-sm text-orange-700 dark:text-orange-400">
                        <span className="text-[12px]">Add {formatNaira(freeDeliveryGap)} more for free delivery</span>
                      </p>
                    )}

                    <Button to="/checkout" size="lg" className="mt-4 w-full" onClick={closeCart}>
                      <ArrowRight size={16} aria-hidden="true" /> Proceed to checkout
                    </Button>
                    <Link to="/shop" className="mt-3 block text-center text-label-md font-medium text-text-secondary transition-colors hover:text-primary" onClick={closeCart}>
                      Continue shopping
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-[90] bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={closeCart} aria-hidden="true" />
      )}
    </>
  )
}
