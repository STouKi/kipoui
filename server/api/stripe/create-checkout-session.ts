import type Stripe from 'stripe'
import { getServerStripe, handleError, getOrCreateStripeCustomer } from '../../repositories/stripeRepository'
import { getAuthUser } from '../../repositories/supabaseRepository'
import { getCustomerByProfileId } from '../../repositories/customerRepository'
import { hasActiveSubscription } from '../../lib/subscription'

export default defineEventHandler(async (event) => {
  const { priceId, trial } = getQuery(event)

  if (!priceId || typeof priceId !== 'string') {
    return {
      sessionId: null,
      error: 'Le paramètre priceId est requis et doit être une chaîne de caractères'
    }
  }

  try {
    // A second subscription would be charged on top of the first one, Stripe or App Store
    const user = await getAuthUser(event)
    if (user && hasActiveSubscription(await getCustomerByProfileId(event, user.id))) {
      return {
        sessionId: null,
        error: 'Vous avez déjà un abonnement actif.'
      }
    }

    const stripe = await getServerStripe(event)
    const config = useRuntimeConfig()

    const customerId = await getOrCreateStripeCustomer(event)

    if (!customerId) {
      throw new Error('Impossible de créer ou récupérer le client Stripe')
    }

    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      customer: customerId,
      line_items: [
        {
          price: priceId as string,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${config.public.appUrl}/tableau-de-bord?checkout={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.public.appUrl}/tableau-de-bord?checkout=cancel`
    }

    if (trial === 'true' || trial === true) {
      sessionOptions.subscription_data = {
        trial_period_days: 7,
        trial_settings: {
          end_behavior: {
            missing_payment_method: 'pause'
          }
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionOptions)

    return {
      sessionId: session.id,
      error: null
    }
  } catch (e) {
    handleError(e, 'Erreur lors de la création de la session Checkout')
    return {
      sessionId: null,
      error: e instanceof Error ? e.message : 'Une erreur est survenue'
    }
  }
})
