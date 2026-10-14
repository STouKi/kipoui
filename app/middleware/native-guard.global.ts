const ALLOWED_ROUTES = [
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/nouveau-mot-de-passe',
  '/chat',
  '/tableau-de-bord',
  '/confirm',
  '/conditions-utilisation',
  '/confidentialite'
]

// Subscriptions are only managed on the website (companion app, App Store guideline 3.1.3(f))
const WEB_ONLY_ROUTES = ['/tableau-de-bord/parametres/abonnement']

export default defineNuxtRouteMiddleware((to) => {
  const config = useRuntimeConfig()
  if (!config.public.isNative) return
  if (WEB_ONLY_ROUTES.includes(to.path)) return navigateTo('/tableau-de-bord/parametres')
  if (ALLOWED_ROUTES.some(r => to.path === r || to.path.startsWith(r + '/'))) return
  // The app has no landing page: signed-in users start on their dashboard
  return navigateTo(useSupabaseSession().value ? '/tableau-de-bord' : '/connexion')
})
