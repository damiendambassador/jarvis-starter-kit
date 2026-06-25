import { NextRequest } from 'next/server'
import { adminDb, validateAdminSession } from './admin-auth'

/**
 * Identité de l'appelant d'une route "acteur" (chauffeur ou admin).
 * - admin  : peut agir sur n'importe quel chauffeur / ressource (mode preview inclus).
 * - driver : ne peut agir que sur ses propres données (driverId dérivé du token, jamais du body).
 */
export type Actor =
  | { kind: 'admin' }
  | { kind: 'driver'; driverId: string }

/**
 * Résout l'appelant à partir des en-têtes de la requête.
 * - `x-admin-token`  → session admin (validateAdminSession)
 * - `Authorization: Bearer <jwt>` → token de session Supabase du chauffeur
 * Retourne null si aucune identité valide.
 */
export async function resolveActor(req: NextRequest): Promise<Actor | null> {
  const adminToken = req.headers.get('x-admin-token')
  if (adminToken && (await validateAdminSession(adminToken))) {
    return { kind: 'admin' }
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const { data: { user }, error } = await adminDb.auth.getUser(token)
    if (!error && user) {
      const { data: driver } = await adminDb
        .from('drivers')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (driver) return { kind: 'driver', driverId: driver.id }
    }
  }

  return null
}
