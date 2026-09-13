export default defineNuxtPlugin(async () => {
  const config = useRuntimeConfig()
  if (!config.public.isNative) return

  const { Capacitor } = await import('@capacitor/core')
  if (!Capacitor.isNativePlatform()) return

  const baseURL = config.public.appUrl as string

  // Override the global $fetch so all $fetch() calls in stores use the absolute API URL
  globalThis.$fetch = $fetch.create({ baseURL })

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
