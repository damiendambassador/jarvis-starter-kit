'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/admin/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!res.ok) {
      setError('Identifiants incorrects.')
      setLoading(false)
      return
    }

    localStorage.setItem('admin_email', email)
    localStorage.setItem('admin_password', password)
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0A1628] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-[42px] h-[42px] rounded-[10px] border border-[#C9A84C]/50 flex items-center justify-center">
            <span className="text-[#C9A84C] font-bold text-xl leading-none">D</span>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-[.16em] text-[#C9A84C] font-semibold">D-VTC</div>
            <div className="text-white text-[13px] opacity-60">Espace administrateur</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-[24px] font-bold text-[#0A1628] mb-6">Connexion admin</h1>

          <div className="flex flex-col gap-4 mb-6">
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Adresse email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="votre@email.com"
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-3 text-[14px] text-[#0A1628] outline-none focus:border-[#0A1628] transition-colors"
              />
            </div>
            <div>
              <label className="text-[12px] font-semibold text-[#5A6477] block mb-1.5">Mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-[#D6DEEA] rounded-[9px] px-4 py-3 text-[14px] text-[#0A1628] outline-none focus:border-[#0A1628] transition-colors"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-[13px] mb-4">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#0A1628] text-white rounded-[9px] py-3.5 text-[14px] font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60">
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>
      </div>
    </div>
  )
}
