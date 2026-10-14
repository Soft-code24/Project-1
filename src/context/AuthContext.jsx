import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { ADMIN_CREDENTIALS } from '../data/site.js'

const AuthContext = createContext(null)
const STORAGE_KEY = 'savorbite.auth.v1'

function loadAuth() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {
    // ignore malformed storage
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadAuth)

  useEffect(() => {
    try {
      if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      // storage may be unavailable
    }
  }, [user])

  const value = useMemo(() => {
    const login = (email, password) => {
      // Prototype auth: validates shape only. Admin credentials unlock the dashboard.
      const normalized = (email || '').trim().toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return { ok: false, error: 'Enter a valid email address.' }
      }
      if (!password || password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' }
      }
      if (normalized === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
        const adminUser = { name: 'SavorBite Admin', email: normalized, role: 'admin' }
        setUser(adminUser)
        return { ok: true, user: adminUser }
      }
      const customer = {
        name: normalized.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        email: normalized,
        role: 'customer',
      }
      setUser(customer)
      return { ok: true, user: customer }
    }

    const register = (name, email, password) => {
      const normalized = (email || '').trim().toLowerCase()
      if (!name || name.trim().length < 2) return { ok: false, error: 'Enter your full name.' }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
        return { ok: false, error: 'Enter a valid email address.' }
      }
      if (!password || password.length < 6) {
        return { ok: false, error: 'Password must be at least 6 characters.' }
      }
      const customer = { name: name.trim(), email: normalized, role: 'customer' }
      setUser(customer)
      return { ok: true, user: customer }
    }

    const loginAsDemoCustomer = () => {
      const customer = { name: 'Adaeze Okafor', email: 'adaeze@example.com', role: 'customer' }
      setUser(customer)
      return customer
    }

    const logout = () => setUser(null)

    return { user, isAdmin: user?.role === 'admin', login, register, loginAsDemoCustomer, logout }
  }, [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
