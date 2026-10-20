import { timingSafeEqual } from 'node:crypto'
import { isUserId } from '../../lib/appStoreSubscription'
import { syncAppStoreSubscription } from '../../lib/revenuecat'

function sameSecret(received: string, expected: string) {
  const a = Buffer.from(received)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

// RevenueCat's notifications for the subscriptions bought in the iOS app (purchase, renewal,
// cancellation, expiration, billing issue, transfer...). Each one only says that a user's
// subscription changed: its state is then read from RevenueCat (syncAppStoreSubscription)
export default defineEventHandler(async (event) => {
  // The authorization header value set in the RevenueCat dashboard
  const { revenuecat } = useRuntimeConfig()
  const authorization = getHeader(event, 'authorization') ?? ''
  if (!revenuecat.webhookSecret || !sameSecret(authorization, `Bearer ${revenuecat.webhookSecret}`)) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const body = await readBody(event)
  const notification = body?.event
  if (!notification || notification.type === 'TEST') return { received: true }

  const userIds = new Set([
    notification.app_user_id,
    notification.original_app_user_id,
    ...(Array.isArray(notification.transferred_from) ? notification.transferred_from : []),
    ...(Array.isArray(notification.transferred_to) ? notification.transferred_to : [])
  ].filter(isUserId))

  // An error answers 500: RevenueCat sends the notification again later
  for (const userId of userIds) {
    await syncAppStoreSubscription(userId)
  }
  return { received: true }
})
