import { getUser, useSupabase } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  try {
    const user = await getUser(event)

    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Unauthorized'
      })
    }

    const supabase = await useSupabase(event)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) throw profileError

    const { data: physicalData, error: _physicalError } = await supabase
      .from('physical_data')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: habitsData, error: _habitsError } = await supabase
      .from('habits')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: medicalData, error: _medicalError } = await supabase
      .from('medical_data')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: goalsData, error: _goalsError } = await supabase
      .from('goals')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    const { data: preferencesData, error: _preferencesError } = await supabase
      .from('preferences')
      .select('*')
      .eq('profile_id', user.id)
      .single()

    return {
      profile,
      physicalData: physicalData || null,
      habits: habitsData || null,
      medicalData: medicalData || null,
      goals: goalsData || null,
      preferences: preferencesData || null
    }
  } catch (error) {
    console.error('Error fetching profile data:', error)
    throw createError({
      statusCode: 500,
      message: 'Error fetching profile data'
    })
  }
})
