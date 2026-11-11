import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, Loader2, Lock, Receipt, Truck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useBusinessSettings } from '../context/BusinessSettingsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import { formatNaira } from '../lib/currency.js'
import { computeTotals, isValidPromo } from '../lib/cartTotals.js'
import { FEATURES } from '../lib/featureFlags.js'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

const emailPattern = /^[^\s@]+@\S+\.\S+$/

export default function Checkout() {
  const { user, isLoading } = useAuth()
  const { detailedItems, subtotal, clearCart } = useCart()
  const { settings } = useBusinessSettings()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParamsIfAvailable()

  // Checkout attempt ID — stable across retries of the same attempt,
  // regenerated for a new purchase. Stored in sessionStorage so a page
  // reload during retry doesn't lose it.
  const [attemptId, setAttemptId] = useState(null)
  useEffect(() => {
    let stored = sessionStorage.getItem('savorbite:checkout:attemptId')
    if (!stored) {
      stored = crypto.randomUUID()
      sessionStorage.setItem('savorbite:checkout:attemptId', stored)
    }
    setAttemptId(stored)
  }, [])

  // Clear the attempt when the cart changes (new purchase)
  useEffect(() => {
    if (detailedItems.length > 0) {
      // Cart has items — keep current attempt
      return
    }
    // Cart emptied — next checkout starts a fresh attempt
    sessionStorage.removeItem('savorbite:checkout:attemptId')
    setAttemptId(null)
  }, [detailedItems.length])

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Lagos',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [method, setMethod] = useState('cod')
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoError, setPromoError] = useState('')
  const [promoValidating, setPromoValidating] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [placed, setPlaced] = useState(null)

  // Online payments require configured provider keys. Staging has no real
  // Paystack/Flutterwave credentials, so only Cash on delivery is available.
  const isOnlinePaymentAvailable = Boolean(import.meta.env.VITE_PAYSTACK_PUBLIC_KEY)

  // --- Payment return from Paystack (callback URL) ---
  useEffect(() => {
    const ref = searchParams?.get('reference')
    if (ref && !verifying && !placed) {
      handleVerifyReturn(ref)
    }
  }, [searchParams, verifying, placed])

  const deliveryFee = settings?.delivery_fee ?? 1500
  const freeDeliveryThreshold = settings?.free_delivery_threshold ?? 20000

  // Revalidate coupon when cart contents change (items OR quantities)
  const cartHash = JSON.stringify(detailedItems.map((i) => ({ id: i.product.id, qty: i.qty })))
  useEffect(() => {
    if (promoCode && FEATURES.couponValidation) {
      // Cart changed — clear applied promo until revalidated
      setPromoApplied(false)
      setPromoDiscount(0)
      setPromoError('')
    }
  }, [cartHash, promoCode])

  const useCouponValidation = FEATURES.couponValidation

  const totals = computeTotals(subtotal, promoApplied, { deliveryFee, freeDeliveryThreshold })

  // When using API validation, use the actual discount from the server
  const effectiveDiscount = useCouponValidation ? promoDiscount : totals.discount
  const effectiveTotal = subtotal + totals.deliveryFee - effectiveDiscount
  const freeDeliveryGap = Math.max(0, freeDeliveryThreshold - subtotal)

  if (isLoading) {
    return (
      <div className="container-page py-20 flex items-center justify-center">
        <p className="text-body-md text-text-secondary">Loading session…</p>
      </div>
    )
  }

  if (!user) {
    navigate('/login?next=/checkout', { replace: true })
    return null
  }

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const validate = () => {
    const next = {}
    if (!form.name.trim()) next.name = 'Enter the name for this order.'
    if (!emailPattern.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.phone.trim().length < 7) next.phone = 'Enter a reachable phone number.'
    if (!form.address.trim()) next.address = 'Enter a delivery address.'
    if (!form.city.trim()) next.city = 'Enter your city or area.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const removePromo = () => {
    setPromoInput('')
    setPromoCode('')
    setPromoApplied(false)
    setPromoDiscount(0)
    setPromoError('')
  }

  const applyPromo = async (e) => {
    e.preventDefault()
    const code = promoInput.trim()
    if (!code) return

    if (!FEATURES.couponValidation) {
      // Legacy SAVOR20 path
      if (isValidPromo(code)) {
        setPromoCode(code)
        setPromoApplied(true)
        setPromoError('')
        showToast('Promo code applied — 20% off!', 'success')
      } else {
        setPromoApplied(false)
        setPromoError('That promo code is not valid.')
        showToast('That promo code is not valid.', 'error')
      }
      return
    }

    // New API validation path
    setPromoValidating(true)
    setPromoError('')
    try {
      const items = detailedItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.qty,
      }))
      const data = await api.validateCoupon(code, items)
      if (data.valid) {
        setPromoCode(code)
        setPromoDiscount(data.discount)
        setPromoApplied(true)
        setPromoError('')
        showToast(data.message || 'Coupon applied.', 'success')
      } else {
        setPromoApplied(false)
        setPromoError(data.message || 'That coupon is not valid.')
        showToast(data.message || 'That coupon is not valid.', 'error')
      }
    } catch (err) {
      setPromoApplied(false)
      setPromoError(err.message || 'Coupon validation failed.')
      showToast(err.message || 'Coupon validation failed.', 'error')
    } finally {
      setPromoValidating(false)
    }
  }

  // --- Payment return from Paystack (callback URL) ---
  useEffect(() => {
    const ref = searchParams?.get('reference')
    if (ref && !verifying && !placed) {
      handleVerifyReturn(ref)
    }
  }, [searchParams, verifying, placed])

  async function handleVerifyReturn(reference) {
    setVerifying(true)
    try {
      const data = await api.verifyPaystack(reference)
      if (data.verified && data.order) {
        clearCart()
        setPlaced(data.order)
        showToast('Payment successful — order confirmed!', 'success')
        navigate(`/order/${data.order.id}`, { replace: true })
      } else {
        showToast('Payment could not be verified. Please contact support.', 'error')
      }
    } catch (err) {
      showToast(err.message || 'Payment verification failed.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      showToast('Please complete the required fields.', 'error')
      return
    }
    if (processing || submitted) return
    setProcessing(true)
    setSubmitted(true)
    try {
      // 1. Create order on the server (prices recalculated server-side)
      const order = await api.createOrder({
        items: detailedItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.qty,
        })),
        contact: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
        },
        delivery: {
          address: form.address.trim(),
          city: form.city.trim(),
          instructions: form.notes.trim(),
        },
        payment_method: method,
        promo_code: promoCode || undefined,
        idempotencyKey: attemptId,
      })

      // 2. Cash on delivery: no payment redirect — order is placed immediately
      if (method === 'cod') {
        clearCart()
        setPlaced(order.order)
        showToast('Order placed successfully — pay the rider on delivery.', 'success')
        navigate(`/order/${order.order.id}`, { replace: true })
        return
      }

      // 3. Online payments: initialize Paystack and redirect customer to pay
      const payment = await api.initializePaystack(order.id)
      window.location.href = payment.authorization_url
    } catch (err) {
      setProcessing(false)
      setSubmitted(false)
      showToast(err.message || 'Could not place order. Please try again.', 'error')
    }
  }

  // Success view (shown briefly before redirect, or direct render)
  if (placed) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-xl animate-slide-up rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Order confirmed!</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            Thank you, {placed.contact.name.split(' ')[0]}. Redirecting to your order page…
          </p>
        </div>
      </div>
    )
  }

  if (verifying) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <Loader2 size={24} className="animate-spin" aria-hidden="true" />
        <p className="mt-3 text-body-md text-text-secondary">Verifying payment…</p>
      </div>
    )
  }

  return (
    <div className="container-page py-6">
      <h1 className="mb-1 font-display text-headline-lg text-text-primary">Checkout</h1>
      <p className="mb-6 text-body-md text-text-secondary">
        Almost there — enter your delivery details and choose how you’d like to pay.
      </p>

      <form className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-5">
          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
              <Truck size={18} className="text-primary" aria-hidden="true" />
              Delivery details
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" htmlFor="name" error={errors.name} required>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Adaeze Okafor"
                  className={controlClass(errors.name)}
                  value={form.name}
                  onChange={setField('name')}
                />
              </Field>
              <Field label="Phone number" htmlFor="phone" error={errors.phone} required>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="+234 800 000 0000"
                  className={controlClass(errors.phone)}
                  value={form.phone}
                  onChange={setField('phone')}
                />
              </Field>
              <Field label="Email address" htmlFor="email" error={errors.email} required className="sm:col-span-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={controlClass(errors.email)}
                  value={form.email}
                  onChange={setField('email')}
                />
              </Field>
              <Field label="Delivery address" htmlFor="address" error={errors.address} required className="sm:col-span-2">
                <input
                  id="address"
                  name="address"
                  type="text"
                  autoComplete="street-address"
                  placeholder="House number and street"
                  className={controlClass(errors.address)}
                  value={form.address}
                  onChange={setField('address')}
                />
              </Field>
              <Field label="City / area" htmlFor="city" error={errors.city} required>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="Lagos"
                  className={controlClass(errors.city)}
                  value={form.city}
                  onChange={setField('city')}
                />
              </Field>
              <Field label="Delivery notes" htmlFor="notes" hint="Optional">
                <input
                  id="notes"
                  name="notes"
                  type="text"
                  placeholder="Landmark or gate instructions"
                  className={controlClass(false)}
                  value={form.notes}
                  onChange={setField('notes')}
                />
              </Field>
            </div>
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
              <CreditCard size={18} className="text-primary" aria-hidden="true" />
              Payment method
            </h2>
            <div
              className="mt-4 flex flex-col gap-2.5"
              role="radiogroup"
              aria-label="Payment method"
            >
              {[
                { id: 'cod', label: 'Cash on delivery', detail: 'Pay the rider when your order arrives' },
                ...(isOnlinePaymentAvailable
                  ? [
                      { id: 'paystack-card', label: 'Card payment', detail: 'Verve, Mastercard & Visa — secured by Paystack' },
                      { id: 'paystack-transfer', label: 'Bank transfer', detail: 'Pay from any bank app — powered by Paystack' },
                      { id: 'flutterwave', label: 'Flutterwave', detail: 'Card, USSD or bank transfer via Flutterwave' },
                    ]
                  : []),
              ].map((option) => {
                const selected = method === option.id
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                      selected
                        ? 'border-primary bg-orange-50 dark:bg-orange-900/20'
                        : 'border-border-default bg-surface hover:border-border-strong'
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment-method"
                      value={option.id}
                      checked={selected}
                      onChange={() => setMethod(option.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span className="flex flex-col">
                      <span className="text-label-md font-semibold text-text-primary">{option.label}</span>
                      <span className="text-body-sm text-text-secondary">{option.detail}</span>
                    </span>
                  </label>
                )
              })}
            </div>
            {method !== 'cod' && (
              <p className="mt-3 flex items-center gap-1.5 text-body-sm text-text-tertiary">
                <Lock size={13} aria-hidden="true" />
                Your payment details are encrypted and processed securely. Card and transfer payments are
                verified before the kitchen accepts the order.
              </p>
            )}
            {!isOnlinePaymentAvailable && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-body-sm text-amber-700 dark:text-amber-400">
                <Lock size={13} aria-hidden="true" />
                Online payments are not available in staging. Cash on delivery is the only payment method.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="font-display text-headline-md text-text-primary">Order Summary</h2>
            <div className="mt-4 flex gap-2">
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code (e.g. SAVOR20)"
                aria-label="Promo code"
                className="w-full rounded-lg border border-border-strong bg-surface px-3.5 py-2 text-body-md text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={promoValidating}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={applyPromo}
                disabled={promoValidating || !promoInput.trim()}
                className="shrink-0"
              >
                {promoValidating ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                    Applying…
                  </span>
                ) : (
                  'Apply'
                )}
              </Button>
              {promoError && (
                <span className="ml-3 flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                  <X size={12} aria-hidden="true" />
                  {promoError}
                </span>
              )}
            </div>
            <ul className="mt-4 flex flex-col gap-3">
              {detailedItems.map(({ product, qty, lineTotal }) => (
                <li key={product.id} className="flex items-center gap-3">
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                    <img src={product.image} alt={product.alt} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-body-md text-text-primary">{product.name}</p>
                    <p className="tnum text-body-sm text-text-secondary">
                      {formatNaira(product.price)} × {qty}
                    </p>
                  </div>
                  <span className="tnum text-label-md font-semibold text-text-primary">
                    {formatNaira(lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-2.5 border-t border-border-default pt-4 text-body-md">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Subtotal</dt>
                <dd className="tnum font-semibold text-text-primary">{formatNaira(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Delivery</dt>
                <dd className="tnum font-semibold text-text-primary">
                  {totals.deliveryFee === 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">Free</span>
                  ) : (
                    formatNaira(totals.deliveryFee)
                  )}
                </dd>
              </div>
              {promoApplied && (
                <div className="flex justify-between">
                  <dt className="text-emerald-700 dark:text-emerald-400">
                    Discount ({promoCode || 'Promo'})
                  </dt>
                  <dd className="tnum font-semibold text-emerald-700 dark:text-emerald-400">
                    −{formatNaira(effectiveDiscount)}
                  </dd>
                </div>
              )}
              {promoApplied && (
                <button
                  type="button"
                  onClick={removePromo}
                  className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400 hover:underline"
                >
                  <X size={12} aria-hidden="true" />
                  Remove
                </button>
              )}
              <div className="mt-1.5 flex justify-between border-t border-border-default pt-3">
                <dt className="text-label-md font-semibold text-text-primary">Total</dt>
                <dd className="tnum font-display text-price-lg font-bold text-text-primary">
                  {formatNaira(effectiveTotal)}
                </dd>
              </div>
            </dl>
            {freeDeliveryGap > 0 && (
              <p className="mt-3 flex items-center gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 px-3 py-2 text-body-sm text-orange-700 dark:text-orange-400">
                <Truck size={14} aria-hidden="true" />
                Add {formatNaira(freeDeliveryGap)} more for free delivery
              </p>
            )}
            <Button type="submit" size="lg" className="mt-5 w-full" disabled={processing || !detailedItems.length}>
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Placing order…
                </>
              ) : method === 'cod' ? (
                <>
                  <Truck size={15} aria-hidden="true" />
                  Place order — pay on delivery
                </>
              ) : (
                <>
                  <Lock size={15} aria-hidden="true" />
                  Pay {formatNaira(effectiveTotal)}
                </>
              )}
            </Button>
            {!user && (
              <p className="mt-3 text-center text-body-sm text-text-secondary">
                <Link to="/login?next=/checkout" className="font-medium text-primary hover:underline">
                  Log in
                </Link>{' '}
                for faster checkout and order history.
              </p>
            )}
          </section>
        </div>
      </form>
    </div>
  )
}

function useSearchParamsIfAvailable() {
  const [params, setParams] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  })
  return [params]
}
