import { NextResponse } from 'next/server'

// Distance Matrix server-side : distance + durée routières d'une origine
// vers une liste de destinations (max ~25 par appel côté Google).
export async function POST(req: Request) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return NextResponse.json({ error: 'GOOGLE_MAPS_SERVER_KEY manquante' }, { status: 500 })

  const { origin, destinations } = await req.json().catch(() => ({}))
  if (!origin || !Array.isArray(destinations) || destinations.length === 0)
    return NextResponse.json({ error: 'origin et destinations[] requis' }, { status: 400 })

  const fmt = (p: any) => (typeof p === 'string' ? p : `${p.lat},${p.lng}`)

  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
  url.searchParams.set('origins', fmt(origin))
  url.searchParams.set('destinations', destinations.map(fmt).join('|'))
  url.searchParams.set('mode', 'driving')
  url.searchParams.set('language', 'fr')
  url.searchParams.set('key', key)

  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()

  if (data.status !== 'OK')
    return NextResponse.json({ error: 'Distance Matrix échec', status: data.status }, { status: 502 })

  const row = data.rows?.[0]?.elements ?? []
  const results = row.map((el: any, i: number) => ({
    index: i,
    ok: el.status === 'OK',
    distance_m: el.distance?.value ?? null,
    distance_text: el.distance?.text ?? null,
    duration_s: el.duration?.value ?? null,
    duration_text: el.duration?.text ?? null,
  }))

  return NextResponse.json({ results })
}
