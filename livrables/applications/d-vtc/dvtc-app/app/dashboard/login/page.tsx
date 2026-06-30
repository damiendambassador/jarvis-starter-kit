'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard')
      else setChecking(false)
    })
  }, [])

  // Garde-fou : si la vérification de session reste bloquée (verrou d'auth),
  // on recharge la page une seule fois (flag anti-boucle en sessionStorage,
  // partagé avec le layout du dashboard).
  useEffect(() => {
    if (!checking) { sessionStorage.removeItem('dvtc_reload_guard'); return }
    const t = setTimeout(() => {
      if (sessionStorage.getItem('dvtc_reload_guard')) return
      sessionStorage.setItem('dvtc_reload_guard', '1')
      window.location.reload()
    }, 4000)
    return () => clearTimeout(t)
  }, [checking])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
      return
    }
    router.replace('/dashboard')
  }

  if (checking) return (
    <div className="min-h-screen bg-navy flex items-center justify-center">
      <Loader2 className="animate-spin text-gold" size={32} />
    </div>
  )

  return (
    <div className="min-h-screen bg-navy flex flex-col items-center justify-center px-6 animate-fade-in">
      <div className="w-full max-w-[420px] bg-white rounded-[18px] px-6 sm:px-8 py-9 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">

        {/* Logo */}
        <div className="w-[46px] h-[46px] rounded-[11px] bg-navy flex items-center justify-center mb-[22px]">
          <span className="text-gold font-bold text-[22px] leading-none">D</span>
        </div>

        <h1 className="font-serif text-[26px] font-bold text-navy m-0 tracking-[-0.01em]">
          Espace conducteur
        </h1>
        <p className="text-[13px] text-[#8A94A6] mt-1.5 mb-[26px]">
          Accédez à votre tableau de bord
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <label className="block">
            <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Email</span>
            <div className="relative">
              <input
                type="email" required autoComplete="email"
                className="input-field"
                placeholder="patrick.d@dvtc.app"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[12px] font-medium text-[#5A6477] block mb-1.5">Mot de passe</span>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required autoComplete="current-password"
                className="input-field pr-11"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPwd(v => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#A7B0BF] hover:text-navy transition-colors p-1">
                {showPwd ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </label>

          {error && (
            <div className="text-[13px] text-red-500 text-center">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white border-none rounded-xl py-[13px] text-[14px] font-semibold cursor-pointer hover:bg-navy-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
            {loading ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Se connecter →'}
          </button>
        </form>

        <div className="text-center mt-4">
          <button className="bg-transparent border-none text-gold text-[12px] font-medium cursor-pointer hover:text-gold-dark transition-colors">
            Mot de passe oublié ?
          </button>
        </div>
      </div>

      <div className="text-white/40 text-[12px] mt-6">Service propulsé par D Embassy</div>
    </div>
  )
}
