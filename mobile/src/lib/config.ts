import { Capacitor } from '@capacitor/core'

// Public values, already in the website's JavaScript: the anon key only allows what the
// database's row level security allows
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://iuvkhpapjbziviyvzjge.supabase.co'
export const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dmtocGFwamJ6aXZpeXZ6amdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc0NzQyMTksImV4cCI6MjA2MzA1MDIxOX0.O2ZDphfP9Jw9C5MmsX_ER1wT3vuub3ZdSx8YT_M7YDY'

// Supabase auth emails link to the website
export const WEB_URL = 'https://kipoui.com'

// The native app calls the website's API directly. In the browser, the dev server forwards /api
// to it (vite.config.ts)
export const API_URL = Capacitor.isNativePlatform() ? (import.meta.env.VITE_API_URL || WEB_URL) : ''

export const CONTACT_EMAIL = 'contact@kipoui.com'

// The website's legal pages, in their version without the site's navigation (/app/...)
export const PRIVACY_URL = `${WEB_URL}/app/confidentialite`
export const TERMS_URL = `${WEB_URL}/app/conditions-utilisation`

// Where the links of the auth emails sent from the app lead (Supabase must allow these URLs)
export const ACCOUNT_CONFIRMED_URL = `${WEB_URL}/app/compte-confirme`
export const NEW_PASSWORD_URL = `${WEB_URL}/nouveau-mot-de-passe`

// RevenueCat's public key for the iOS app (in-app subscriptions): RevenueCat dashboard, Project
// settings, API keys, App Store. Public like Supabase's anon key: it only lists offers and starts
// purchases, which the server checks with RevenueCat's secret key
export const REVENUECAT_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || 'appl_uvDcHLMFRkPvTCDFPcBuBrngSxA'
