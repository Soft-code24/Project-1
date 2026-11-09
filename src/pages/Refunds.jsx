import { Link } from 'react-router-dom'
import { RotateCcw, Truck } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'

export default function Refunds() {
  return (
    <>
    <SEO title="Refund & Cancellation Policy | SavorBite" description="SavorBite refund and cancellation policy for food delivery orders." path="/refunds" />
    <div className="container-page py-8 max-w-3xl">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">Refund & Cancellation Policy</h1>
      <p className="mb-4 text-body-md text-text-tertiary rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
        Draft: have a professional review before launch. Not legal advice.
      </p>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <RotateCcw size={18} className="text-primary" aria-hidden="true" />
          Cancelling an order
        </h2>
        <p className="text-body-md text-text-secondary">
          You can request to cancel your order before it is marked &ldquo;Out for delivery&rdquo;. Contact us
          at hello@savorbite.ng with your order number. Once an order is out for delivery, it cannot be cancelled.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <Truck size={18} className="text-primary" aria-hidden="true" />
          Refunds
        </h2>
        <p className="text-body-md text-text-secondary">
          If your order is cancelled before delivery, any prepaid amount will be refunded to your original
          payment method within 5–10 business days, depending on your bank or payment provider.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary">Incorrect or missing items</h2>
        <p className="text-body-md text-text-secondary">
          If your order arrives with missing or incorrect items, contact us within 24 hours of delivery with
          your order number and photos. We will arrange a redelivery or refund for the affected items.
        </p>
      </section>

      <div className="mt-8 flex flex-col gap-2 sm:flex-row">
        <Link to="/" className="text-label-md font-medium text-primary hover:underline">
          Back to home
        </Link>
      </div>
    </div>
    </>
  )
}
