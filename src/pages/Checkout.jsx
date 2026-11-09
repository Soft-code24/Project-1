import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, CreditCard, Loader2, Lock, Receipt, Truck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { api } from '../lib/api.js'
import { formatNaira } from '../lib/currency.js'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { StatusBadge } from '../components/ui/Badges.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Checkout() {
  const { user } = useAuth()
  const { detailedItems, clearCart } = useCart()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [searchParams] = useSearchParamsIfAvailable()

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
  const [verifying, setVerifying] = useState(false)
  const [placed, setPlaced] = useState(null)

  const cartItems = [] // cart is managed server-side via orders API; kept empty placeholder

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
        // Redirect to clean confirmation page
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
    setProcessing(true)
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
        promo_code: promoInput.trim() || undefined,
      })

      // 2. Initialize Paystack transaction
      const payment = await api.initializePaystack(order.id)

      // 3. Redirect customer to Paystack to complete payment
      window.location.href = payment.authorization_url
    } catch (err) {
      setProcessing(false)
      showToast(err.message || 'Could not start checkout. Please try again.', 'error')
    }
  }

  // Success view (shown briefly before redirect, or direct render)
  if (placed) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-xl animate-slide-up rounded-2xl border border-border-subtle bg-white p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
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
              {[
                { id: 'paystack-card', label: 'Card payment', detail: 'Verve, Mastercard & Visa — secured by Paystack' },
                { id: 'paystack-transfer', label: 'Bank transfer', detail: 'Pay from any bank app — powered by Paystack' },
                { id: 'flutterwave', label: 'Flutterwave', detail: 'Card, USSD or bank transfer via Flutterwave' },
                { id: 'cod', label: 'Cash on delivery', detail: 'Pay the rider when your order arrives' },
              ].map((option) => {
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

        <div className="flex flex-col gap-3 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-border-subtle bg-white p-5 shadow-card">
            <h2 className="font-display text-headline-md text-text-primary">Order Summary</h2>
            <dl className="mt-4 flex flex-col gap-2.5 text-body-md">
              <div className="flex justify-between">
                <dt className="text-text-secondary">Subtotal</dt>
                <dd className="tnum font-semibold text-text-primary">₦0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-secondary">Delivery</dt>
                <dd className="tnum font-semibold text-text-primary">₦1,500</dd>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between border-t border-border-default pt-3">
                <dt className="text-label-md font-semibold text-text-primary">Total</dt>
                <dd className="tnum font-display text-price-lg font-bold text-text-primary">₦1,500</dd>
              </div>
            </dl>

            <Button type="submit" size="lg" className="mt-5 w-full" disabled={processing}>
              {processing ? (
                <>
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                  Starting payment…
                </>
              ) : (
                <>
                  <Lock size={15} aria-hidden="true" />
                  Pay ₦1,500
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

function useSearchParamsIfAvailable() {
  // Minimal searchParams reader without React Router dependency issues
  const [params, setParams] = useState(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      return new URLSearchParams(window.location.search)
    }
    return new URLSearchParams()
  })
  return [params]
}
