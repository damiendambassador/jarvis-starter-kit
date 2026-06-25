'use client'

import { createContext, useContext } from 'react'
import { type Driver } from '@/lib/supabase'

export type DashboardState = { driver: Driver; adminPreview: boolean }
export const DashboardContext = createContext<DashboardState | null>(null)

export function useDashboard(): DashboardState {
  const ctx = useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard must be used inside DashboardContext')
  return ctx
}

export function useDriver(): Driver {
  return useDashboard().driver
}
