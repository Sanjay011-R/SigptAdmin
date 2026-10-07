import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Supabase URL or key missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseKey)
