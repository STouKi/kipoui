import type Stripe from 'stripe'
import { getServerStripe, handleError } from '../../repositories/stripeRepository'
import { getAuthUser } from '../../repositories/supabaseRepository'
import { getCustomerByProfileId, updateCustomer } from '../../repositories/customerRepository'

export default defineEventHandler(async (event) => {
  const { checkout } = getQuery(event)

  try {
    const user = await getAuthUser(event)
    if (!user) {
      throw new Error('Utilisateur non authentifié')
    }

    const customerData = await getCustomerByProfileId(event, user.id)
    if (!customerData) {
      throw new Error('Client non trouvé')
    }

    if (checkout === 'cancel') {
      return {
        success: true,
        status: 'cancelled',
        message: 'Processus de paiement abandonné'
      }
    }

    const stripe = await getServerStripe(event)
    const session = await stripe.checkout.sessions.retrieve(checkout as string, {
      expand: ['subscription', 'payment_intent']
    })

    if (session.customer !== customerData.stripe_customer_id) {
      throw new Error('Session non valide pour cet utilisateur')
    }

    const subscription = session.subscription as Stripe.Subscription
    const paymentIntent = session.payment_intent as Stripe.PaymentIntent

    let paymentMethodId = null
    if (subscription?.default_payment_method) {
      paymentMethodId = typeof subscription.default_payment_method === 'string'
        ? subscription.default_payment_method
        : subscription.default_payment_method.id
    } else if (paymentIntent?.payment_method) {
      paymentMethodId = typeof paymentIntent.payment_method === 'string'
        ? paymentIntent.payment_method
        : paymentIntent.payment_method.id
    }

    const subscriptionData = subscription as unknown as { current_period_end?: number }

    const subscriptionEndDate = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000).toISOString()
      : null

    await updateCustomer(event, customerData.id, {
      stripe_subscription_id: subscription?.id || '',
      payment_method_id: paymentMethodId,
      subscription_end_date: subscriptionEndDate,
      last_payment_date: new Date().toISOString()
    })

    return {
      success: true,
      status: 'completed',
      message: 'Abonnement activé avec succès'
    }
  } catch (e) {
    handleError(e, 'Erreur lors de la vérification de la session Checkout')
    return {
      success: false,
      error: e instanceof Error ? e.message : ''
    }
  }
})
