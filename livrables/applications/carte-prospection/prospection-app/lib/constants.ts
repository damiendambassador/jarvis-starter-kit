// ════════════════════════════════════════════════════════════
//  Modèle visuel : 3 axes découplés (au lieu d'un seul, la couleur,
//  comme dans My Maps). L'utilisateur choisit l'axe coloré via
//  le sélecteur « Colorer par ». Le nombre de marques reste
//  toujours lisible dans le pin (glyph).
// ════════════════════════════════════════════════════════════

// ── Enseignes (chaînes de caves) ───────────────────────────
export const CHAINS = [
  { name: 'Nicolas',               color: '#E11D48' },
  { name: 'Repaire de Bacchus',    color: '#7C3AED' },
  { name: 'Nysa',                  color: '#2563EB' },
  { name: 'V and B',               color: '#EA580C' },
  { name: 'La Vignery',            color: '#16A34A' },
  { name: 'Cavavin',               color: '#0891B2' },
  { name: 'Intercaves',            color: '#CA8A04' },
  { name: 'Le Comptoir Irlandais', color: '#15803D' },
  { name: 'Comptoir des Vignes',   color: '#DB2777' },
  { name: 'Autre',                 color: '#6B7280' },
] as const

export type ChainName = (typeof CHAINS)[number]['name']
export const CHAIN_NAMES = CHAINS.map((c) => c.name)
const CHAIN_COLOR_MAP: Record<string, string> = Object.fromEntries(CHAINS.map((c) => [c.name, c.color]))
export function chainColor(chain: string): string {
  return CHAIN_COLOR_MAP[chain] ?? '#6B7280'
}

// Code 2 lettres par enseigne, affiché dans le pin (identité enseigne).
const CHAIN_CODE_MAP: Record<string, string> = {
  Nicolas: 'NI',
  'Repaire de Bacchus': 'RB',
  Nysa: 'NY',
  'V and B': 'VB',
  'La Vignery': 'LV',
  Cavavin: 'CA',
  Intercaves: 'IN',
  'Le Comptoir Irlandais': 'CI',
  'Comptoir des Vignes': 'CV',
  Autre: '··',
}
export function chainCode(chain: string): string {
  return CHAIN_CODE_MAP[chain] ?? '··'
}

// Mots-clés pour retrouver l'enseigne depuis un texte libre (nom de calque KML,
// nom de magasin…). Tolérant aux variantes : « Comptoir Irlandais » sans « Le »,
// « Intercave » au singulier, « V&B », etc.
const CHAIN_KEYWORDS: Record<string, string[]> = {
  Nicolas: ['nicolas'],
  'Repaire de Bacchus': ['bacchus', 'repaire'],
  Nysa: ['nysa'],
  'V and B': ['v and b', 'v&b', 'vandb', 'v et b', 'v & b'],
  'La Vignery': ['vignery'],
  Cavavin: ['cavavin'],
  Intercaves: ['intercave'],
  'Le Comptoir Irlandais': ['irlandais'],
  'Comptoir des Vignes': ['des vignes', 'comptoir des vignes'],
}
export function chainFromText(text: string | null | undefined): string {
  if (!text) return 'Autre'
  const t = text.toLowerCase()
  for (const [chain, kws] of Object.entries(CHAIN_KEYWORDS)) {
    if (kws.some((k) => t.includes(k))) return chain
  }
  return 'Autre'
}

// ── Statut MAGASIN (lié à la visite uniquement, jamais aux marques) ──
// Volontairement minimal pour éviter toute contradiction : l'état d'une
// marque se gère au niveau de la marque (voir BRAND_STATUSES plus bas).
export const STATUSES = [
  { name: 'À prospecter', color: '#94A3B8' }, // jamais visité
  { name: 'Visité',       color: '#3B82F6' }, // je suis passé
  { name: 'Fermé',        color: '#1F2937' }, // n'existe plus / fermé
] as const

export type StatusName = (typeof STATUSES)[number]['name']
export const STATUS_NAMES = STATUSES.map((s) => s.name)
export const DEFAULT_STATUS: StatusName = 'À prospecter'
const STATUS_COLOR_MAP: Record<string, string> = Object.fromEntries(STATUSES.map((s) => [s.name, s.color]))
export function statusColor(status: string): string {
  return STATUS_COLOR_MAP[status] ?? '#94A3B8'
}

// ── Statut d'une MARQUE dans un magasin (le vrai cycle commercial) ──
export const BRAND_STATUSES = [
  { name: 'Présent',  color: '#3B82F6' }, // déjà référencé (avant moi)
  { name: 'En cours', color: '#F59E0B' }, // je travaille à le référencer
  { name: 'Gagné',    color: '#16A34A' }, // nouvelle DN que j'ai placée (vert = gain)
  { name: 'Refusé',   color: '#DC2626' }, // pas intéressé pour cette marque
] as const

