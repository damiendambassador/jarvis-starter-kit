import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Driver = {
  id: string
  user_id: string
  name: string
  email: string
  phone: string | null
  vehicle_model: string | null
  vehicle_plate: string | null
  vehicle_capacity: number
  slug: string
  is_active: boolean
  created_at: string
}

export type Pricing = {
  id: string
  driver_id: string
  base_fare: number
  price_per_km: number
  night_surcharge: number
  dispo_2h: number
  dispo_day: number
  km_included_dispo: number
  loyalty_threshold: number
  loyalty_discount: number
}

export type Client = {
  id: string
  driver_id: string
  name: string
  phone: string | null
  email: string | null
  total_rides: number
  is_loyal: boolean
  created_at: string
}

export type Reservation = {
  id: string
  driver_id: string
  client_id: string | null
  client_name: string
  client_phone: string
  client_email: string
  ride_type: 'standard' | 'dispo'
  pickup_address: string
  dropoff_address: string | null
  distance_km: number | null
  scheduled_at: string
  passengers: number
  notes: string | null
  status: 'pending' | 'accepted' | 'refused' | 'completed'
  price_estimate: number | null
  applied_discount: boolean
  created_at: string
}
