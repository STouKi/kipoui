import { FetchError, ofetch } from 'ofetch'
import { API_URL } from './config'
import { supabase } from './supabase'

// The API identifies the user by their Supabase access token (requireAuth on the server)
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession()
  return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}
}

export const api = ofetch.create({
  baseURL: API_URL,
  async onRequest({ options }) {
    for (const [name, value] of Object.entries(await getAuthHeaders())) {
      options.headers.set(name, value)
    }
  },
  // A session the server refuses (account deleted, sessions revoked) would otherwise show
  // "Connexion impossible" forever. Supabase confirms it first: offline, nothing changes
  async onResponseError({ response }) {
    if (response.status !== 401) return
    const { error } = await supabase.auth.getUser()
    if (error?.status === 401 || error?.status === 403) {
      // The router then shows the login screen (App.vue)
      await supabase.auth.signOut({ scope: 'local' })
    }
  }
})

// Server errors (h3's createError) carry their reason in statusMessage
export function getErrorReason(error: unknown): string | undefined {
  if (error instanceof FetchError) {
    return error.data?.statusMessage ?? error.statusMessage
  }
  // The chat transport puts the response body in the message
  if (error instanceof Error && error.message.startsWith('{')) {
    try {
      return JSON.parse(error.message).statusMessage
    } catch {
      return undefined
    }
  }
  return undefined
}