export type BrandStatus = (typeof BRAND_STATUSES)[number]['name']
export const BRAND_STATUS_NAMES = BRAND_STATUSES.map((s) => s.name)
export const DEFAULT_BRAND_STATUS: BrandStatus = 'Présent'
const BRAND_STATUS_COLOR_MAP: Record<string, string> = Object.fromEntries(BRAND_STATUSES.map((s) => [s.name, s.color]))
export function brandStatusColor(status: string | null | undefined): string {
  return status ? BRAND_STATUS_COLOR_MAP[status] ?? '#D1D5DB' : '#D1D5DB'
}
// Marque « sur l'étagère » (compte dans la pénétration) : présente ou gagnée.
export const ON_SHELF_STATUSES = ['Présent', 'Gagné']

// ── Dégradés séquentiels pour les comptes (clair → foncé) ───
// Ordonnés par luminosité = lisibles y compris en daltonisme.
// 0 = gris clair neutre (opportunité), jamais rouge.
const PENETRATION_RAMP = ['#E5E7EB', '#D2A06E', '#BC7A4A', '#8F5A30', '#5C3A1E'] // bronze
const NEW_DN_RAMP =      ['#E5E7EB', '#5EB89A', '#2E9E78', '#17795A', '#0E3F40'] // teal (croissance)

function rampColor(ramp: string[], count: number): string {
  return ramp[Math.min(count, ramp.length - 1)]
}
export function penetrationColor(count: number): string {
  return rampColor(PENETRATION_RAMP, count)
}
export function newDnColor(count: number): string {
  return rampColor(NEW_DN_RAMP, count)
}

// ── Sélecteur « Colorer par » ──────────────────────────────
export const COLOR_MODES = [
  { key: 'status',      label: 'Statut' },
  { key: 'penetration', label: 'Nb de marques' },
  { key: 'newdn',       label: 'Nouvelles DN' },
  { key: 'chain',       label: 'Enseigne' },
] as const
export type ColorMode = (typeof COLOR_MODES)[number]['key']
export const DEFAULT_COLOR_MODE: ColorMode = 'status'

// ── Marques + références suggérées ─────────────────────────
// Listes de départ éditables ; la saisie libre reste possible.
// Références alignées sur le catalogue Edrington France 2026.
export const BRANDS: { name: string; references: string[] }[] = [
  {
    name: 'Macallan',
    references: [
      'Macallan Double Cask 12 ans',
      'Macallan Double Cask 15 ans',
      'Macallan Double Cask 18 ans',
      'Macallan Double Cask 30 ans',
      'Macallan Sherry Oak 12 ans',
      'Macallan Sherry Oak 18 ans',
      'Macallan Sherry Oak 25 ans',
      'Macallan Sherry Oak 30 ans',
      'Macallan M',
      'Macallan M Black',
      'Macallan M Copper',
      'Macallan Rare Cask',
      'Macallan Classic Cut',
      'Macallan Harmony V',
      'Macallan A Night On Earth - The First Light',
      'Macallan Distil Your World Paris',
    ],
  },
  {
    name: 'Glenrothes',
    references: ['Glenrothes 15 ans', 'Glenrothes 18 ans', 'Glenrothes 25 ans', 'Glenrothes 32 ans', 'Glenrothes The 42'],
  },
  {
    name: 'Highland Park',
    references: [
      'Highland Park 12 ans Viking Honour',
      'Highland Park 15 ans',
      'Highland Park 18 ans',
      'Highland Park Cask Strength Heather',
      'Highland Park 21 ans',
      'Highland Park 25 ans',
      'Highland Park 30 ans',
      'Highland Park 40 ans',
      'Highland Park 54 ans',
      'Highland Park Between You & I',
    ],
  },
  {
    name: 'Brugal',
    references: ['Brugal 1888', 'Brugal Maestro Reserva', 'Brugal Visionaria 2', 'Andrés Brugal 2nd Edition'],
  },
  { name: 'Gin N°3', references: ['Gin N°3 London Dry Organic'] },
  {
    name: 'Valdespino',
    references: ['Valdespino Inocente Fino', 'Valdespino Pedro Ximénez El Candado', 'Valdespino Vermouth Origen'],
  },
  { name: 'Autre', references: [] },
]

export const BRAND_NAMES = BRANDS.map((b) => b.name)
export function referencesForBrand(brand: string): string[] {
  return BRANDS.find((b) => b.name === brand)?.references ?? []
}

// ── Carte : centrage France ────────────────────────────────
export const FRANCE_CENTER = { lat: 46.6, lng: 2.4 }
export const FRANCE_ZOOM = 6

// ── Couleur de pin selon le mode choisi ────────────────────
// `presentCount` = marques marquées Présent ; `newDnCount` = placements « nouvelle DN ».
export function pinColor(
  mode: ColorMode,
  opts: { chain: string; status: string; presentCount: number; newDnCount: number },
): string {
  switch (mode) {
    case 'chain':       return chainColor(opts.chain)
    case 'penetration': return penetrationColor(opts.presentCount)
    case 'newdn':       return newDnColor(opts.newDnCount)
    case 'status':
    default:            return statusColor(opts.status)
  }
}
