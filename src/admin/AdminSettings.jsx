import { useCallback, useEffect, useMemo, useState } from 'react'
import { Clock, MapPin, Mail, Phone, Settings, Trash2 } from 'lucide-react'
import { api } from '../lib/api.js'
import { applyBrandColors } from '../lib/brandColors.js'
import { useToast } from '../context/ToastContext.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Field, controlClass, EmptyState } from '../components/ui/Form.jsx'
import { Badge } from '../components/ui/Badges.jsx'

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

const SOCIAL_LABELS = ['Instagram', 'X', 'TikTok', 'WhatsApp']

const defaultSettings = {
  restaurant_name: 'SavorBite',
  tagline: 'Freshly crafted meals, delivered fast',
  description: '',
  logo_url: null,
  favicon_url: null,
  contact_email: 'hello@savorbite.ng',
  contact_phone: '+234 801 234 5678',
  whatsapp: '',
  address: '24 Admiralty Way, Lekki Phase 1, Lagos, Nigeria',
  city: 'Lagos, NG',
  socials: [],
  hours: [],
  delivery_available: true,
  pickup_available: true,
  delivery_fee: 1500,
  free_delivery_threshold: 20000,
  min_order_amount: 0,
  estimated_prep_time: '30 minutes',
  primary_color: '#F28C28',
  accent_color: '#3FA34D',
}

function emptyHours() {
  return DAYS.map((day) => ({ day, time: '', isClosed: false }))
}

function emptySocials() {
  return SOCIAL_LABELS.map((label) => ({ label, href: '' }))
}

function isLightColor(hex) {
  const c = hex.replace('#', '')
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6
}

