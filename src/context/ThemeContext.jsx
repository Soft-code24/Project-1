import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'savorbite.theme.v1'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState('system')

  const resolveTheme = (stored) => {
    if (stored === 'light' || stored === 'dark') return stored
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
    return 'light'
  }

  const applyTheme = (next) => {
    const resolved = resolveTheme(next)
    if (typeof document !== 'undefined') {
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // storage may be unavailable
    }
  }

  useEffect(() => {
    var stored = null
    try {
      stored = localStorage.getItem(STORAGE_KEY)
    } catch {
      stored = null
    }
    setThemeState(stored || 'system')
    applyTheme(stored || 'system')

    var mq = window.matchMedia('(prefers-color-scheme: dark)')
    var handler = (e) => {
      // Only follow system when no manual choice is stored.
      try {
        if (localStorage.getItem(STORAGE_KEY) === null) {
          applyTheme(e.matches ? 'dark' : 'light')
          setThemeState('system')
        }
      } catch {
        applyTheme(e.matches ? 'dark' : 'light')
        setThemeState('system')
      }
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const setTheme = (next) => {
    setThemeState(next)
    applyTheme(next)
  }

  const value = useMemo(
    () => ({ theme, setTheme }),
    [theme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
