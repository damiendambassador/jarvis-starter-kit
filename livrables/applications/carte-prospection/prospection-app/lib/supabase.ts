import { createClient } from '@supabase/supabase-js'

// Fallbacks neutres : évitent que createClient ne jette pendant le build
// (prerender) si les variables d'env ne sont pas encore renseignées.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ── Types ──────────────────────────────────────────────────
export type Placement = {
  id: string
  store_id: string
  brand: string
  reference: string | null
  status: string
  is_new_dn: boolean
  created_at: string
}

export type Store = {
  id: string
  created_at: string
  updated_at: string
  chain: string
  name: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  lat: number
  lng: number
  status: string
  contact_name: string | null
  phone: string | null
  email: string | null
  last_visit: string | null
  notes: string | null
}

// Magasin avec ses placements (jointure Supabase `stores(*, placements(*))`)
export type StoreWithPlacements = Store & { placements: Placement[] }
