import { requireAuth } from '../../repositories/supabaseRepository'
import { syncAppStoreSubscription } from '../../lib/revenuecat'

// Called by the app right after a purchase or a restore, so the coach opens without waiting for
// RevenueCat's notification
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const subscription = await syncAppStoreSubscription(user.id)
  return { subscription }
})
