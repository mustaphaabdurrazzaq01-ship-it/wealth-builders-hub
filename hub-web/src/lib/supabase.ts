import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined

if (!url || !key) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.')
}

// Public site: anonymous reads of published content, plus insert-only forms.
export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
})

export const SUPABASE_URL = url
