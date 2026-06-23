'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Loader2, MapPin } from 'lucide-react'

export default function ConnexionPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/')
      else setChecking(false)
    })
  }, [router])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      const m = authError.message || ''
      if (/not confirmed/i.test(m))
        setError('Email non confirmé. Dans Supabase → Authentication → Users, confirme le compte (ou recrée-le avec « Auto Confirm User »).')
      else if (/invalid login/i.test(m))
        setError('Identifiants invalides. Vérifie le mot de passe exact défini dans Supabase.')
      else if (/api key|invalid.*key/i.test(m))
        setError('Clé API Supabase invalide (vérifier .env.local).')
      else setError(m || 'Connexion impossible.')
      setLoading(false)
      return
    }
    router.replace('/')
  }

  if (checking)
    return (
      <div className="min-h-screen bg-teal-deep flex items-center justify-center">
        <Loader2 className="animate-spin text-bronze" size={32} />
      </div>
    )

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-light via-teal to-teal-deep flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-[420px]">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[42px] h-[42px] rounded-[10px] border border-bronze/50 flex items-center justify-center">
            <MapPin className="text-bronze" size={20} />
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[.16em] text-bronze font-semibold">Edrington</div>
            <div className="text-cream/60 text-[12px]">Carte de prospection</div>
          </div>
        </div>

        <div className="bg-cream rounded-2xl px-8 py-9 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
          <h1 className="font-serif text-[26px] font-bold text-teal mb-1">Connexion</h1>
          <p className="text-[13px] text-teal/60 mb-7">Accès privé à ta cartographie terrain.</p>

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="text-[12px] font-semibold text-teal/70 block mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full border border-teal/20 rounded-[9px] px-4 py-3 text-[14px] text-teal outline-none focus:border-teal transition-colors"
              />
            </div>

            <div>
              <label className="text-[12px] font-semibold text-teal/70 block mb-1.5">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full border border-teal/20 rounded-[9px] px-4 py-3 pr-11 text-[14px] text-teal outline-none focus:border-teal transition-colors"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-teal/40 hover:text-teal transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-[8px] px-4 py-2.5 text-[13px] text-red-600">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal text-cream rounded-[9px] py-3.5 text-[14px] font-semibold hover:bg-teal-light disabled:opacity-50 transition-colors flex items-center justify-center gap-2 mt-1"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? 'Vérification…' : 'Se connecter →'}
            </button>
          </form>
        </div>

        <p className="text-cream/30 text-[12px] text-center mt-6">Outil interne · D·Jarvis</p>
      </div>
    </div>
  )
}
