import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest, adminDb, sha256 } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { newPassword } = body

  if (!await validateAdminRequest(body)) {
    return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 401 })
  }

  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json({ error: 'Le nouveau mot de passe doit faire au moins 8 caractères' }, { status: 400 })
  }

  const { error } = await adminDb.from('admin_config').upsert({
    key: 'admin_password_hash',
    value: sha256(newPassword),
    updated_at: new Date().toISOString(),
  })

  if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })

  return NextResponse.json({ ok: true })
}
