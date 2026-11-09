import { mapSupabaseError } from '../utils/ApiError.js'

// Thin data-access layer around Supabase. Services return plain data or throw
// mapped ApiErrors so controllers stay declarative.
export async function query(builder, fallbackMessage = 'Database error') {
  const { data, error } = await builder
  if (error) throw mapSupabaseError(error, fallbackMessage)
  return data
}

export async function querySingle(builder, fallbackMessage = 'Database error') {
  const { data, error } = await builder
  if (error) throw mapSupabaseError(error, fallbackMessage)
  if (!data) throw mapSupabaseError({ code: 'PGRST116' }, 'Not found')
  return data
}
