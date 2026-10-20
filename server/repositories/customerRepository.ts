import type { H3Event } from 'h3'
import type { Database } from '../types/public'
import { getAdminSupabaseClient, getPublicSupabaseClient } from './supabaseRepository'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export async function getCustomerByProfileId(event: H3Event, profileId: string): Promise<Customer | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle()

    if (error) {
      console.warn('Erreur lors de la récupération du client:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération du client:', error)
    return null
  }
}

export async function getCustomerByStripeCustomerId(event: H3Event, stripeCustomerId: string): Promise<Customer | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle()

    if (error) {
      console.warn('Erreur lors de la récupération du client par ID Stripe:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la récupération du client par ID Stripe:', error)
    return null
  }
}

// Users can only read their customer row (RLS): it holds their subscription status, so only
// trusted server code writes it, after checking with Stripe
export async function createCustomer(
  _event: H3Event,
  customer: {
    profile_id: string
    stripe_customer_id: string
  }
): Promise<Customer | null> {
  try {
    const supabase = getAdminSupabaseClient()
    const { data, error } = await supabase
      .from('customers')
      .insert({
        profile_id: customer.profile_id,
        stripe_customer_id: customer.stripe_customer_id,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.warn('Erreur lors de la création du client:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la création du client:', error)
    return null
  }
}

export async function updateCustomer(
  _event: H3Event,
  id: string,
  updates: Partial<CustomerUpdate>
): Promise<Customer | null> {
  try {
    const supabase = getAdminSupabaseClient()
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.warn('Erreur lors de la mise à jour du client:', error)
      return null
    }

    return data
  } catch (error) {
    console.error('Erreur lors de la mise à jour du client:', error)
    return null
  }
}

// The subscription bought in the iOS app, copied from RevenueCat (lib/revenuecat.ts). The user
// may have no customers row yet (no Stripe checkout): one row per user, upserted on profile_id
export async function saveAppStoreSubscription(
  profileId: string,
  subscription: Pick<CustomerUpdate, 'app_store_status' | 'app_store_expires_at' | 'app_store_will_renew' | 'app_store_product_id'>
) {
  const supabase = getAdminSupabaseClient()
  const { error } = await supabase
    .from('customers')
    .upsert({ profile_id: profileId, ...subscription }, { onConflict: 'profile_id' })

  if (error) {
    console.error('Erreur lors de l\'enregistrement de l\'abonnement App Store:', error)
    throw createError({ statusCode: 500, statusMessage: 'App Store subscription not saved' })
  }
}
