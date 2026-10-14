import type { H3Event } from 'h3'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database as PublicDatabase } from '../types/public'
import type { Database as VecsDatabase } from '../types/vecs'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

// Bypasses RLS: only for trusted server code acting without a user session
export function getAdminSupabaseClient() {
  const { supabase } = useRuntimeConfig()
  return createClient<PublicDatabase>(supabase.url, supabase.serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// The native app calls the API cross-origin, so no session cookie comes with its
// requests: it sends the Supabase access token as a Bearer header instead
function getBearerToken(event: H3Event) {
  const authorization = getHeader(event, 'authorization')
  return authorization?.startsWith('Bearer ') ? authorization.slice(7) : null
}

// Queries run as the token's user, like with the cookie-based client, so RLS still applies
function getBearerSupabaseClient<T>(event: H3Event, token: string): SupabaseClient<T> {
  if (!event.context.supabaseBearerClient) {
    const { url, key } = useRuntimeConfig(event).public.supabase
    event.context.supabaseBearerClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { Authorization: `Bearer ${token}` } }
    })
  }

  return event.context.supabaseBearerClient
}

async function getSupabaseClient<T>(event: H3Event) {
  const token = getBearerToken(event)
  return token ? getBearerSupabaseClient<T>(event, token) : serverSupabaseClient<T>(event)
}

async function getBearerUser(event: H3Event, token: string) {
  const { data: { user } } = await getBearerSupabaseClient<PublicDatabase>(event, token).auth.getUser(token)
  return user
}

export async function getPublicSupabaseClient(event: H3Event) {
  const client = await getSupabaseClient<PublicDatabase>(event)
  return client
}

export async function getVecsSupabaseClient(event: H3Event) {
  const client = await getSupabaseClient<VecsDatabase>(event)
  return client
}

export async function getAuthUser(event: H3Event) {
  const token = getBearerToken(event)
  const user = token ? await getBearerUser(event, token) : await serverSupabaseUser(event)

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
