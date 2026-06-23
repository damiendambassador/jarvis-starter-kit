import type { StoreWithPlacements } from './supabase'

export type ParsedPlacemark = {
  name: string
  chain: string | null
  lat: number | null // null = pas de coordonnées dans le KML → à géocoder
  lng: number | null
  address: string | null
  postal: string | null
  description: string | null
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// ── Import : parse un KML exporté depuis Google My Maps (navigateur) ──
// Chaque <Folder> représente en général un calque (souvent = une enseigne).
export function parseKml(xml: string): ParsedPlacemark[] {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  const out: ParsedPlacemark[] = []

  // On parcourt les Folders pour récupérer le nom du calque (= enseigne probable).
  const folders = Array.from(doc.getElementsByTagName('Folder'))
  const scopes: { el: Element; chain: string | null }[] =
    folders.length > 0
      ? folders.map((f) => ({
          el: f,
          chain: f.getElementsByTagName('name')[0]?.textContent?.trim() ?? null,
        }))
      : [{ el: doc.documentElement, chain: null }]

  const seen = new Set<Element>()
  for (const scope of scopes) {
    const placemarks = Array.from(scope.el.getElementsByTagName('Placemark'))
    for (const pm of placemarks) {
      if (seen.has(pm)) continue // évite les doublons si scopes imbriqués
      seen.add(pm)

      // Coordonnées (optionnelles : certains exports My Maps n'ont que l'adresse)
      let lat: number | null = null
      let lng: number | null = null
      const coordsText = pm.getElementsByTagName('coordinates')[0]?.textContent?.trim()
      if (coordsText) {
        const [lngStr, latStr] = coordsText.split(',')
        const plng = parseFloat(lngStr)
        const plat = parseFloat(latStr)
        if (!Number.isNaN(plat) && !Number.isNaN(plng)) {
          lat = plat
          lng = plng
        }
      }

      // ExtendedData : colonnes du tableur d'origine (Adresse, Code Postal…)
      const ed: Record<string, string> = {}
      for (const d of Array.from(pm.getElementsByTagName('Data'))) {
        const key = d.getAttribute('name')
        const val = d.getElementsByTagName('value')[0]?.textContent?.trim()
        if (key && val) ed[key] = val
      }

      out.push({
        name: pm.getElementsByTagName('name')[0]?.textContent?.trim() || 'Sans nom',
        chain: scope.chain,
        lat,
        lng,
        address: ed['Adresse'] ?? ed['Address'] ?? null,
        postal: ed['Code Postal'] ?? ed['Code postal'] ?? ed['CP'] ?? null,
        description: pm.getElementsByTagName('description')[0]?.textContent?.trim() ?? null,
      })
    }
  }
  return out
}

// ── Export : génère un KML reversable vers My Maps ──
// Un Folder par enseigne, une Placemark par magasin, marques/références en description.
export function generateKml(stores: StoreWithPlacements[]): string {
  const byChain = new Map<string, StoreWithPlacements[]>()
  for (const s of stores) {
    const list = byChain.get(s.chain) ?? []
    list.push(s)
    byChain.set(s.chain, list)
  }

  const folders = Array.from(byChain.entries())
    .map(([chain, list]) => {
      const placemarks = list
        .map((s) => {
          const refs = s.placements
            .map((p) => `${p.brand}${p.reference ? ' — ' + p.reference : ''} (${p.status})`)
            .join('\n')
          const desc = [
            s.address && `Adresse : ${s.address}`,
            s.status && `Statut : ${s.status}`,
            s.contact_name && `Contact : ${s.contact_name}`,
            s.phone && `Tél : ${s.phone}`,
            refs && `Marques placées :\n${refs}`,
            s.notes && `Notes : ${s.notes}`,
          ]
            .filter(Boolean)
            .join('\n')
          return `      <Placemark>
        <name>${escapeXml(s.name || s.chain)}</name>
        <description>${escapeXml(desc)}</description>
        <Point><coordinates>${s.lng},${s.lat},0</coordinates></Point>
      </Placemark>`
        })
        .join('\n')
      return `    <Folder>
      <name>${escapeXml(chain)}</name>
${placemarks}
    </Folder>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>Carte de prospection</name>
${folders}
  </Document>
</kml>`
}
