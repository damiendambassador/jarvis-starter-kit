'use client'

import { useState } from 'react'
import type { StoreWithPlacements } from '@/lib/supabase'
import {
  STATUSES,
  CHAINS,
  BRAND_NAMES,
  BRAND_STATUSES,
  penetrationColor,
  newDnColor,
  chainCode,
  type ColorMode,
} from '@/lib/constants'
import { hasBrandPresent, newDnCount } from './MapView'
import { ChevronDown, ChevronUp, BarChart3, Star } from 'lucide-react'

function Dot({ color }: { color: string }) {
  return <span className="w-3 h-3 rounded-full inline-block shrink-0" style={{ background: color }} />
}

function Legend({ colorMode, brandFocus }: { colorMode: ColorMode; brandFocus: string | null }) {
  // Si une marque est ciblée, la couleur reflète l'état de CETTE marque
  if (brandFocus)
    return (
      <Items
        items={[
          ...BRAND_STATUSES.map((s) => ({ color: s.color, label: `${brandFocus} : ${s.name}` })),
          { color: '#D1D5DB', label: `${brandFocus} : à travailler` },
        ]}
      />
    )
  if (colorMode === 'status')
    return (
      <Items items={STATUSES.map((s) => ({ color: s.color, label: s.name }))} />
    )
  if (colorMode === 'chain')
    return <Items items={CHAINS.map((c) => ({ color: c.color, label: c.name }))} />
  if (colorMode === 'penetration')
    return (
      <Items
        items={[0, 1, 2, 3, 4].map((n) => ({
          color: penetrationColor(n),
          label: n === 0 ? '0 marque' : n === 4 ? '4 marques ou +' : `${n} marque${n > 1 ? 's' : ''}`,
        }))}
      />
    )
  return (
    <Items
      items={[0, 1, 2, 3, 4].map((n) => ({
        color: newDnColor(n),
        label: n === 0 ? '0 nouvelle DN' : n === 4 ? '4 DN ou +' : `${n} nouvelle${n > 1 ? 's' : ''} DN`,
      }))}
    />
  )
}

function Items({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul className="grid grid-cols-1 gap-1">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-2 text-[11px] text-teal/80">
          <Dot color={it.color} /> {it.label}
        </li>
      ))}
    </ul>
  )
}

export default function StatsPanel({
  stores,
  colorMode,
  brandFocus,
}: {
  stores: StoreWithPlacements[]
  colorMode: ColorMode
  brandFocus: string | null
}) {
  const [open, setOpen] = useState(true)
  // Taille du panneau, ajustable par l'utilisateur et mémorisée
  const [size, setSize] = useState<{ w: number; h: number }>(() => {
    if (typeof window !== 'undefined') {
      try {
        const s = JSON.parse(localStorage.getItem('legend_size') || 'null')
        if (s?.w && s?.h) return s
      } catch {}
    }
    return { w: 230, h: 360 }
  })

  function startResize(e: React.PointerEvent) {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = size.w
    const startH = size.h
    const onMove = (ev: PointerEvent) => {
      const w = Math.min(480, Math.max(190, startW + (ev.clientX - startX)))
      const h = Math.min(window.innerHeight * 0.85, Math.max(150, startH + (startY - ev.clientY)))
      setSize({ w, h })
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setSize((s) => {
        try {
          localStorage.setItem('legend_size', JSON.stringify(s))
        } catch {}
        return s
      })
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  const total = stores.length

  const brands = BRAND_NAMES.filter((b) => b !== 'Autre')

  // Mes gains : nouvelles DN gagnées et magasins concernés
  const dnStores = stores.filter((s) => newDnCount(s) > 0)
  const dnTotal = stores.reduce((acc, s) => acc + newDnCount(s), 0)

  return (
    <div
      className="absolute bottom-4 left-4 z-10 bg-cream/95 backdrop-blur rounded-xl shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
      style={{ width: size.w }}
    >
      {/* Poignée de redimensionnement (glisser vers le haut/droite) */}
      <div
        onPointerDown={startResize}
        title="Redimensionner (glisser)"
        className="absolute top-0 right-0 z-20 p-1.5 cursor-ne-resize"
      >
        <span className="block w-2.5 h-2.5 border-t-2 border-r-2 border-cream/80 rounded-tr-sm" />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full bg-teal text-cream px-3 py-2 flex items-center justify-between rounded-t-xl ${open ? '' : 'rounded-b-xl'}`}
      >
        <span className="text-[12px] font-bold flex items-center gap-1.5">
          <BarChart3 size={14} /> Légende & stats
        </span>
        {open ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
      </button>

      {open && (
        <div
          className="p-3 space-y-3 overflow-y-auto thin-scroll rounded-b-xl"
          style={{ maxHeight: size.h }}
        >
          <div>
            <div className="text-[10px] uppercase tracking-wide text-teal/50 font-semibold mb-1.5">Légende</div>
            <Legend colorMode={colorMode} brandFocus={brandFocus} />
            <div className="flex items-center gap-2 text-[11px] text-green-700 mt-1.5">
              <Star size={12} className="text-green-600" fill="currentColor" /> Étoile verte = nouvelle DN gagnée
            </div>
          </div>

          {/* Codes enseignes (le code 2 lettres affiché dans chaque pin) */}
          <div>
            <div className="text-[10px] uppercase tracking-wide text-teal/50 font-semibold mb-1.5">Codes enseignes</div>
            <ul className="grid grid-cols-2 gap-x-2 gap-y-1">
              {CHAINS.map((c) => (
                <li key={c.name} className="flex items-center gap-1.5 text-[11px] text-teal/80">
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal text-cream text-[9px] font-bold shrink-0">
                    {chainCode(c.name)}
                  </span>
                  <span className="truncate">{c.name}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mes gains */}
          <div className="bg-bronze/10 border border-bronze/30 rounded-lg px-3 py-2">
            <div className="text-[11px] font-bold text-bronze-dark flex items-center gap-1.5">
              <Star size={12} /> Mes nouvelles DN
            </div>
            <div className="text-[12px] text-teal/80 mt-0.5">
              <span className="font-bold text-teal">{dnTotal}</span> référence(s) gagnée(s) dans{' '}
              <span className="font-bold text-teal">{dnStores.length}</span> magasin(s)
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wide text-teal/50 font-semibold mb-1.5">
              Pénétration ({total} magasins)
            </div>
            <ul className="space-y-1">
              {brands.map((b) => {
                const n = stores.filter((s) => hasBrandPresent(s, b)).length
                const pct = total ? Math.round((n / total) * 100) : 0
                return (
                  <li key={b} className="text-[11px] text-teal/80">
                    <div className="flex justify-between mb-0.5">
                      <span>{b}</span>
                      <span className="text-teal/50">
                        {n} · {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-teal/10 rounded-full overflow-hidden">
                      <div className="h-full bg-bronze rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
