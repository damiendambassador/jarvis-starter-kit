import { createHash } from 'crypto'
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
  if (data?.value) return sha256(password) === data.value
  return password === process.env.ADMIN_PASSWORD
}
