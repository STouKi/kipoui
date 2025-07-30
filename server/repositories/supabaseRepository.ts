import type { H3Event } from 'h3'
import type { Database as PublicDatabase } from '../types/public'
import type { Database as VecsDatabase } from '../types/vecs'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export async function getPublicSupabaseClient(event: H3Event) {
  const client = await serverSupabaseClient<PublicDatabase>(event)
  return client
}

export async function getVecsSupabaseClient(event: H3Event) {
  const client = await serverSupabaseClient<VecsDatabase>(event)
  return client
}

export async function getAuthUser(event: H3Event) {
  const user = await serverSupabaseUser(event)

  if (!user) {
    console.error('User not found')
    return null
  }

  return user
}

export function handleError(error: unknown, message: string = 'Database error') {
  console.error(`${message}:`, error)
  throw createError({
    statusCode: 500,
    message
  })
}

export async function requireAuth(event: H3Event) {
  const user = await getAuthUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  return user
}
