import { supabase } from './supabase'

type AuthedOpts = { adminPreview?: boolean }

/**
 * fetch avec en-tête d'authentification ajouté automatiquement :
 * - mode chauffeur : `Authorization: Bearer <access_token Supabase>`
 * - mode admin preview : `x-admin-token: <token>` (localStorage)
 */
export async function authedFetch(
  input: string,
  init: RequestInit = {},
  opts: AuthedOpts = {},
): Promise<Response> {
  const headers = new Headers(init.headers)

  if (opts.adminPreview) {
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
    if (adminToken) headers.set('x-admin-token', adminToken)
  } else {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) headers.set('authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, { ...init, headers })
}
