import { Link } from 'react-router-dom'
import { FileText, Clock } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'

export default function Terms() {
  return (
    <>
    <SEO title="Terms of Service | SavorBite" description="SavorBite terms of service for ordering food delivery in Lagos." path="/terms" />
    <div className="container-page py-8 max-w-3xl">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">Terms of Service</h1>
      <p className="mb-4 text-body-md text-text-tertiary rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
        Draft: have a professional review before launch. Not legal advice.
      </p>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <FileText size={18} className="text-primary" aria-hidden="true" />
          Using the site
        </h2>
        <p className="text-body-md text-text-secondary">
          By placing an order on SavorBite, you agree to these terms. Orders are subject to availability and
          confirmation by the kitchen. Prices are in Nigerian Naira (₦) and include all applicable charges
          shown at checkout.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <Clock size={18} className="text-primary" aria-hidden="true" />
          Delivery
        </h2>
        <p className="text-body-md text-text-secondary">
          Delivery is available across Lekki, Victoria Island and Ikoyi. Estimated delivery times are shown at
          checkout and may vary during peak hours or due to traffic conditions.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary">Payments</h2>
        <p className="text-body-md text-text-secondary">
          Payments are processed securely through Paystack and Flutterwave. We do not store your card details.
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
