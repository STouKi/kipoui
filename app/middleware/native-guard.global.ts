const ALLOWED_ROUTES = [
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/nouveau-mot-de-passe',
  '/chat',
  '/tableau-de-bord',
  '/confirm'
]

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  if (!config.public.isNative) return
  if (ALLOWED_ROUTES.some(r => to.path === r || to.path.startsWith(r + '/'))) return
  // The app has no landing page: signed-in users start on their dashboard
  return navigateTo(useSupabaseSession().value ? '/tableau-de-bord' : '/connexion')
})
