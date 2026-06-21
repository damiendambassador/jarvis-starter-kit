'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase, type Client, type Reservation } from '@/lib/supabase'
import { useDriver } from '../_context'
import { formatPrice } from '@/lib/pricing'
import { Search, Users, Phone, X, Loader2 } from 'lucide-react'

export default function ClientsPage() {
  const driver = useDriver()
  const [clients, setClients] = useState<Client[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Client | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('clients').select('*').eq('driver_id', driver.id).order('total_rides', { ascending: false }),
      supabase.from('reservations').select('id,client_phone,price_estimate,status').eq('driver_id', driver.id),
    ]).then(([{ data: c }, { data: r }]) => {
      setClients(c ?? [])
      setReservations((r as Reservation[]) ?? [])
      setLoading(false)
    })
  }, [driver.id])

  function clientRevenue(phone: string) {
    return reservations
      .filter(r => r.client_phone === phone && r.status === 'completed')
      .reduce((s, r) => s + (r.price_estimate ?? 0), 0)
  }

  const filtered = useMemo(() =>
    clients.filter(c =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone ?? '').includes(search)
    ),
  [clients, search])

  async function toggleVip(client: Client) {
    const next = !client.is_loyal
    await supabase.from('clients').update({ is_loyal: next }).eq('id', client.id)
    const updated = { ...client, is_loyal: next }
    setClients(prev => prev.map(c => c.id === client.id ? updated : c))
    if (selected?.id === client.id) setSelected(updated)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-navy" size={28} /></div>
  )

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-[18px]">
        <h1 className="font-serif text-[28px] font-bold text-navy m-0 tracking-[-0.01em]">Clients</h1>
        <span className="text-[14px] text-[#8A94A6]">{clients.length} au total</span>
      </div>

      {/* Search */}
      <div className="relative mb-[22px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A7B0BF]" size={18} />
        <input
          className="input-field pl-[42px]"
          placeholder="Rechercher par nom ou téléphone…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-dashed border-[#D6DEEA] rounded-2xl px-12 py-12 text-center">
          <Users className="text-[#C4CDDB] mx-auto mb-3" size={34} />
          <div className="text-[14px] text-[#8A94A6] max-w-[340px] mx-auto leading-[1.5]">
            {search ? 'Aucun client trouvé pour cette recherche.' : 'Aucun client. Ils apparaissent après leur première réservation.'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(310px,1fr))] gap-3.5">
          {filtered.map(c => (
            <ClientCard key={c.id} client={c}
              revenue={clientRevenue(c.phone ?? '')}
              onClick={() => setSelected(c)}
            />
          ))}
        </div>
      )}

      {/* Slide-out panel */}
      {selected && (
        <ClientPanel
          client={selected}
          revenue={clientRevenue(selected.phone ?? '')}
          onClose={() => setSelected(null)}
          onToggleVip={() => toggleVip(selected)}
        />
      )}
    </div>
  )
}

function ClientCard({ client: c, revenue, onClick }: {
  client: Client; revenue: number; onClick: () => void
}) {
  return (
    <div onClick={onClick}
      className="card px-[18px] py-[18px] cursor-pointer hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[15px] font-bold text-navy truncate">{c.name}</span>
            {c.is_loyal && (
              <span className="text-[10px] font-bold text-[#9A7B2E] bg-[#FBF7EC] border border-[#EAD9A8] px-2 py-0.5 rounded flex-shrink-0">
                ★ VIP
              </span>
            )}
          </div>
          {c.phone && (
            <div className="flex items-center gap-1.5 text-[13px] text-[#8A94A6] mt-1.5">
              <Phone size={14} />
              {c.phone}
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2.5 mt-4">
        <div className="flex-1 bg-[#F8F9FA] rounded-[9px] px-3 py-2.5">
          <div className="text-[11px] text-[#8A94A6]">Courses</div>
          <div className="text-[17px] font-bold text-navy mt-0.5">{c.total_rides}</div>
        </div>
        <div className="flex-1 bg-[#F8F9FA] rounded-[9px] px-3 py-2.5">
          <div className="text-[11px] text-[#8A94A6]">Total CA</div>
          <div className="text-[17px] font-bold text-gold mt-0.5">{formatPrice(revenue)}</div>
        </div>
      </div>
    </div>
  )
}

function ClientPanel({ client: c, revenue, onClose, onToggleVip }: {
  client: Client; revenue: number; onClose: () => void; onToggleVip: () => void
}) {
  return (
    <div
      className="fixed inset-0 bg-navy/45 z-50 flex justify-end animate-fade-in"
      onClick={onClose}>
      <div
        className="w-full max-w-[420px] bg-[#F8F9FA] h-full overflow-y-auto shadow-[−20px_0_60px_rgba(0,0,0,0.2)]"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="bg-navy px-6 py-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[19px] font-bold text-white">{c.name}</span>
              {c.is_loyal && (
                <span className="text-[10px] font-bold text-navy bg-gold px-2 py-0.5 rounded">★ VIP</span>
              )}
            </div>
            {c.phone && <div className="text-[13px] text-white/60 mt-1.5">{c.phone}</div>}
          </div>
          <button onClick={onClose}
            className="bg-white/10 border-none text-white w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center hover:bg-white/20 transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="px-5 py-5">
          {/* Stats */}
          <div className="flex gap-3 mb-[22px]">
            <div className="flex-1 card px-[14px] py-[14px]">
              <div className="text-[11px] text-[#8A94A6]">Courses</div>
              <div className="text-[20px] font-bold text-navy mt-0.5">{c.total_rides}</div>
            </div>
            <div className="flex-1 card px-[14px] py-[14px]">
              <div className="text-[11px] text-[#8A94A6]">Total CA</div>
              <div className="text-[20px] font-bold text-gold mt-0.5">{formatPrice(revenue)}</div>
            </div>
          </div>

          {/* VIP toggle */}
          <div className="card px-[18px] py-[18px] mb-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-bold text-navy">Statut VIP</span>
                  <span className="text-[11px] font-semibold text-[#9A7B2E] bg-[#FBF7EC] border border-[#EAD9A8] px-1.5 py-0.5 rounded">
                    −5%
                  </span>
                </div>
                <div className="text-[12px] text-[#5A6477] mt-1 leading-[1.45]">
                  {c.is_loyal
                    ? 'Client VIP : réduction de 5% appliquée automatiquement.'
                    : `Pas encore VIP (${c.total_rides} course${c.total_rides > 1 ? 's' : ''}).`}
                </div>
              </div>
              <button onClick={onToggleVip}
                className={[
                  'flex-shrink-0 px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors border',
                  c.is_loyal
                    ? 'border-[#F0C0BA] text-red-500 bg-white hover:bg-red-50'
                    : 'border-[#EAD9A8] text-[#9A7B2E] bg-[#FBF7EC] hover:bg-[#F0E8C0]',
                ].join(' ')}>
                {c.is_loyal ? 'Retirer VIP' : 'Passer VIP'}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
