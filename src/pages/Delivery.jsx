import { Link } from 'react-router-dom'
import { Truck, MapPin } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'
import { BUSINESS } from '../data/site.js'

export default function Delivery() {
  return (
    <>
    <SEO title="Delivery Policy | SavorBite" description="SavorBite delivery areas, times and fees for food delivery in Lagos." path="/delivery" />
    <div className="container-page py-8 max-w-3xl">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">Delivery Policy</h1>
      <p className="mb-4 text-body-md text-text-tertiary rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
        Draft: have a professional review before launch. Not legal advice.
      </p>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <MapPin size={18} className="text-primary" aria-hidden="true" />
          Delivery areas
        </h2>
        <p className="text-body-md text-text-secondary">
          We deliver across Lekki, Victoria Island and Ikoyi. Enter your address at checkout to confirm
          availability for your location.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <Truck size={18} className="text-primary" aria-hidden="true" />
          Delivery times
        </h2>
        <p className="text-body-md text-text-secondary">
          Orders are typically delivered within 30 minutes of confirmation. Delivery may take longer during
          peak hours, bad weather, or high order volume. You can track your order from the My Orders page.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary">Delivery fee</h2>
        <p className="text-body-md text-text-secondary">
          A delivery fee of ₦1,500 applies to all orders. Delivery is free for orders of ₦20,000 or more.
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