export default function AdminSettings() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(defaultSettings)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState(defaultSettings)
  const [hours, setHours] = useState(emptyHours())
  const [socials, setSocials] = useState(emptySocials())
  const [errors, setErrors] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)

  useEffect(() => {
    setLoading(true)
    api.getSettings()
      .then((res) => {
        const s = res.settings || defaultSettings
        setSettings(s)
        setForm({
          restaurant_name: s.restaurant_name || defaultSettings.restaurant_name,
          tagline: s.tagline || '',
          description: s.description || '',
          contact_email: s.contact_email || '',
          contact_phone: s.contact_phone || '',
          whatsapp: s.whatsapp || '',
          address: s.address || '',
          city: s.city || defaultSettings.city,
          delivery_available: Boolean(s.delivery_available),
          pickup_available: Boolean(s.pickup_available),
          delivery_fee: String(s.delivery_fee ?? defaultSettings.delivery_fee),
          free_delivery_threshold: String(s.free_delivery_threshold ?? defaultSettings.free_delivery_threshold),
          min_order_amount: String(s.min_order_amount ?? defaultSettings.min_order_amount),
          estimated_prep_time: s.estimated_prep_time || defaultSettings.estimated_prep_time,
          primary_color: s.primary_color || defaultSettings.primary_color,
          accent_color: s.accent_color || defaultSettings.accent_color,
        })
        setHours(
          Array.isArray(s.hours) && s.hours.length
            ? s.hours.map((h) => ({ day: h.day || '', time: h.time || '', isClosed: Boolean(h.isClosed) }))
            : emptyHours(),
        )
        setSocials(
          Array.isArray(s.socials) && s.socials.length
            ? s.socials.map((soc) => ({ label: soc.label || '', href: soc.href || '' }))
            : emptySocials(),
        )
        if (s.primary_color) {
          applyBrandColors(s.primary_color, s.accent_color || defaultSettings.accent_color)
        }
      })
      .catch(() => {
        // Settings table not yet applied; storefront/admin falls back to defaults.
      })
      .finally(() => setLoading(false))
  }, [])

  const setField = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleFaviconChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setFaviconFile(file)
    setFaviconPreview(URL.createObjectURL(file))
  }

  const clearLogo = () => {
    setLogoFile(null)
    setLogoPreview(null)
    setForm((prev) => ({ ...prev, logo_url: '' }))
  }

  const clearFavicon = () => {
    setFaviconFile(null)
    setFaviconPreview(null)
    setForm((prev) => ({ ...prev, favicon_url: '' }))
  }

  const validateForm = () => {
    const next = {}
    if (!form.restaurant_name.trim()) next.restaurant_name = 'Enter a restaurant name.'
    if (form.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim()))
      next.contact_email = 'Enter a valid email address.'
    if (!Number.isFinite(Number(form.delivery_fee)) || Number(form.delivery_fee) < 0)
      next.delivery_fee = 'Enter a valid delivery fee.'
    if (!Number.isFinite(Number(form.free_delivery_threshold)) || Number(form.free_delivery_threshold) < 0)
      next.free_delivery_threshold = 'Enter a valid free delivery threshold.'
    if (!Number.isFinite(Number(form.min_order_amount)) || Number(form.min_order_amount) < 0)
      next.min_order_amount = 'Enter a valid minimum order amount.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const buildHoursPayload = useCallback(() => {
    return hours
      .filter((h) => h.day)
      .map((h) => ({ day: h.day, time: h.isClosed ? 'Closed' : h.time, isClosed: h.isClosed }))
  }, [hours])

  const buildSocialsPayload = useCallback(() => {
    return socials.filter((s) => s.label && s.href)
  }, [socials])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setSaving(true)
    try {
      // Upload new logo/favicon first so we have public URLs for the settings row.
      let logoUrl = form.logo_url || null
      let faviconUrl = form.favicon_url || null

      const uploads = []
      if (logoFile) uploads.push(api.uploadSettingsLogo(logoFile).then((r) => { logoUrl = r.logoUrl }))
      if (faviconFile) uploads.push(api.uploadSettingsLogo(faviconFile).then((r) => { faviconUrl = r.logoUrl }))
      await Promise.all(uploads)

      const payload = {
        restaurant_name: form.restaurant_name.trim(),
        tagline: form.tagline.trim(),
        description: form.description.trim(),
        ...(form.contact_email.trim() ? { contact_email: form.contact_email.trim() } : {}),
        ...(form.contact_phone.trim() ? { contact_phone: form.contact_phone.trim() } : {}),
        ...(form.whatsapp.trim() ? { whatsapp: form.whatsapp.trim() } : {}),
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        city: form.city.trim(),
        delivery_available: form.delivery_available,
        pickup_available: form.pickup_available,
        delivery_fee: Number(form.delivery_fee),
        free_delivery_threshold: Number(form.free_delivery_threshold),
        min_order_amount: Number(form.min_order_amount),
        estimated_prep_time: form.estimated_prep_time.trim(),
        primary_color: form.primary_color,
        accent_color: form.accent_color,
        ...(logoUrl ? { logo_url: logoUrl } : {}),
        ...(faviconUrl ? { favicon_url: faviconUrl } : {}),
        hours,
        socials,
      }

      const res = await api.updateSettings(payload)
      const saved = res.settings || {}
      setSettings(saved)
      setForm((prev) => ({ ...prev, logo_url: saved.logo_url ?? '', favicon_url: saved.favicon_url ?? '' }))
      setLogoFile(null)
      setFaviconFile(null)
      if (saved.primary_color) {
        applyBrandColors(saved.primary_color, saved.accent_color || defaultSettings.accent_color)
      }
      showToast('Settings saved', 'success')
    } catch (err) {
      showToast(err.message || 'Failed to save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const primaryContrastWarning = useMemo(() => isLightColor(form.primary_color), [form.primary_color])

  if (loading) {
    return (
      <div className="container-page py-20 flex flex-col items-center justify-center">
        <Settings size={28} className="mb-3 text-text-tertiary" aria-hidden="true" />
        <p className="text-body-md text-text-secondary">Loading settings…</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-headline-lg text-text-primary">Restaurant settings</h1>
          <p className="mt-1 text-body-md text-text-secondary">
            Manage your restaurant identity, branding and ordering preferences. Changes apply to the storefront.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="hidden" />
      </div>

      <form onSubmit={handleSave} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Business identity */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Business identity</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Restaurant name" htmlFor="s-name" error={errors.restaurant_name} required>
              <input
                id="s-name"
                type="text"
                placeholder="SavorBite"
                className={controlClass(errors.restaurant_name)}
                value={form.restaurant_name}
                onChange={setField('restaurant_name')}
              />
            </Field>
            <Field label="City" htmlFor="s-city">
              <input
                id="s-city"
                type="text"
                placeholder="Lagos, NG"
                className={controlClass(false)}
                value={form.city}
                onChange={setField('city')}
              />
            </Field>
            <Field label="Tagline" htmlFor="s-tagline">
              <input
                id="s-tagline"
                type="text"
                placeholder="Freshly crafted meals, delivered fast"
                className={controlClass(false)}
                value={form.tagline}
                onChange={setField('tagline')}
              />
            </Field>
            <Field label="Description" htmlFor="s-desc" className="sm:col-span-2">
              <textarea
                id="s-desc"
                rows={2}
                placeholder="A short description of your restaurant…"
                className={controlClass(false)}
                value={form.description}
                onChange={setField('description')}
              />
            </Field>
          </div>
        </section>

        {/* Contact & location */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Mail size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Contact &amp; location</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="s-email" error={errors.contact_email}>
              <input
                id="s-email"
                type="email"
                placeholder="hello@savorbite.ng"
                className={controlClass(errors.contact_email)}
                value={form.contact_email}
                onChange={setField('contact_email')}
              />
            </Field>
            <Field label="Phone" htmlFor="s-phone" error={errors.contact_phone}>
              <input
                id="s-phone"
                type="tel"
                placeholder="+234 801 234 5678"
                className={controlClass(errors.contact_phone)}
                value={form.contact_phone}
                onChange={setField('contact_phone')}
              />
            </Field>
            <Field label="WhatsApp" htmlFor="s-whatsapp">
              <input
                id="s-whatsapp"
                type="tel"
                placeholder="+234 801 234 5678"
                className={controlClass(false)}
                value={form.whatsapp}
                onChange={setField('whatsapp')}
              />
            </Field>
            <Field label="Address" htmlFor="s-address" className="sm:col-span-2">
              <input
                id="s-address"
                type="text"
                placeholder="24 Admiralty Way, Lekki Phase 1"
                className={controlClass(false)}
                value={form.address}
                onChange={setField('address')}
              />
            </Field>
          </div>
        </section>

        {/* Operating hours */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Operating hours</h2>
          </div>
          <div className="space-y-2">
            {hours.map((h, i) => (
              <div key={h.day} className="grid grid-cols-4 gap-3 items-center">
                <span className="text-body-md text-text-secondary">{h.day}</span>
                <input
                  type="text"
                  placeholder="9:00 AM – 10:00 PM"
                  value={h.time}
                  onChange={(e) => {
                    const next = [...hours]
                    next[i] = { ...next[i], time: e.target.value, isClosed: false }
                    setHours(next)
                  }}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  disabled={h.isClosed}
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = [...hours]
                    next[i] = { ...next[i], isClosed: !next[i].isClosed, time: next[i].isClosed ? '' : next[i].time }
                    setHours(next)
                  }}
                  aria-label={h.isClosed ? `Reopen ${h.day}` : `Close ${h.day}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-container"
                >
                  {h.isClosed ? <Clock size={13} className="opacity-50" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-3 text-body-sm text-text-tertiary">
            Enter each day as a single range, e.g. <span className="font-mono text-text-secondary">9:00 AM – 10:00 PM</span>. Leave blank or mark closed to hide a day.
          </p>
        </section>

        {/* Delivery & pickup */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Delivery &amp; pickup</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-border-strong accent-primary"
                checked={form.delivery_available}
                onChange={setField('delivery_available')}
              />
              <span className="text-label-md text-text-primary">Delivery available</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-border-strong accent-primary"
                checked={form.pickup_available}
                onChange={setField('pickup_available')}
              />
              <span className="text-label-md text-text-primary">Pickup available</span>
            </label>
            <Field label="Delivery fee (₦)" htmlFor="s-delivery-fee" error={errors.delivery_fee}>
              <input
                id="s-delivery-fee"
                type="number"
                min={0}
                placeholder="1500"
                className={controlClass(errors.delivery_fee)}
                value={form.delivery_fee}
                onChange={setField('delivery_fee')}
              />
            </Field>
            <Field label="Free delivery above (₦)" htmlFor="s-free-threshold" error={errors.free_delivery_threshold}>
              <input
                id="s-free-threshold"
                type="number"
                min={0}
                placeholder="20000"
                className={controlClass(errors.free_delivery_threshold)}
                value={form.free_delivery_threshold}
                onChange={setField('free_delivery_threshold')}
              />
            </Field>
            <Field label="Minimum order (₦)" htmlFor="s-min-order" error={errors.min_order_amount}>
              <input
                id="s-min-order"
                type="number"
                min={0}
                placeholder="0"
                className={controlClass(errors.min_order_amount)}
                value={form.min_order_amount}
                onChange={setField('min_order_amount')}
              />
            </Field>
            <Field label="Estimated prep time" htmlFor="s-prep-time">
              <input
                id="s-prep-time"
                type="text"
                placeholder="30 minutes"
                className={controlClass(false)}
                value={form.estimated_prep_time}
                onChange={setField('estimated_prep_time')}
              />
            </Field>
          </div>
        </section>

        {/* Branding */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Branding</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <Field label="Logo" htmlFor="s-logo" hint="JPEG, PNG, WebP, AVIF, SVG or ICO, max 5 MB">
                <div className="flex flex-col gap-3">
                  <input
                    id="s-logo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/x-icon"
                    onChange={handleLogoChange}
                    className="block w-full text-body-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                    disabled={saving}
                  />
                  {settings.logo_url || logoPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={logoPreview || settings.logo_url}
                        alt="Logo preview"
                        className="h-16 w-16 object-cover rounded-lg border border-border-subtle"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={clearLogo}
                          disabled={saving}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove logo
                        </button>
                        {logoFile && <span className="text-body-sm text-text-tertiary">New logo selected</span>}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Field>
            </div>
            <div className="lg:col-span-2">
              <Field label="Favicon" htmlFor="s-favicon" hint="SVG, PNG or ICO, max 5 MB">
                <div className="flex flex-col gap-3">
                  <input
                    id="s-favicon"
                    type="file"
                    accept="image/svg+xml,image/png,image/x-icon"
                    onChange={handleFaviconChange}
                    className="block w-full text-body-sm text-text-primary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover"
                    disabled={saving}
                  />
                  {settings.favicon_url || faviconPreview ? (
                    <div className="flex items-center gap-3">
                      <img
                        src={faviconPreview || settings.favicon_url}
                        alt="Favicon preview"
                        className="h-12 w-12 object-cover rounded border border-border-subtle"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={clearFavicon}
                          disabled={saving}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remove favicon
                        </button>
                        {faviconFile && <span className="text-body-sm text-text-tertiary">New favicon selected</span>}
                      </div>
                    </div>
                  ) : null}
                </div>
              </Field>
            </div>
            <Field label="Primary color" htmlFor="s-primary">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="s-primary"
                    type="color"
                    value={form.primary_color}
                    onChange={(e) => setField('primary_color')(e)}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-8 w-8 rounded border border-border-subtle"
                    style={{ backgroundColor: form.primary_color }}
                    aria-label="Primary color preview"
                  />
                </div>
                {primaryContrastWarning && (
                  <p className="text-body-sm text-amber-700 dark:text-amber-400">
                    Light primary color may reduce contrast on white text.
                  </p>
                )}
              </div>
            </Field>
            <Field label="Accent color" htmlFor="s-accent">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    id="s-accent"
                    type="color"
                    value={form.accent_color}
                    onChange={(e) => setField('accent_color')(e)}
                    className="h-10 w-10 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                  />
                  <span
                    className="h-8 w-8 rounded border border-border-subtle"
                    style={{ backgroundColor: form.accent_color }}
                    aria-label="Accent color preview"
                  />
                </div>
              </div>
            </Field>
          </div>
        </section>

        {/* Social links */}
        <section className="col-span-full rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6 shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Phone size={17} className="text-primary" aria-hidden="true" />
            <h2 className="font-display text-headline-md text-text-primary">Social links</h2>
          </div>
          <div className="space-y-2">
            {socials.map((s, i) => (
              <div key={i} className="grid grid-cols-3 gap-3 items-center">
                <span className="text-body-md text-text-secondary">{s.label}</span>
                <input
                  type="text"
                  placeholder="https://..."
                  value={s.href}
                  onChange={(e) => {
                    const next = [...socials]
                    next[i] = { ...next[i], href: e.target.value }
                    setSocials(next)
                  }}
                  className="rounded-lg border border-border-strong bg-surface px-3 py-2 text-body-md text-text-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            ))}
          </div>
          <p className="mt-3 text-body-sm text-text-tertiary">
            Only links with both a name and URL are saved.
          </p>
        </section>

        <div className="col-span-full flex justify-end">
          <Button
            type="submit"
            disabled={saving}
            className="px-6"
          >
            <Settings size={15} className="mr-2" aria-hidden="true" />
            Save settings
          </Button>
        </div>
      </form>
    </div>
  )
}
