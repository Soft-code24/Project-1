import { useState } from 'react'
import { Clock, Mail, MapPin, MessageSquare, Phone, Send } from 'lucide-react'
import { useBusinessSettings } from '../context/BusinessSettingsContext.jsx'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Field, controlClass } from '../components/ui/Form.jsx'
import { api } from '../lib/api.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contact() {
  const { showToast } = useToast()
  const { settings } = useBusinessSettings()
  const address = settings?.address || '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria'
  const phone = settings?.contact_phone || '+234 801 234 5678'
  const email = settings?.contact_email || 'hello@savorbite.ng'
  const emailHref = settings?.contact_email ? `mailto:${settings.contact_email}` : 'mailto:hello@savorbite.ng'
  const hours = settings?.hours || []

  const contactCards = [
    { icon: MapPin, title: 'Visit us', lines: [address] },
    { icon: Phone, title: 'Call us', lines: [phone, email] },
    { icon: Clock, title: 'Opening hours', lines: hours.map((h) => `${h.day}: ${h.time}`) },
  ]

  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [errors, setErrors] = useState({})
  const [sent, setSent] = useState(false)

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!emailPattern.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (!form.subject.trim()) next.subject = 'Enter a subject.'
    if (!form.message.trim() || form.message.trim().length < 10)
      next.message = 'Tell us a little more (10+ characters).'
    setErrors(next)
    if (Object.keys(next).length > 0) return
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
      showToast(err.message || 'Could not send message. Please try again.', 'error')
    }
  }

  return (
    <div className="container-page py-6">
      <h1 className="font-display text-headline-lg text-text-primary">Contact Us</h1>
      <p className="mt-1.5 mb-6 text-body-md text-text-secondary">
        Questions about an order, catering, or partnerships? Our team replies within a few hours.
      </p>

      <div className="grid gap-6 lg:grid-cols-[7fr_5fr] lg:items-start">
        {/* Form */}
        <section className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-headline-md text-text-primary">
            <MessageSquare size={18} className="text-primary" aria-hidden="true" />
            Send a message
          </h2>

          {sent && (
            <p className="mt-4 rounded-lg bg-emerald-50 px-3.5 py-2.5 text-body-md text-emerald-700">
              Thanks for reaching out! We’ve received your message and will get back to you shortly.
            </p>
          )}

          <form onSubmit={handleSubmit} className="mt-4 grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Full name" htmlFor="contact-name" error={errors.name} required>
              <input
                id="contact-name"
                type="text"
                placeholder="Adaeze Okafor"
                className={controlClass(errors.name)}
                value={form.name}
                onChange={setField('name')}
              />
            </Field>
            <Field label="Email address" htmlFor="contact-email" error={errors.email} required>
              <input
                id="contact-email"
                type="email"
                placeholder="you@example.com"
                className={controlClass(errors.email)}
                value={form.email}
                onChange={setField('email')}
              />
            </Field>
            <Field label="Subject" htmlFor="contact-subject" className="sm:col-span-2">
              <input
                id="contact-subject"
                type="text"
                placeholder="Order question, catering, feedback…"
                className={controlClass(false)}
                value={form.subject}
                onChange={setField('subject')}
              />
            </Field>
            <Field
              label="Message"
              htmlFor="contact-message"
              error={errors.message}
              required
              className="sm:col-span-2"
            >
              <textarea
                id="contact-message"
                rows={5}
                placeholder="How can we help?"
                className={controlClass(errors.message)}
                value={form.message}
                onChange={setField('message')}
              />
            </Field>
            <div className="sm:col-span-2">
              <Button type="submit" size="lg">
                <Send size={15} aria-hidden="true" />
                Send message
              </Button>
            </div>
          </form>
        </section>

        {/* Info */}
        <div className="flex flex-col gap-3">
          {contactCards.map((card) => (
            <div key={card.title} className="rounded-2xl border border-border-subtle bg-surface p-5 shadow-card">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-primary">
                  <card.icon size={18} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-label-md font-semibold text-text-primary">{card.title}</h2>
                  {card.lines.map((line) => (
                    <p key={line} className="text-body-md text-text-secondary">
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}

          <div className="relative overflow-hidden rounded-2xl bg-surface-container p-0 shadow-card">
            <div
              className="flex h-40 flex-col items-center justify-center gap-2 bg-surface-container dark:bg-surface-container-high"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(45deg, #edeeef 0 12px, #e7e8e9 12px 24px)',
              }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-card">
                <MapPin size={20} aria-hidden="true" />
              </span>
              <p className="text-label-md font-semibold text-text-primary">Lekki Phase 1, Lagos</p>
              <p className="text-body-sm text-text-secondary">Serving Lekki · VI · Ikoyi</p>
            </div>
          </div>

          <div className="rounded-2xl bg-charcoal p-5 text-white">
            <h2 className="font-display text-headline-sm">Bulk and catering orders</h2>
            <p className="mt-1.5 text-body-md text-text-tertiary">
              Feeding a team or hosting an event? Email us for custom menus and pricing.
            </p>
            <a
              href={emailHref}
              className="mt-3 inline-flex items-center gap-1.5 text-label-md font-semibold text-primary hover:text-orange-400"
            >
              <Mail size={15} aria-hidden="true" />
              {email}
            </a>
        </div>
      </div>
    </div>
  </div>
  )
}
