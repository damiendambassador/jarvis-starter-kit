'use client'

import { createContext, useContext } from 'react'
import { type Driver } from '@/lib/supabase'

export type DashboardState = { driver: Driver }
export const DashboardContext = createContext<DashboardState | null>(null)

export function useDriver(): Driver {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDriver must be used inside DashboardContext')
  return ctx.driver
}
