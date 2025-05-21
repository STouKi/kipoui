import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'

export async function getUser(event: H3Event) {
  const user = await serverSupabaseUser(event)

  if (!user) {
    console.error('User not found')
    return null
  }

  return user
}
