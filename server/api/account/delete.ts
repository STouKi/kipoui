import { getAdminSupabaseClient, requireAuth } from '../../repositories/supabaseRepository'
import { getServerStripe } from '../../repositories/stripeRepository'

export default defineEventHandler(async (event) => {
  try {
    const supabaseAdmin = getAdminSupabaseClient()
    const user = await requireAuth(event)

    // The database cascade doesn't reach Stripe: deleting the customer cancels its subscription
    // right away, so a deleted account is never charged again (invoices stay in Stripe). If this
    // fails, the account is kept so the user can retry rather than keep paying without an account
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle()

    if (customer?.stripe_customer_id) {
      const stripe = await getServerStripe(event)
      try {
        await stripe.customers.del(customer.stripe_customer_id)
      } catch (error) {
        if ((error as { code?: string }).code !== 'resource_missing') throw error
      }
    }

    // Nor does it reach Storage: avatars are named after the user id at the root of the bucket
    const { data: files } = await supabaseAdmin.storage.from('avatars').list('', { search: user.id })
    const avatars = (files ?? []).map(file => file.name).filter(name => name.startsWith(`${user.id}-`))
    if (avatars.length > 0) {
      const { error: avatarsError } = await supabaseAdmin.storage.from('avatars').remove(avatars)
      if (avatarsError) console.error('Error deleting avatars:', avatarsError)
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)

    if (error) {
      console.error('Error deleting user:', error)

      throw createError({
        statusCode: 500,
        message: 'Erreur lors de la suppression du compte'
      })
    }

    return { success: true, message: 'Compte supprimé avec succès' }
  } catch (error: unknown) {
    console.error('Error in delete account handler:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Une erreur est survenue lors de la suppression du compte'
    })
  }
})
