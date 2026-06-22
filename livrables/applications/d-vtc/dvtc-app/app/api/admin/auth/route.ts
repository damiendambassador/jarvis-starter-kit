import { NextRequest, NextResponse } from 'next/server'
import { validateAdmin, createAdminSession } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Identifiants manquants' }, { status: 400 })
  }
  const valid = await validateAdmin(email, password)
  if (!valid) {
    return NextResponse.json({ error: 'Identifiants incorrects' }, { status: 401 })
  }
  const token = await createAdminSession(email)
  return NextResponse.json({ token })
}
