import { createHash, randomUUID, timingSafeEqual } from 'crypto'
import { createClient } from '@supabase/supabase-js'

export const adminDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export function sha256(str: string) {
  return createHash('sha256').update(str).digest('hex')
}

export async function validateAdmin(email: string, password: string): Promise<boolean> {
  if (email !== process.env.ADMIN_EMAIL) return false
  const { data } = await adminDb
    .from('admin_config')
    .select('value')
    .eq('key', 'admin_password_hash')
    .single()
  if (data?.value) {
    const a = Buffer.from(sha256(password))
    const b = Buffer.from(data.value as string)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  }
  return password === process.env.ADMIN_PASSWORD
}

/** Crée une session admin valide 24h — retourne le token. */
export async function createAdminSession(email: string): Promise<string> {
  const token     = randomUUID()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  await adminDb.from('admin_config').upsert({
    key:   `session_${token}`,
    value: JSON.stringify({ email, expiresAt }),
  })
  return token
}

/** Valide un token de session admin — retourne true si valide et non expiré. */
export async function validateAdminSession(token: string): Promise<boolean> {
  if (!token) return false
  const { data } = await adminDb
    .from('admin_config')
    .select('value')
    .eq('key', `session_${token}`)
    .single()
  if (!data?.value) return false
  try {
    const { email, expiresAt } = JSON.parse(data.value as string)
    if (email !== process.env.ADMIN_EMAIL) return false
    if (new Date(expiresAt) < new Date()) {
      adminDb.from('admin_config').delete().eq('key', `session_${token}`).then(() => {})
      return false
    }
    return true
  } catch {
    return false
  }
}

/** Accepte { adminToken } OU { adminEmail, adminPassword } OU { email, password } — à utiliser dans toutes les routes admin. */
export async function validateAdminRequest(body: Record<string, string>): Promise<boolean> {
  if (body.adminToken)  return validateAdminSession(body.adminToken)
  if (body.adminEmail && body.adminPassword) return validateAdmin(body.adminEmail, body.adminPassword)
  if (body.email && body.password) return validateAdmin(body.email, body.password)
  return false
}
