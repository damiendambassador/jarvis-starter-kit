'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, type Driver } from '@/lib/supabase'
import { DashboardContext } from './_context'
import Sidebar from './_sidebar'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [driver, setDriver] = useState<Driver | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.replace('/dashboard/login'); return }
      supabase.from('drivers').select('*').eq('user_id', session.user.id).single()
        .then(({ data }) => {
          if (!data) { router.replace('/dashboard/login'); return }
          setDriver(data)
          setLoading(false)
        })
    })
  }, [])

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <Loader2 className="animate-spin text-navy" size={32} />
    </div>
  )

  if (!driver) return null

  return (
    <DashboardContext.Provider value={{ driver }}>
      <div className="flex min-h-screen animate-fade-in">
        <Sidebar driver={driver} />
        <main className="flex-1 min-w-0 px-[34px] py-[30px] pb-[60px]">
          {children}
        </main>
      </div>
    </DashboardContext.Provider>
  )
}
