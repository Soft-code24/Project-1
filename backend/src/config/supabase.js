import { createClient } from '@supabase/supabase-js'
import env from './env.js'

// Anon client — safe for acting on behalf of signed-in users (Auth flows).
export const supabaseAnon = createClient(env.supabase.url, env.supabase.anonKey, {
  auth: { persistSession: false },
})

// Service-role client — full database access, SERVER USE ONLY. Never ship this
// key to the browser; it bypasses Row Level Security.
export const supabaseAdmin = createClient(env.supabase.url, env.supabase.serviceRoleKey, {
  auth: { persistSession: false },
})
