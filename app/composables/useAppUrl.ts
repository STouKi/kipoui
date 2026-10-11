export function useAppUrl() {
  const config = useRuntimeConfig()

  // In native context, always use the canonical web URL so Supabase auth
  // emails link to kipoui.com rather than capacitor://localhost
  const getRedirectUrl = (path: string): string => {
    const base = config.public.isNative ? (config.public.appUrl as string) : useRequestURL().origin
    return `${base}${path}`
  }

  return { getRedirectUrl }
}
