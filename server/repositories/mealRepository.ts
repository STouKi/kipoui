import type { H3Event } from 'h3'
import type { Database } from '../types/public'
import { getPublicSupabaseClient, handleError } from './supabaseRepository'

export type Meal = Database['public']['Tables']['meals']['Row']
type MealInsert = Database['public']['Tables']['meals']['Insert']

// Meals eaten from `from` (included) to `to` (excluded), oldest first
export async function getMeals(
  event: H3Event,
  profileId: string,
  range: { from: string, to: string }
): Promise<Meal[]> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('profile_id', profileId)
      .gte('eaten_at', range.from)
      .lt('eaten_at', range.to)
      .order('eaten_at', { ascending: true })

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error fetching meals')
    return []
  }
}

export async function addMeal(
  event: H3Event,
  profileId: string,
  meal: Omit<MealInsert, 'profile_id'>
): Promise<Meal | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('meals')
      .insert({ ...meal, profile_id: profileId })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error adding meal')
    return null
  }
}

export async function deleteMeal(event: H3Event, profileId: string, id: string): Promise<boolean> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { error } = await supabase
      .from('meals')
      .delete()
      .eq('id', id)
      .eq('profile_id', profileId)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error deleting meal')
    return false
  }
}

export async function getMeal(event: H3Event, profileId: string, id: string): Promise<Meal | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('meals')
      .select('*')
      .eq('id', id)
      .eq('profile_id', profileId)
      .maybeSingle()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error fetching meal')
    return null
  }
}

export async function setMealComment(event: H3Event, profileId: string, id: string, comment: string): Promise<boolean> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { error } = await supabase
      .from('meals')
      .update({ coach_comment: comment })
      .eq('id', id)
      .eq('profile_id', profileId)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error saving meal comment')
    return false
  }
}
