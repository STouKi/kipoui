export function useAppUrl() {
  // Supabase auth emails link back to the site the request came from
  const getRedirectUrl = (path: string): string => `${useRequestURL().origin}${path}`

  return { getRedirectUrl }
}
