import { NextResponse } from 'next/server'

// Géocodage server-side : convertit une adresse en lat/lng + composants.
// La clé Google reste côté serveur (jamais exposée au navigateur).
export async function POST(req: Request) {
  const key = process.env.GOOGLE_MAPS_SERVER_KEY
  if (!key) return NextResponse.json({ error: 'GOOGLE_MAPS_SERVER_KEY manquante' }, { status: 500 })

  const { address } = await req.json().catch(() => ({}))
  if (!address || typeof address !== 'string')
    return NextResponse.json({ error: 'Adresse requise' }, { status: 400 })

  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json')
  url.searchParams.set('address', address)
  url.searchParams.set('region', 'fr')
  url.searchParams.set('language', 'fr')
  url.searchParams.set('key', key)

  const res = await fetch(url, { cache: 'no-store' })
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.length)
    return NextResponse.json({ error: 'Adresse introuvable', status: data.status }, { status: 404 })

  const r = data.results[0]
  const comp = (type: string) =>
    r.address_components?.find((c: any) => c.types?.includes(type))?.long_name ?? null

  return NextResponse.json({
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    formatted_address: r.formatted_address,
    city: comp('locality') ?? comp('administrative_area_level_2'),
    postal_code: comp('postal_code'),
  })
}
