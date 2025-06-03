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

    const body = await readBody(event)
    const {
      profile,
      physicalData,
      habits,
      medicalData,
      goals,
      preferences
    } = body

    const supabase = await useSupabase(event)
    const updates = []

    if (profile) {
      const { error } = await supabase
        .from('profiles')
        .update(profile)
        .eq('id', user.id)

      if (error) throw error
      updates.push('profile')
    }

    if (physicalData) {
      const { data: existingData } = await supabase
        .from('physical_data')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from('physical_data')
          .update(physicalData)
          .eq('profile_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('physical_data')
          .insert({ ...physicalData, profile_id: user.id })

        if (error) throw error
      }
      updates.push('physical_data')
    }

    if (habits) {
      const { data: existingData } = await supabase
        .from('habits')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from('habits')
          .update(habits)
          .eq('profile_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('habits')
          .insert({ ...habits, profile_id: user.id })

        if (error) throw error
      }
      updates.push('habits')
    }

    if (medicalData) {
      const { data: existingData } = await supabase
        .from('medical_data')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from('medical_data')
          .update(medicalData)
          .eq('profile_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('medical_data')
          .insert({ ...medicalData, profile_id: user.id })

        if (error) throw error
      }
      updates.push('medical_data')
    }

    if (goals) {
      const { data: existingData } = await supabase
        .from('goals')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from('goals')
          .update(goals)
          .eq('profile_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({ ...goals, profile_id: user.id })

        if (error) throw error
      }
      updates.push('goals')
    }

    if (preferences) {
      const { data: existingData } = await supabase
        .from('preferences')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (existingData) {
        const { error } = await supabase
          .from('preferences')
          .update(preferences)
          .eq('profile_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('preferences')
          .insert({ ...preferences, profile_id: user.id })

        if (error) throw error
      }
      updates.push('preferences')
    }

    return {
      success: true,
      updated: updates
    }
  } catch (error) {
    console.error('Error updating profile data:', error)
    throw createError({
      statusCode: 500,
      message: 'Error updating profile data'
    })
  }
})
