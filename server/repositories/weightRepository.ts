import type { H3Event } from 'h3'
import { getPublicSupabaseClient, handleError } from './supabaseRepository'

type WeightRecord = {
  id: string
  profile_id: string
  weight_kg: number | null
  recorded_at: string
}

export async function addWeightRecord(
  event: H3Event,
  profileId: string,
  weightData: { weight_kg: number }
): Promise<WeightRecord | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    const { data, error } = await supabase
      .from('weight_records')
      .insert({
        profile_id: profileId,
        weight_kg: weightData.weight_kg
      })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error adding weight record')
    return null
  }
}

export async function getWeightRecords(
  event: H3Event,
  profileId: string,
  options?: {
    limit?: number
    startDate?: string
    endDate?: string
  }
): Promise<WeightRecord[]> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    let query = supabase
      .from('weight_records')
      .select('*')
      .eq('profile_id', profileId)
      .order('recorded_at', { ascending: true })

    if (options?.startDate) {
      query = query.gte('recorded_at', options.startDate)
    }

    if (options?.endDate) {
      query = query.lte('recorded_at', options.endDate)
    }

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    handleError(error, 'Error fetching weight records')
    return []
  }
}

export async function getLatestWeightRecord(
  event: H3Event,
  profileId: string
): Promise<WeightRecord | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    const { data, error } = await supabase
      .from('weight_records')
      .select('*')
      .eq('profile_id', profileId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (error) {
    handleError(error, 'Error fetching latest weight record')
    return null
  }
}

export async function updateWeightRecord(
  event: H3Event,
  recordId: string,
  profileId: string,
  weightData: { weight_kg?: number }
): Promise<WeightRecord | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    // Vérifier que l'enregistrement appartient bien à l'utilisateur
    const { data: existingRecord, error: checkError } = await supabase
      .from('weight_records')
      .select('id')
      .eq('id', recordId)
      .eq('profile_id', profileId)
      .single()

    if (checkError) throw checkError
    if (!existingRecord) {
      throw new Error('Weight record not found or access denied')
    }

    const { data, error } = await supabase
      .from('weight_records')
      .update(weightData)
      .eq('id', recordId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error updating weight record')
    return null
  }
}

export async function deleteWeightRecord(
  event: H3Event,
  recordId: string,
  profileId: string
): Promise<boolean> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    // Vérifier que l'enregistrement appartient bien à l'utilisateur
    const { data: existingRecord, error: checkError } = await supabase
      .from('weight_records')
      .select('id')
      .eq('id', recordId)
      .eq('profile_id', profileId)
      .single()

    if (checkError) throw checkError
    if (!existingRecord) {
      throw new Error('Weight record not found or access denied')
    }

    const { error } = await supabase
      .from('weight_records')
      .delete()
      .eq('id', recordId)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error deleting weight record')
    return false
  }
}

export async function getWeightStats(
  event: H3Event,
  profileId: string
): Promise<{
  latest?: number
  min?: number
  max?: number
  average?: number
  count: number
}> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    const { data, error } = await supabase
      .from('weight_records')
      .select('weight_kg')
      .eq('profile_id', profileId)
      .order('recorded_at', { ascending: true })

    if (error) throw error

    if (!data || data.length === 0) {
      return { count: 0 }
    }

    // Conserver uniquement les valeurs numériques (exclut null/undefined/NaN)
    const weights = data
      .map(record => record.weight_kg)
      .filter((w): w is number => typeof w === 'number' && !Number.isNaN(w))

    if (weights.length === 0) {
      return { count: 0 }
    }

    const sum = weights.reduce((acc, weight) => acc + weight, 0)

    return {
      latest: weights[weights.length - 1],
      min: Math.min(...weights),
      max: Math.max(...weights),
      average: sum / weights.length,
      count: weights.length
    }
  } catch (error) {
    handleError(error, 'Error fetching weight statistics')
    return { count: 0 }
  }
}
