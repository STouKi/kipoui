import { getServerStripe, handleError } from '../../repositories/stripeRepository'
import { requireAuth } from '../../repositories/supabaseRepository'
import { getCustomerByProfileId } from '../../repositories/customerRepository'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const customer = await getCustomerByProfileId(event, user.id)
  if (!customer?.stripe_customer_id) {
    throw createError({ statusCode: 404, message: 'Aucun abonnement à gérer' })
  }

  try {
    const stripe = await getServerStripe(event)
    const config = useRuntimeConfig()

    // Stripe's hosted page: payment method, invoices, cancellation, and resuming a subscription
    // paused at the end of a trial without payment method
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${config.public.appUrl}/tableau-de-bord/parametres/abonnement`
    })

    return { url: session.url }
  } catch (error) {
    handleError(error, 'Erreur lors de l\'ouverture du portail de gestion de l\'abonnement')
  }
})
