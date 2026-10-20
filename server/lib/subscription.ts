import type { Database } from '../types/public'

type Customer = Database['public']['Tables']['customers']['Row']

const ACTIVE_STATUSES = ['active', 'trialing']

// Access to the coach: a subscription bought on the website (Stripe) or in the iOS app (App
// Store, through RevenueCat). Same rule in the website's user store and in the app's useProfile.
// The App Store one also needs its period ahead, should an expiration notification be missed
export function hasActiveSubscription(
  customer: Pick<Customer, 'subscription_status' | 'app_store_status' | 'app_store_expires_at'> | null | undefined,
  now = new Date()
) {
  if (!customer) return false
  if (ACTIVE_STATUSES.includes(customer.subscription_status ?? '')) return true
  return ACTIVE_STATUSES.includes(customer.app_store_status ?? '')
    && (!customer.app_store_expires_at || new Date(customer.app_store_expires_at) > now)
}
