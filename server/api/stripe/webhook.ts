import type { H3Event } from 'h3'
import type Stripe from 'stripe'
import { getServerStripe, handleError } from '../../repositories/stripeRepository'
import { getCustomerByStripeCustomerId, updateCustomer } from '../../repositories/customerRepository'

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

    switch (stripeEvent.type) {
      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event, stripeEvent.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event, stripeEvent.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event, stripeEvent.data.object as Stripe.Subscription)
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

async function handleTrialWillEnd(event: H3Event, subscription: Stripe.Subscription) {
  const customer = await getCustomerByStripeCustomerId(event, subscription.customer as string)
  if (!customer) return

  const hasPaymentMethod = !!subscription.default_payment_method

  if (!hasPaymentMethod) {
    await updateCustomer(event, customer.id, {
      subscription_status: 'waiting_payment'
    })
  }
}

async function handleSubscriptionUpdated(event: H3Event, subscription: Stripe.Subscription) {
  const customer = await getCustomerByStripeCustomerId(event, subscription.customer as string)
  if (!customer) return

  if (subscription.status === 'trialing') {
    await updateCustomer(event, customer.id, {
      subscription_status: 'trial'
    })
  } else if (subscription.status === 'active') {
    await updateCustomer(event, customer.id, {
      subscription_status: 'active'
    })
  } else if (subscription.status === 'incomplete' || subscription.status === 'past_due' || subscription.status === 'unpaid') {
    await updateCustomer(event, customer.id, {
      subscription_status: 'waiting_payment'
    })
  } else if (subscription.status === 'canceled') {
    await updateCustomer(event, customer.id, {
      subscription_status: 'cancelled'
    })
  }
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

async function handleSubscriptionCreated(event: H3Event, subscription: Stripe.Subscription) {
  const customer = await getCustomerByStripeCustomerId(event, subscription.customer as string)
  if (!customer) return

  console.log('Subscription status:', subscription.status)

  let subscriptionStatus = 'active'
  if (subscription.status === 'trialing') {
    subscriptionStatus = 'trial'
  }

  await updateCustomer(event, customer.id, {
    subscription_status: subscriptionStatus
  })
}
