import { supabase } from './supabase'

export async function getSessionDriver() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  const { data } = await supabase
    .from('drivers')
    .select('*')
    .eq('user_id', session.user.id)
    .single()
  return data
}
