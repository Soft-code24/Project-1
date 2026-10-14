import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, Loader2, Lock, Receipt, ShoppingBag, Truck } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useOrders } from '../context/OrderContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { computeTotals, isValidPromo } from '../lib/cartTotals.js'
import { formatNaira, formatDateTime } from '../lib/currency.js'
import { PAYMENT_METHODS } from '../data/orders.js'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Checkout() {
  const { detailedItems, subtotal, clearCart } = useCart()
  const { placeOrder } = useOrders()
  const { user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Lagos',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [method, setMethod] = useState('paystack-card')
  const [promoInput, setPromoInput] = useState('')
  const [promoApplied, setPromoApplied] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [placed, setPlaced] = useState(null)

  const totals = computeTotals(subtotal, promoApplied)

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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      showToast('Please complete the required fields.', 'error')
      return
    }
    setProcessing(true)
    // Prototype payment flow: a real integration hands off to Paystack/Flutterwave
    // and verifies the transaction server-side before the order is marked paid.
    window.setTimeout(() => {
      const order = placeOrder({
        items: detailedItems,
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
        paymentMethod: method,
        totals,
      })
      clearCart()
      setProcessing(false)
      setPlaced(order)
      showToast('Payment successful — order confirmed!', 'success')
    }, 1400)
  }

  // Success view
  if (placed) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-xl animate-slide-up rounded-2xl border border-border-subtle bg-white p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Order confirmed!</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            Thank you, {placed.contact.name.split(' ')[0]}. Your food is being prepared and will be on its way
            shortly.
          </p>

          <dl className="mt-6 flex flex-col gap-2.5 rounded-xl bg-page-bg p-4 text-left text-body-md">
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Order number</dt>
              <dd className="tnum font-semibold text-text-primary">{placed.id}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Placed</dt>
              <dd className="tnum text-text-primary">{formatDateTime(placed.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Status</dt>
              <dd>
                <StatusBadge status={placed.status} />
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Payment</dt>
              <dd className="tnum font-semibold text-text-primary">{formatNaira(placed.total)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-text-secondary">Delivery to</dt>
              <dd className="max-w-[60%] text-right text-text-primary">
                {placed.delivery.address}, {placed.delivery.city}
              </dd>
            </div>
          </dl>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <Button to="/orders" size="lg" className="flex-1">
              <Receipt size={16} aria-hidden="true" />
              Track my order
            </Button>
            <Button to="/shop" variant="secondary" size="lg" className="flex-1" onClick={() => navigate('/shop')}>
              Continue shopping
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (detailedItems.length === 0) {
    return (
      <div className="container-page py-10">
        <h1 className="mb-6 font-display text-headline-lg text-text-primary">Checkout</h1>
        <EmptyState
          icon={ShoppingBag}
          title="Nothing to check out"
          description="Your cart is empty. Add a few dishes first and come back to complete your order."
          action={<Button to="/shop">Browse the menu</Button>}
        />
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
          {/* Contact & delivery */}
          <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
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

          {/* Payment */}
          <section className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
              <CreditCard size={18} className="text-primary" aria-hidden="true" />
              Payment method
            </h2>
            <div
              className="mt-4 flex flex-col gap-2.5"
              role="radiogroup"
              aria-label="Payment method"
            >
              {PAYMENT_METHODS.map((option) => {
                const selected = method === option.id
                return (
                  <label
                    key={option.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                      selected
                        ? 'border-primary bg-orange-50'
                        : 'border-border-default bg-white hover:border-border-strong'
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
            <p className="mt-3 flex items-center gap-1.5 text-body-sm text-text-tertiary">
              <Lock size={13} aria-hidden="true" />
              Your payment details are encrypted and processed securely. Card and transfer payments are
              verified before the kitchen accepts the order.
            </p>
          </section>
        </div>

        {/* Summary */}
        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
            <h2 className="font-display text-headline-md text-text-primary">Order Summary</h2>
            <ul className="mt-4 flex flex-col gap-3 border-b border-border-subtle pb-4">
              {detailedItems.map(({ product, qty, lineTotal }) => (
                <li key={product.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-container-low">
                    <img src={product.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-body-md text-text-primary">
                    {product.name}
                    <span className="tnum ml-1.5 text-text-tertiary">× {qty}</span>
                  </span>
                  <span className="tnum text-label-md font-semibold text-text-primary">
                    {formatNaira(lineTotal)}
                  </span>
                </li>
              ))}
            </ul>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (isValidPromo(promoInput)) {
                  setPromoApplied(true)
                  showToast('Promo code applied — 20% off!', 'success')
                } else {
                  setPromoApplied(false)
                  showToast('That promo code is not valid.', 'error')
                }
              }}
              className="mt-4 flex gap-2"
            >
              <input
                type="text"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                placeholder="Promo code"
                aria-label="Promo code"
                className="w-full rounded-lg border border-border-strong bg-white px-3.5 py-2 text-body-md text-text-primary placeholder:text-text-tertiary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button type="submit" variant="secondary" className="shrink-0">
                Apply
              </Button>
            </form>

            <dl className="mt-4 flex flex-col gap-2.5 text-body-md">
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
              {promoApplied && (
                <div className="flex justify-between">
                  <dt className="text-emerald-700">Discount (SAVOR20)</dt>
                  <dd className="tnum font-semibold text-emerald-700">−{formatNaira(totals.discount)}</dd>
                </div>
              )}
              <div className="mt-1.5 flex items-baseline justify-between border-t border-border-default pt-3">
                <dt className="text-label-md font-semibold text-text-primary">Total</dt>
                <dd className="tnum font-display text-price-lg font-bold text-text-primary">
                  {formatNaira(totals.total)}
                </dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Processing payment…
                </>
              ) : (
                <>
                  <Lock size={15} aria-hidden="true" />
                  Pay {formatNaira(totals.total)}
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
          </div>
        </div>
      </form>
    </div>
  )
}
