import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin, HelpCircle, Ticket, ChevronDown, Clock } from 'lucide-react'
import { api } from '../lib/api.js'
import { useToast } from '../context/ToastContext.jsx'
import { useBusinessSettings } from '../context/BusinessSettingsContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { SEO } from '../components/SEO.jsx'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const faqs = [
  {
    q: 'How long does delivery take?',
    a: 'Most orders are delivered within 30 minutes across Lekki, Victoria Island and Ikoyi. Delivery time may vary during peak hours.',
  },
  {
    q: 'Can I track my order?',
    a: 'Yes. Once your order is confirmed, you can track its status from the My Orders page or the order confirmation screen.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept card payments and bank transfers via Paystack and Flutterwave, as well as cash on delivery in select areas.',
  },
  {
    q: 'How do I cancel or get a refund?',
    a: 'You can request a cancellation before your order is marked "Out for delivery". Refunds are processed back to your original payment method within 5–10 business days. See our Refund & Cancellation policy.',
  },
  {
    q: 'Do you cater for events?',
    a: 'Yes. For bulk and catering orders, email us at hello@savorbite.ng with your requirements.',
  },
]

export default function Support() {
  const { showToast } = useToast()
  const { settings } = useBusinessSettings()
  const phone = settings?.contact_phone || '+234 801 234 5678'
  const email = settings?.contact_email || 'hello@savorbite.ng'
  const phoneHref = settings?.contact_phone ? `tel:${settings.contact_phone}` : 'tel:+2348012345678'
  const emailHref = settings?.contact_email ? `mailto:${settings.contact_email}` : 'mailto:hello@savorbite.ng'
  const address = settings?.address || '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria'
  const hours = settings?.hours || []
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [openFaq, setOpenFaq] = useState(new Set())

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!emailPattern.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.subject.trim()) next.subject = 'Enter a subject.'
    if (!form.message.trim() || form.message.trim().length < 5) next.message = 'Please write a message (5+ characters).'
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    try {
      await api.createTicket({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      })
      setSent(true)
      setForm({ name: '', email: '', subject: '', message: '' })
      showToast('Message sent — we will reply shortly!', 'success')
    } catch (err) {
      showToast(err.message || 'Could not send your message. Please try again.', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleFaq = (index) => {
    setOpenFaq((prev) => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (sent) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-md animate-slide-up rounded-2xl border border-border-subtle bg-surface p-6 text-center shadow-card sm:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Ticket size={34} aria-hidden="true" />
          </div>
          <h1 className="mt-5 font-display text-headline-lg text-text-primary">Message sent!</h1>
          <p className="mt-2 text-body-md text-text-secondary">
            We’ve received your message and will get back to you shortly at {form.email}.
          </p>
          <Button to="/support" size="lg" className="mt-6 w-full" onClick={() => setSent(false)}>
            Send another message
          </Button>
          <Button to="/" variant="secondary" size="lg" className="mt-3 w-full">
            Back to home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
    <SEO title="Customer Support | SavorBite" description="Get help with your SavorBite order. FAQ, WhatsApp, phone, email and support tickets." path="/support" />
    <div className="container-page py-6">
      <h1 className="mb-1 font-display text-headline-lg text-text-primary">Customer Support</h1>
      <p className="mb-6 text-body-md text-text-secondary">
        Questions about an order, catering, or partnerships? Our team replies within a few hours.
      </p>

      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        {/* Support form */}
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
            <HelpCircle size={18} className="text-primary" aria-hidden="true" />
            Send a message
          </h2>

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Full name" htmlFor="support-name" error={errors.name} required>
              <input
                id="support-name"
                type="text"
                placeholder="Adaeze Okafor"
                className={controlClass(errors.name)}
                value={form.name}
                onChange={setField('name')}
              />
            </Field>
            <Field label="Email address" htmlFor="support-email" error={errors.email} required>
              <input
                id="support-email"
                type="email"
                placeholder="you@example.com"
                className={controlClass(errors.email)}
                value={form.email}
                onChange={setField('email')}
              />
            </Field>
            <Field label="Subject" htmlFor="support-subject" error={errors.subject} required className="sm:col-span-2">
              <input
                id="support-subject"
                type="text"
                placeholder="Order question, catering, feedback…"
                className={controlClass(errors.subject)}
                value={form.subject}
                onChange={setField('subject')}
              />
            </Field>
            <Field
              label="Message"
              htmlFor="support-message"
              error={errors.message}
              required
              hint="5+ characters"
              className="sm:col-span-2"
            >
              <textarea
                id="support-message"
                rows={5}
                placeholder="How can we help?"
                className={controlClass(errors.message)}
                value={form.message}
                onChange={setField('message')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg" disabled={submitting}>
                {submitting ? 'Sending…' : 'Send message'}
              </Button>
            </div>
          </form>
        </section>

        {/* Contact info + FAQ */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
              <HelpCircle size={18} className="text-primary" aria-hidden="true" />
              Get in touch
            </h2>
            <ul className="mt-4 flex flex-col gap-4 text-body-md text-text-secondary">
              <li className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shrink-0">
                  <MapPin size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-text-primary">Visit us</p>
                  <p>{address}</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shrink-0">
                  <Phone size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-text-primary">Call us</p>
                  <a href={phoneHref} className="text-primary hover:underline">{phone}</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shrink-0">
                  <Mail size={18} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-text-primary">Email us</p>
                  <a href={emailHref} className="text-primary hover:underline">{email}</a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shrink-0">
                  <Phone size={18} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-text-primary">WhatsApp</p>
                  <a href={`https://wa.me/${phone.replace('+', '')}`} className="text-primary hover:underline">
                    Chat on WhatsApp
                  </a>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary shrink-0">
                  <Clock size={18} className="text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-label-sm font-semibold text-text-primary">Opening hours</p>
                  {hours.map((h) => (
                    <p key={h.day} className="text-text-secondary">
                      {h.day}: {h.time}
                    </p>
                  ))}
                </div>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
            <h2 className="font-display text-headline-md text-text-primary">FAQ</h2>
            <ul className="mt-4 flex flex-col gap-2">
              {faqs.map((faq, i) => {
                const isOpen = openFaq.has(i)
                return (
                  <li key={i} className="border-b border-border-subtle last:border-0 pb-3">
                    <button
                      type="button"
                      onClick={() => toggleFaq(i)}
                      aria-expanded={isOpen}
                      className="flex items-center justify-between w-full text-left text-label-md font-semibold text-text-primary"
                    >
                      {faq.q}
                      <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>
                    {isOpen && (
                      <p className="mt-2 text-body-sm text-text-secondary">{faq.a}</p>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
