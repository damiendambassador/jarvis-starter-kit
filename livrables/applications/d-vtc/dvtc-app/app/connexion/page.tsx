'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function ConnexionPage() {
  const router  = useRouter()
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [checking, setChecking] = useState(true)
  const [error,    setError]    = useState<string | null>(null)

  /* Redirige si déjà connecté */
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/dashboard')
      } else {
        const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
        if (adminToken) router.replace('/admin/dashboard')
        else setChecking(false)
      }
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    /* 1. Essai connexion chauffeur via Supabase Auth */
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (!authError) {
      router.replace('/dashboard')
      return
    }

    /* 2. Essai connexion admin via l'API */
    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.ok) {
      const { token } = await res.json()
      localStorage.setItem('admin_token', token)
      router.replace('/admin/dashboard')
      return
    }

    /* Les deux ont échoué */
    setError('Email ou mot de passe incorrect.')
    setLoading(false)
  }

  if (checking) return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center">
      <Loader2 className="animate-spin text-[#C9A84C]" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0A1628] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[420px]">

        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[42px] h-[42px] rounded-[10px] border border-[#C9A84C]/50 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-[20px] leading-none">D</span>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[.16em] text-[#C9A84C] font-semibold">D-VTC</div>
            <div className="text-white/50 text-[12px]">Espace de connexion</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl px-8 py-9 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <h1 className="font-serif text-[26px] font-bold text-[#0A1628] mb-1">Connexion</h1>
          <p className="text-[13px] text-[#8A94A6] mb-7">
            Chauffeur ou administrateur — un seul accès.
          </p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-3 text-[14px] text-[#0A1628] outline-none focus:border-[#0A1628] transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-3 pr-11 text-[14px] text-[#0A1628] outline-none focus:border-[#0A1628] transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A7B0BF] hover:text-[#0A1628] transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-2.5 text-[13px] text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0A1628] text-white rounded-[9px] py-3.5 text-[14px] font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2 mt-1">
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Vérification…' : 'Se connecter →'}
            </button>
          </form>
        </div>

        <p className="text-white/30 text-[12px] text-center mt-6">
          Service propulsé par D Embassy
        </p>
      </div>
    </div>
  )
}
