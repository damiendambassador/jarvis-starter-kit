import { NextResponse } from 'next/server'

// Directions server-side : itinéraire le plus rapide en transports en commun
// (lignes empruntées, durée, tarif, temps de marche) d'une origine vers une destination.
const VEHICLE_LABELS: Record<string, string> = {
  BUS: 'Bus',
  INTERCITY_BUS: 'Bus',
  TROLLEYBUS: 'Bus',
  SUBWAY: 'M',
  METRO_RAIL: 'M',
  TRAM: 'T',
  HEAVY_RAIL: 'Train',
  COMMUTER_TRAIN: 'RER',
  HIGH_SPEED_TRAIN: 'Train',
  RAIL: 'Train',
}

export async function POST(req: Request) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return NextResponse.json({ error: 'GOOGLE_MAPS_SERVER_KEY manquante' }, { status: 500 })

  const { origin, destination } = await req.json().catch(() => ({}))
  if (!origin || !destination)
    return NextResponse.json({ error: 'origin et destination requis' }, { status: 400 })

  const fmt = (p: any) => (typeof p === 'string' ? p : `${p.lat},${p.lng}`)

  const url = new URL('https://maps.googleapis.com/maps/api/directions/json')
  url.searchParams.set('origin', fmt(origin))
  url.searchParams.set('destination', fmt(destination))
  url.searchParams.set('mode', 'transit')
  url.searchParams.set('departure_time', String(Math.floor(Date.now() / 1000)))
  url.searchParams.set('language', 'fr')
  url.searchParams.set('key', key)

  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()

  if (data.status !== 'OK' || !data.routes?.length)
    return NextResponse.json({ ok: false, status: data.status }, { status: 200 })

  const route = data.routes[0]
  const leg = route.legs?.[0]
  const steps = leg?.steps ?? []

  // Lignes de transport dans l'ordre (ex. "Bus 325", "M 14")
  const lines: { type: string; label: string }[] = []
  let walkSeconds = 0
  for (const s of steps) {
    if (s.travel_mode === 'WALKING') {
      walkSeconds += s.duration?.value ?? 0
    } else if (s.travel_mode === 'TRANSIT') {
      const v = s.transit_details?.line?.vehicle?.type ?? 'BUS'
      const short = s.transit_details?.line?.short_name ?? s.transit_details?.line?.name ?? ''
      lines.push({ type: VEHICLE_LABELS[v] ?? 'Bus', label: `${VEHICLE_LABELS[v] ?? 'Bus'} ${short}`.trim() })
    }
  }

  return NextResponse.json({
    ok: true,
    duration_text: leg?.duration?.text ?? null,
    fare_text: route.fare?.text ?? null,
    lines,
    walk_text: walkSeconds > 0 ? `${Math.round(walkSeconds / 60)} min à pied` : null,
  })
}
