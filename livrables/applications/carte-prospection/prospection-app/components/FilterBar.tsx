'use client'

import { CHAIN_NAMES, STATUS_NAMES, BRAND_NAMES, COLOR_MODES, type ColorMode } from '@/lib/constants'
import { Search, Star } from 'lucide-react'

export type Presence = 'all' | 'present' | 'absent'

export type Filters = {
  chain: string // '' = toutes
  status: string // '' = tous
  brand: string // '' = aucune (= focus marque)
  presence: Presence
  query: string
  onlyNewDn: boolean // n'afficher que les magasins où une nouvelle DN a été gagnée
}

export const EMPTY_FILTERS: Filters = {
  chain: '',
  status: '',
  brand: '',
  presence: 'all',
  query: '',
  onlyNewDn: false,
}

export default function FilterBar({
  filters,
  setFilters,
  colorMode,
  setColorMode,
  count,
}: {
  filters: Filters
  setFilters: (f: Filters) => void
  colorMode: ColorMode
  setColorMode: (m: ColorMode) => void
  count: number
}) {
  const set = (patch: Partial<Filters>) => setFilters({ ...filters, ...patch })
  const sel = 'border border-teal/20 rounded-lg px-2 py-1.5 text-[12px] text-teal bg-white outline-none focus:border-teal'

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Recherche nom */}
      <div className="relative">
        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal/40" />
        <input
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Rechercher…"
          className={`${sel} pl-7 w-[140px]`}
        />
      </div>

      <select value={filters.chain} onChange={(e) => set({ chain: e.target.value })} className={sel}>
        <option value="">Toutes enseignes</option>
        {CHAIN_NAMES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select value={filters.status} onChange={(e) => set({ status: e.target.value })} className={sel}>
        <option value="">Tous statuts</option>
        {STATUS_NAMES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Focus marque + présence */}
      <select
        value={filters.brand}
        onChange={(e) => set({ brand: e.target.value, presence: e.target.value ? filters.presence : 'all' })}
        className={sel}
      >
        <option value="">Focus marque…</option>
        {BRAND_NAMES.map((b) => (
          <option key={b} value={b}>
            {b}
          </option>
        ))}
      </select>

      {filters.brand && (
        <select value={filters.presence} onChange={(e) => set({ presence: e.target.value as Presence })} className={sel}>
          <option value="all">Présente ou non</option>
          <option value="present">Présente</option>
          <option value="absent">Absente (cible)</option>
        </select>
      )}

      {/* Mise en avant des magasins où une nouvelle DN a été gagnée */}
      <button
        onClick={() => set({ onlyNewDn: !filters.onlyNewDn })}
        className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold transition-colors border ${
          filters.onlyNewDn
            ? 'bg-bronze text-white border-bronze'
            : 'bg-white text-bronze-dark border-bronze/40 hover:bg-bronze/10'
        }`}
        title="N'afficher que mes nouvelles DN gagnées"
      >
        <Star size={13} /> Mes gains
      </button>

      <div className="h-5 w-px bg-teal/15 mx-1" />

      {/* Colorer par */}
      <label className="text-[11px] text-teal/60 font-semibold">Colorer&nbsp;par</label>
      <select value={colorMode} onChange={(e) => setColorMode(e.target.value as ColorMode)} className={sel}>
        {COLOR_MODES.map((m) => (
          <option key={m.key} value={m.key}>
            {m.label}
          </option>
        ))}
      </select>

      <span className="text-[11px] text-teal/50 ml-auto">{count} magasin(s)</span>
    </div>
  )
}
