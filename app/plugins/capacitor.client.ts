export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  if (!config.public.isNative) return

  const { Capacitor } = await import('@capacitor/core')
  if (!Capacitor.isNativePlatform()) return

  // Enables native-only styles such as .capacitor-ios in main.css
  document.documentElement.classList.add(`capacitor-${Capacitor.getPlatform()}`)

  const apiURL = config.public.appUrl as string
  const getAuthHeaders = useApiAuthHeaders()

  // Override the global $fetch (also used by useFetch) so API calls reach the remote server
  // with the user's token. Other requests, such as Nuxt's own assets, stay local.
  globalThis.$fetch = $fetch.create({
    async onRequest({ request, options }) {
      if (typeof request !== 'string' || !request.startsWith('/api/')) return

      options.baseURL = apiURL
      for (const [name, value] of Object.entries(await getAuthHeaders())) {
        options.headers.set(name, value)
      }
    }
  })

  // Sync StatusBar style with the app's color mode
  const { StatusBar, Style } = await import('@capacitor/status-bar')
  const colorMode = useColorMode()
  const syncStatusBar = () =>
    StatusBar.setStyle({ style: colorMode.value === 'dark' ? Style.Dark : Style.Light })
  watch(colorMode, syncStatusBar, { immediate: true })

  // Refresh Supabase session when the app returns to foreground
  const { App } = await import('@capacitor/app')
  const supabase = useSupabaseClient()
  App.addListener('resume', () => supabase.auth.refreshSession())
})
