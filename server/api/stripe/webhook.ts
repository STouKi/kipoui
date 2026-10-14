import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import { getServerStripe, handleError, toSubscriptionStatus } from '../../repositories/stripeRepository'
import { getCustomerByStripeCustomerId, updateCustomer } from '../../repositories/customerRepository'
import { actAsServiceRole } from '../../repositories/supabaseRepository'

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig()
    const stripe = await getServerStripe(event)

    const signature = getRequestHeader(event, 'stripe-signature')
    if (!signature) {
      throw new Error('Signature Stripe manquante')
    }

    const rawBody = await readRawBody(event)

    let stripeEvent: Stripe.Event
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        rawBody as string,
        signature,
        config.stripe.webhookSecret
      )
    } catch (err) {
      console.error('Erreur de validation de la signature webhook:', err)
      throw new Error('Signature webhook invalide')
    }

    // Stripe calls without a user session, so RLS would hide every customer: the signature
    // above authenticates the request, and the repositories act as the service role
    actAsServiceRole(event)

    // A trial ending without a payment method pauses the subscription (missing_payment_method:
    // 'pause'), which subscription.updated reports: access stays open until then
    switch (stripeEvent.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event, stripeEvent.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_failed':
        await handlePaymentFailed(event, stripeEvent.data.object as Stripe.Invoice)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event, stripeEvent.data.object as Stripe.Subscription)
        break
    }

    return { received: true }
  } catch (e) {
    handleError(e, 'Erreur lors du traitement du webhook Stripe')
    return { error: e instanceof Error ? e.message : 'Une erreur est survenue' }
  }
})

async function handleSubscriptionChange(event: H3Event, subscription: Stripe.Subscription) {
  const customer = await getCustomerByStripeCustomerId(event, subscription.customer as string)
  if (!customer) return

  await updateCustomer(event, customer.id, {
    subscription_status: toSubscriptionStatus(subscription.status),
    stripe_subscription_id: subscription.id
  })
}

async function handlePaymentFailed(event: H3Event, invoice: Stripe.Invoice) {
  if (!invoice.customer) return

  const customer = await getCustomerByStripeCustomerId(event, invoice.customer as string)
  if (!customer) return

  await updateCustomer(event, customer.id, {
    subscription_status: 'waiting_payment'
  })
}

async function handleSubscriptionDeleted(event: H3Event, subscription: Stripe.Subscription) {
  const customer = await getCustomerByStripeCustomerId(event, subscription.customer as string)
  if (!customer) return

  await updateCustomer(event, customer.id, {
    subscription_status: 'cancelled',
    stripe_subscription_id: null
  })
}
