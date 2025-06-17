import type { H3Event } from 'h3'
import type { Database } from '../types/supabase'
import { getSupabaseClient } from './supabaseRepository'

type Customer = Database['public']['Tables']['customers']['Row']
type CustomerUpdate = Database['public']['Tables']['customers']['Update']

export async function getCustomerByProfileId(event: H3Event, profileId: string): Promise<Customer | null> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('profile_id', profileId)
      .single()

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
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('stripe_customer_id', stripeCustomerId)
      .single()

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

export async function createCustomer(
  event: H3Event,
  customer: {
    profile_id: string
    stripe_customer_id: string
  }
): Promise<Customer | null> {
  try {
    const supabase = await getSupabaseClient(event)
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
  event: H3Event,
  id: string,
  updates: Partial<CustomerUpdate>
): Promise<Customer | null> {
  try {
    const supabase = await getSupabaseClient(event)
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
