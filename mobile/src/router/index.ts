import { createRouter, createWebHistory } from '@ionic/vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { session } from '@/lib/session'
import TabsPage from '@/views/TabsPage.vue'
import CoachPage from '@/views/CoachPage.vue'
import RepasPage from '@/views/RepasPage.vue'
import SuiviPage from '@/views/SuiviPage.vue'
import ProfilPage from '@/views/ProfilPage.vue'
import ConversationPage from '@/views/ConversationPage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    // Login and signup: only reachable while signed out
    public?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/tabs/coach' },
  {
    path: '/connexion',
    component: () => import('@/views/LoginPage.vue'),
    meta: { public: true }
  },
  {
    path: '/inscription',
    component: () => import('@/views/SignupPage.vue'),
    meta: { public: true }
  },
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      { path: '', redirect: '/tabs/coach' },
      { path: 'coach', component: CoachPage },
      { path: 'repas', component: RepasPage },
      { path: 'suivi', component: SuiviPage },
      { path: 'profil', component: ProfilPage },
      { path: 'profil/informations', component: () => import('@/views/profil/InformationsPage.vue') },
      { path: 'profil/mensurations', component: () => import('@/views/profil/MensurationsPage.vue') },
      { path: 'profil/objectifs', component: () => import('@/views/profil/ObjectifsPage.vue') },
      { path: 'profil/habitudes', component: () => import('@/views/profil/HabitudesPage.vue') },
      { path: 'profil/sante', component: () => import('@/views/profil/SantePage.vue') },
      { path: 'profil/preferences', component: () => import('@/views/profil/PreferencesPage.vue') },
      { path: 'profil/ia', component: () => import('@/views/profil/AiConsentPage.vue') },
      { path: 'profil/securite', component: () => import('@/views/profil/SecurityPage.vue') }
    ]
  },
  // Full screen, above the tabs. "nouvelle" starts a new conversation
  { path: '/conversation/:id', component: ConversationPage }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.beforeEach((to) => {
  if (!to.meta.public && !session.value) return '/connexion'
  if (to.meta.public && session.value) return '/tabs/coach'
})

export default router
