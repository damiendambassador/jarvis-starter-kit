'use client'

import { useMemo, useState } from 'react'
import { CHAIN_NAMES } from '@/lib/constants'
import type { ImportItem } from '@/app/page'
import { X, ClipboardPaste } from 'lucide-react'

// Répare le « mojibake » UTF-8 lu en Latin-1 (ex. "ParÃ©" → "Paré"),
// uniquement si la chaîne en présente les signes.
function fixEnc(s: string): string {
  if (!/[ÃÂ]/.test(s)) return s
  try {
    return decodeURIComponent(escape(s))
  } catch {
    return s
  }
}

// Parse une liste collée : une ligne par magasin, colonnes séparées par
// tabulation (copié d'Excel) ou, à défaut, par 2 espaces ou plus.
// Colonnes attendues : Nom, Adresse, Code Postal.
export function parseList(text: string): { name: string; address: string; postal: string }[] {
  const out: { name: string; address: string; postal: string }[] = []
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line) continue
    let parts = line.split('\t')
    if (parts.length < 2) parts = line.split(/\s{2,}/)
    const name = fixEnc((parts[0] ?? '').trim())
    const address = fixEnc((parts[1] ?? '').trim())
    const postal = (parts[2] ?? '').replace(/[^0-9]/g, '').trim()
    // On ignore les lignes parasites (numéros de téléphone, emails seuls…)
    if (!name || !/[a-zA-ZÀ-ÿ]/.test(name)) continue
    if (!address && !postal) continue
    out.push({ name, address, postal })
  }
  return out
}

export default function PasteImport({
  onImport,
  onClose,
}: {
  onImport: (items: ImportItem[]) => void
  onClose: () => void
}) {
  const [chain, setChain] = useState<string>(CHAIN_NAMES[0])
  const [text, setText] = useState('')

  const parsed = useMemo(() => parseList(text), [text])

  function handleImport() {
    const items: ImportItem[] = parsed.map((r) => ({
      chain,
      name: r.name,
      lat: null,
      lng: null,
      address: r.address || null,
      postal: r.postal || null,
    }))
    onImport(items)
    onClose()
  }

  return (
    <div className="absolute inset-0 z-40 bg-teal-deep/50 flex items-center justify-center px-4">
      <div className="w-full max-w-[560px] bg-cream rounded-xl shadow-2xl overflow-hidden">
        <div className="bg-teal text-cream px-5 py-3 flex items-center justify-between">
          <span className="font-serif text-[17px] font-bold flex items-center gap-2">
            <ClipboardPaste size={17} /> Coller une liste de magasins
          </span>
          <button onClick={onClose} className="text-cream/70 hover:text-cream">
            <X size={19} />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-[12px] font-semibold text-teal/70">Enseigne</label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="border border-teal/20 rounded-lg px-2.5 py-1.5 text-[13px] text-teal bg-white"
            >
              {CHAIN_NAMES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <p className="text-[12px] text-teal/60">
            Colle directement depuis Excel. Une ligne par magasin, colonnes&nbsp;:
            <b> Nom · Adresse · Code postal</b> (séparées par tabulation).
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder={'V AND B ANGERS\t36 boulevard Gaston Birgé\t49100\nV AND B RENNES\t14 rue Jean Le Hô\t35000'}
            className="w-full border border-teal/20 rounded-lg px-3 py-2 text-[12px] text-teal bg-white font-mono resize-none thin-scroll"
          />

          <div className="flex items-center justify-between">
            <span className="text-[12px] text-teal/60">
              <b className="text-teal">{parsed.length}</b> magasin(s) détecté(s) pour {chain}
            </span>
            <div className="flex gap-2">
              <button onClick={onClose} className="px-4 py-2 text-[13px] text-teal/70 hover:text-teal">
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={parsed.length === 0}
                className="bg-bronze text-white rounded-lg px-4 py-2 text-[13px] font-semibold hover:bg-bronze-dark disabled:opacity-40 transition-colors"
              >
                Importer & géocoder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
