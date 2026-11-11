import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../lib/api.js'
import { applyBrandColors } from '../lib/brandColors.js'

const BusinessSettingsContext = createContext(null)

export function BusinessSettingsProvider({ children }) {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    api.getSettings()
      .then((res) => {
        const s = res.settings || null
        if (mounted) setSettings(s)
        if (s?.primary_color) {
          applyBrandColors(s.primary_color, s.accent_color || '#3FA34D')
        }
      })
      .catch(() => {
        // Settings table may not exist yet; storefront falls back to defaults.
        if (mounted) setSettings(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [])

  const value = { settings, loading }
  return <BusinessSettingsContext.Provider value={value}>{children}</BusinessSettingsContext.Provider>
}

export function useBusinessSettings() {
  const ctx = useContext(BusinessSettingsContext)
  if (!ctx) throw new Error('useBusinessSettings must be used within BusinessSettingsProvider')
  return ctx
}
