import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const AuthContext = createContext(null)

const emptyUser = null

function profileToUser(profile) {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role,
    accountStatus: profile.account_status,
  }
}

async function fetchProfile(userId) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, phone, role')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return profileToUser(data)
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(emptyUser)
  const [loading, setLoading] = useState(true)
  const lastUserId = useRef(null)

  // Restore session on load and listen for auth changes.
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    async function init() {
      try {
        const { data, error } = await supabase.auth.getUser()
        if (error || !data.user) {
          setLoading(false)
          return
        }
        lastUserId.current = data.user.id
        const profile = await fetchProfile(data.user.id)
        setUser(profile || { id: data.user.id, email: data.user.email, fullName: '', role: 'customer', accountStatus: 'active' })
      } catch (err) {
        console.error('Auth init error:', err)
      } finally {
        setLoading(false)
      }

      const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
        // Only update user state when the authenticated user actually changes.
        // Prevents cascading re-renders on TOKEN_REFRESHED events.
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (session?.user) {
            const newUserId = session.user.id
            if (lastUserId.current === newUserId) return
            lastUserId.current = newUserId
            const profile = await fetchProfile(newUserId)
            setUser(profile || { id: newUserId, email: session.user.email, fullName: '', role: 'customer' })
          }
        } else if (event === 'SIGNED_OUT') {
          lastUserId.current = null
          if (user) setUser(emptyUser)
        }
      })
      return () => sub.unsubscribe()
    }
    init()
  }, [])

  const setField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const login = async (email, password) => {
    if (!supabase) return { ok: false, error: 'Supabase is not configured on the frontend.' }
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.user) return { ok: false, error: error?.message || 'Invalid email or password.' }
    const profile = await fetchProfile(data.user.id)
    setUser(profile || { id: data.user.id, email, fullName: '', role: 'customer' })
    return { ok: true, user: profile || { id: data.user.id, email, fullName: '', role: 'customer', accountStatus: 'active' } }
  }

  const register = async (name, email, password) => {
    if (!supabase) return { ok: false, error: 'Supabase is not configured on the frontend.' }
    if (!name || name.trim().length < 2) return { ok: false, error: 'Enter your full name.' }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name.trim() } },
    })
    if (error) return { ok: false, error: error.message }
    if (!data.user) return { ok: false, error: 'Could not create account.' }
    // Profile row is created by the database trigger; fetch it.
    const profile = await fetchProfile(data.user.id)
    setUser(profile || { id: data.user.id, email, fullName: name.trim(), role: 'customer', accountStatus: 'active' })
    return { ok: true, user: profile || { id: data.user.id, email, fullName: name.trim(), role: 'customer' } }
  }

  const loginAsDemoCustomer = async () => {
    if (!supabase) {
      // Fallback when Supabase isn't configured: keep a local demo user.
      const demoUser = { id: 'demo', email: 'demo@savorbite.ng', fullName: 'Demo Customer', role: 'customer', accountStatus: 'active' }
      setUser(demoUser)
      return demoUser
    }
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@savorbite.ng',
        password: 'Demo@1234',
      })
      if (error || !data.user) throw new Error(error?.message || 'Demo account not available.')
      const profile = await fetchProfile(data.user.id)
      setUser(profile || { id: data.user.id, email: 'demo@savorbite.ng', fullName: 'Demo Customer', role: 'customer', accountStatus: 'active' })
      return profile || { id: data.user.id, email: 'demo@savorbite.ng', fullName: 'Demo Customer', role: 'customer', accountStatus: 'active' }
    } catch (err) {
      const demoUser = { id: 'demo', email: 'demo@savorbite.ng', fullName: 'Demo Customer', role: 'customer', accountStatus: 'active' }
      setUser(demoUser)
      return demoUser
    }
  }

  const logout = async () => {
    if (supabase) await supabase.auth.signOut()
    setUser(emptyUser)
  }

  const value = useMemo(() => ({
    user,
    isAdmin: user?.role === 'admin',
    isLoading: loading,
    login,
    register,
    loginAsDemoCustomer,
    logout,
  }), [user, loading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
