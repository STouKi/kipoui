import { getAdminSupabaseClient } from '../repositories/supabaseRepository'
import { saveAppStoreSubscription } from '../repositories/customerRepository'
import { toAppStoreSubscription } from './appStoreSubscription'
import type { RevenueCatSubscriber } from './appStoreSubscription'

async function fetchSubscriber(appUserId: string) {
  const { revenuecat } = useRuntimeConfig()
  if (!revenuecat.secretKey) {
    throw createError({ statusCode: 500, statusMessage: 'RevenueCat is not configured' })
  }
  const { subscriber } = await $fetch<{ subscriber: RevenueCatSubscriber }>(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}`,
    { headers: { Authorization: `Bearer ${revenuecat.secretKey}` } }
  )
  return subscriber
}

// Copies the user's App Store subscription from RevenueCat into their customers row. The current
// state is always read from RevenueCat rather than from a notification, which can arrive late or
// twice. Returns null for an id without a Kipoui account
export async function syncAppStoreSubscription(profileId: string) {
  const { data: profile } = await getAdminSupabaseClient()
    .from('profiles')
    .select('id')
    .eq('id', profileId)
    .maybeSingle()
  if (!profile) return null

  const subscription = toAppStoreSubscription(await fetchSubscriber(profileId))
  await saveAppStoreSubscription(profileId, subscription)
  return subscription
}
