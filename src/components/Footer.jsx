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

export function Footer() {
  return (
    <footer className="mt-8 hidden bg-charcoal text-gray-300 md:block">
      <div className="container-page grid grid-cols-2 gap-10 py-14 lg:grid-cols-4">
        <div>
          <SavorBiteLogo className="h-10 w-10" showWordmark wordmarkClassName="!text-white" />
          <p className="mt-4 max-w-xs text-body-md leading-relaxed text-gray-400">
            {BUSINESS.tagline}. Chef-crafted meals made to order and delivered across{' '}
            {BUSINESS.city} in under 30 minutes.
          </p>
          <div className="mt-5 flex gap-2">
            {BUSINESS.socials.map((s) => (
              <a
                key={s.label}
                href={s.href}
                className="rounded-full border border-white/15 px-3 py-1.5 text-label-sm text-gray-300 transition-colors hover:border-white/40 hover:text-white"
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
                <Link to={link.to} className="text-body-md text-gray-400 transition-colors hover:text-white">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-headline-sm text-white">Visit & contact</h3>
          <ul className="mt-4 flex flex-col gap-3 text-body-md text-gray-400">
            <li className="flex items-start gap-2.5">
              <MapPin size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              {BUSINESS.address}
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={16} className="shrink-0 text-primary" aria-hidden="true" />
              <a href={BUSINESS.phoneHref} className="transition-colors hover:text-white">
                {BUSINESS.phone}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={16} className="shrink-0 text-primary" aria-hidden="true" />
              <a href={BUSINESS.emailHref} className="transition-colors hover:text-white">
                {BUSINESS.email}
              </a>
            </li>
            <li className="flex items-start gap-2.5">
              <Clock size={16} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                {BUSINESS.hours.map((h) => (
                  <span key={h.day} className="block">
                    {h.day}: {h.time}
                  </span>
                ))}
              </span>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="font-display text-headline-sm text-white">Kitchen hours</h3>
          <p className="mt-4 text-body-md text-gray-400">
            The kitchen accepts orders while stock lasts. Delivery is currently available within Lekki,
            Victoria Island and Ikoyi.
          </p>
          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-label-md text-white">Payments accepted</p>
            <p className="mt-1 text-body-sm text-gray-400">Paystack · Flutterwave · Cash on delivery</p>
            <Link
              to="/admin/login"
              className="mt-3 inline-block text-label-sm font-semibold text-primary transition-colors hover:text-orange-400"
            >
              Admin dashboard →
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-body-sm text-gray-500 sm:flex-row">
          <p>© 2026 SavorBite Foods Ltd. All rights reserved.</p>
          <p>Fast, fresh and securely paid — built with React &amp; Tailwind CSS.</p>
        </div>
      </div>
    </footer>
  )
}
