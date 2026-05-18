import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!url || !key) {
  console.warn(
    '[Supabase] Miljøvariabler mangler. Kopier .env.local.example til .env.local og fyll inn verdiene fra supabase.com'
  )
}

export const supabase = createClient(url ?? '', key ?? '')
