import { Link } from 'react-router-dom'
import { Clock, Mail, MapPin, Phone } from 'lucide-react'
import { SavorBiteLogo } from './Logo.jsx'
import { BUSINESS } from '../data/site.js'

const exploreLinks = [
  { label: 'Home', to: '/' },
  { label: 'Shop the menu', to: '/shop' },
  { label: 'My orders', to: '/orders' },
  { label: 'About us', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'My account', to: '/account' },
]

const legalLinks = [
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
  { label: 'Refund & Cancellation', to: '/refunds' },
  { label: 'Delivery Policy', to: '/delivery' },
]

export function Footer() {
  return (
    <footer className="mt-8 bg-charcoal dark:bg-surface-container-low border-t border-border-subtle md:block">
      <div className="container-page grid grid-cols-2 gap-10 py-14 lg:grid-cols-4">
        <div>
          <SavorBiteLogo className="h-10 w-10 showWordmark" wordmarkClassName="!text-white" />
          <p className="mt-4 max-w-xs text-body-md leading-relaxed text-white dark:text-text-secondary">
            {BUSINESS.tagline}. Chef-crafted meals made to order and delivered across{' '}
            {BUSINESS.city} in under 30 minutes.
          </p>
          <div className="mt-5 flex gap-2">
            {BUSINESS.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="rounded-full border border-white/20 dark:border-text-tertiary/40 px-3 py-1.5 text-label-sm text-white dark:text-text-secondary transition-colors hover:border-white/40 dark:hover:text-text-primary hover:text-white"
              >
                {s.label}
              </a>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-display text-headline-sm text-white">Explore</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {exploreLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-body-md text-white dark:text-text-secondary transition-colors hover:text-white dark:hover:text-text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-headline-sm text-white">Visit & contact</h3>
          <ul className="mt-4 flex flex-col gap-3 text-body-md text-white dark:text-text-secondary">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary dark:text-primary" aria-hidden="true" />
              {BUSINESS.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-primary dark:text-primary" aria-hidden="true" />
              <a href={BUSINESS.phoneHref} className="transition-colors hover:text-white dark:hover:text-text-primary">
                {BUSINESS.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-primary dark:text-primary" aria-hidden="true" />
              <a href={BUSINESS.emailHref} className="transition-colors hover:text-white dark:hover:text-text-primary">
                {BUSINESS.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-primary dark:text-primary" aria-hidden="true" />
              <span>
                {BUSINESS.hours.map((h) => (
                  <span key={h.day} className="block">
                    {h.day}: {h.time}
                  </span>
                ))}
              </span>
            </li>
          </ul>
          <div className="mt-5 rounded-xl border border-white/10 dark:border-text-tertiary/20 bg-white/5 dark:bg-text-primary/5 p-4">
            <p className="text-label-md text-white">Payments accepted</p>
            <p className="mt-1 text-body-sm text-white/80 dark:text-text-tertiary">Paystack · Flutterwave · Cash on delivery</p>
            <Link
              to="/admin/login"
              className="mt-3 inline-block text-label-sm font-semibold text-primary transition-colors hover:text-orange-400 dark:hover:text-orange-400"
            >
              Admin dashboard →
            </Link>
          </div>
        </div>

        <div>
          <h3 className="font-display text-headline-sm text-white">Legal</h3>
          <ul className="mt-4 flex flex-col gap-2.5">
            {legalLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.to}
                  className="text-body-md text-white dark:text-text-secondary transition-colors hover:text-white dark:hover:text-text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 dark:border-text-tertiary/20">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-body-sm text-white/70 dark:text-text-tertiary sm:flex-row">
          <p>© 2026 SavorBite Foods Ltd. All rights reserved.</p>
          <p>Fast, fresh and securely paid — built with React &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  )
}
