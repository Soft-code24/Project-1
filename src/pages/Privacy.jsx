import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, Truck, RotateCcw } from 'lucide-react'
import { Button } from '../components/ui/Button.jsx'
import { SEO } from '../components/SEO.jsx'

export default function Privacy() {
  return (
    <>
    <SEO title="Privacy Policy | SavorBite" description="SavorBite privacy policy — how we collect, use and protect your personal data." path="/privacy" />
    <div className="container-page py-8 max-w-3xl">
      <h1 className="mb-6 font-display text-headline-lg text-text-primary">Privacy Policy</h1>
      <p className="mb-4 text-body-md text-text-tertiary rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
        Draft: have a professional review before launch. Not legal advice.
      </p>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <ShieldCheck size={18} className="text-primary" aria-hidden="true" />
          What we collect
        </h2>
        <p className="text-body-md text-text-secondary">
          When you place an order or contact us, we collect your name, email address, phone number, and
          delivery address. This information is used to prepare and deliver your order and to communicate
          with you about its status.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary flex items-center gap-2">
          <Lock size={18} className="text-primary" aria-hidden="true" />
          How we use your data
        </h2>
        <p className="text-body-md text-text-secondary">
          Your personal data is used to fulfil orders, process payments (through Paystack and Flutterwave),
          and provide customer support. We do not sell your personal data to third parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="mb-3 font-display text-headline-md text-text-primary">Your rights</h2>
        <p className="text-body-md text-text-secondary">
          You may request access to, correction of, or deletion of your personal data by contacting us at
          hello@savorbite.ng.
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
