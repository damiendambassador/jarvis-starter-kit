import type { Pricing } from './supabase'

export type PriceResult = {
  base: number
  distanceCost: number
  nightSurcharge: number
  loyaltyDiscount: number
  total: number
  isNight: boolean
  isLoyal: boolean
}

export function calculateStandardPrice(
  pricing: Pricing,
  distanceKm: number,
  hour: number,
  isLoyal: boolean
): PriceResult {
  const isNight = hour < 8 || hour >= 20
  const base = pricing.base_fare
  const distanceCost = distanceKm * pricing.price_per_km
  const subtotal = base + distanceCost
  const nightSurcharge = isNight ? subtotal * pricing.night_surcharge : 0
  const preDiscount = subtotal + nightSurcharge
  const loyaltyDiscount = isLoyal ? preDiscount * pricing.loyalty_discount : 0
  const total = Math.round((preDiscount - loyaltyDiscount) * 100) / 100

  return { base, distanceCost, nightSurcharge, loyaltyDiscount, total, isNight, isLoyal }
}

export function calculateDispoPrice(
  pricing: Pricing,
  durationHours: number
): { total: number; kmIncluded: number } {
  const total = durationHours >= 8 ? pricing.dispo_day : pricing.dispo_2h
  return { total, kmIncluded: pricing.km_included_dispo }
}

export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}
