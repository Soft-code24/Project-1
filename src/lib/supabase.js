import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

export const isSupabaseConfigured = Boolean(supabase)

// Current access token, kept in sync with Supabase auth state via
// onAuthStateChange. This avoids async getSession() calls on every API
// request and eliminates timing issues where the client has not finished
// loading the session from storage.
let currentAccessToken = null

if (supabase) {
  supabase.auth.onAuthStateChange((_event, session) => {
    currentAccessToken = session?.access_token ?? null
  })
}

export const getCurrentAccessToken = () => currentAccessToken
