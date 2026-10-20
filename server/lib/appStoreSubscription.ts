// The entitlement that opens the coach, set up in the RevenueCat dashboard
export const ENTITLEMENT = 'coach'

// Supabase user ids, which the app gives RevenueCat as app user ids. RevenueCat's anonymous ids
// ($RCAnonymousID:...) belong to no account
const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUserId(value: unknown): value is string {
  return typeof value === 'string' && USER_ID.test(value)
}

// The parts of RevenueCat's subscriber (GET /v1/subscribers/:id) used here
export interface RevenueCatSubscriber {
  entitlements?: Record<string, {
    expires_date: string | null
    grace_period_expires_date?: string | null
    product_identifier: string
  }>
  subscriptions?: Record<string, {
    period_type?: string
    unsubscribe_detected_at?: string | null
    billing_issues_detected_at?: string | null
  }>
}

export interface AppStoreSubscription {
  app_store_status: 'active' | 'trialing' | 'expired' | null
  app_store_expires_at: string | null
  app_store_will_renew: boolean | null
  app_store_product_id: string | null
}

// What the customers row keeps of the subscriber: the entitlement's state, the end of its period
// (grace period included) and whether it renews
export function toAppStoreSubscription(subscriber: RevenueCatSubscriber, now = new Date()): AppStoreSubscription {
  const entitlement = subscriber.entitlements?.[ENTITLEMENT]
  if (!entitlement) {
    return { app_store_status: null, app_store_expires_at: null, app_store_will_renew: null, app_store_product_id: null }
  }

  const subscription = subscriber.subscriptions?.[entitlement.product_identifier]
  const ends = [entitlement.expires_date, entitlement.grace_period_expires_date]
    .filter((date): date is string => !!date)
    .sort()
    .at(-1) ?? null
  // No end date: granted for good (a promotional entitlement from the dashboard)
  const active = !entitlement.expires_date || (!!ends && new Date(ends) > now)

  return {
    app_store_status: active ? (subscription?.period_type === 'trial' ? 'trialing' : 'active') : 'expired',
    app_store_expires_at: ends,
    app_store_will_renew: active && !subscription?.unsubscribe_detected_at && !subscription?.billing_issues_detected_at,
    app_store_product_id: entitlement.product_identifier
  }
}
