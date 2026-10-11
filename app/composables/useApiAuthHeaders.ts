export function useApiAuthHeaders() {
  const config = useRuntimeConfig()
  const supabase = useSupabaseClient()

  // The native app calls the API cross-origin, where no session cookie is sent, so it
  // authenticates with the Supabase access token instead. On the web, the cookie is enough.
  return async (): Promise<Record<string, string>> => {
    if (!config.public.isNative) return {}

    const { data } = await supabase.auth.getSession()
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {}
  }
}
