import type { H3Event } from 'h3'
import { getAuthUser } from './supabaseRepository'
import { getProfileById } from './profileRepository'
import { getCustomerByProfileId, createCustomer } from './customerRepository'
import { useServerStripe } from '#stripe/server'

export async function getServerStripe(event: H3Event) {
  const stripe = await useServerStripe(event)
  return stripe
}

export function handleError(error: unknown, message: string = 'Stripe error') {
  console.error(`${message}:`, error)
  throw createError({
    statusCode: 500,
    message
  })
}

/**
 * Crée ou récupère un client Stripe associé à l'utilisateur authentifié
 * @param event - L'événement H3 de la requête
 * @returns L'ID du client Stripe ou null en cas d'erreur
 */
export async function getOrCreateStripeCustomer(event: H3Event): Promise<string | null> {
  try {
    const user = await getAuthUser(event)
    if (!user) {
      throw new Error('Utilisateur non authentifié')
    }

    const profile = await getProfileById(event, user.id)
    if (!profile) {
      throw new Error('Profil utilisateur non trouvé')
    }

    const customerData = await getCustomerByProfileId(event, user.id)

    if (customerData?.stripe_customer_id) {
      return customerData.stripe_customer_id
    }

    const stripe = await getServerStripe(event)
    const customerEmail = user.email

    if (!customerEmail) {
      throw new Error('Email requis pour créer un client Stripe')
    }

    const customer = await stripe.customers.create({
      email: customerEmail,
      name: profile.full_name || undefined,
      metadata: {
        userId: user.id
      }
    })

    await createCustomer(event, {
      profile_id: user.id,
      stripe_customer_id: customer.id
    })

    return customer.id
  } catch (error) {
    handleError(error, 'Erreur lors de la création du client Stripe')
    return null
  }
}
