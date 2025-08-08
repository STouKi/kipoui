import type { H3Event } from 'h3'
import type { Database } from '../types/public'
import { getPublicSupabaseClient, handleError } from './supabaseRepository'

type Profile = Database['public']['Tables']['profiles']['Row']
type PhysicalData = Database['public']['Tables']['physical_data']['Row']
type Habits = Database['public']['Tables']['habits']['Row']
type MedicalData = Database['public']['Tables']['medical_data']['Row']
type Goals = Database['public']['Tables']['goals']['Row']
type Preferences = Database['public']['Tables']['preferences']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

export interface FullProfileData {
  profile: Profile | null
  physicalData: PhysicalData | null
  habits: Habits | null
  medicalData: MedicalData | null
  goals: Goals | null
  preferences: Preferences | null
  customer: Customer | null
}

export interface ProfileUpdateResult {
  success: boolean
  updated: string[]
}

export async function getProfileById(event: H3Event, userId: string): Promise<Profile | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error fetching profile')
    return null
  }
}

export async function getFullProfileData(event: H3Event, userId: string): Promise<FullProfileData> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    const [
      profileResult,
      physicalDataResult,
      habitsResult,
      medicalDataResult,
      goalsResult,
      preferencesResult,
      customerResult
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).single(),
      supabase.from('physical_data').select('*').eq('profile_id', userId).single(),
      supabase.from('habits').select('*').eq('profile_id', userId).single(),
      supabase.from('medical_data').select('*').eq('profile_id', userId).single(),
      supabase.from('goals').select('*').eq('profile_id', userId).single(),
      supabase.from('preferences').select('*').eq('profile_id', userId).single(),
      supabase.from('customers').select('*').eq('profile_id', userId).single()
    ])

    if (profileResult.error) throw profileResult.error

    return {
      profile: profileResult.data,
      physicalData: physicalDataResult.data || null,
      habits: habitsResult.data || null,
      medicalData: medicalDataResult.data || null,
      goals: goalsResult.data || null,
      preferences: preferencesResult.data || null,
      customer: customerResult.data || null
    }
  } catch (error) {
    handleError(error, 'Error fetching full profile data')
    return {
      profile: null,
      physicalData: null,
      habits: null,
      medicalData: null,
      goals: null,
      preferences: null,
      customer: null
    }
  }
}

export async function updateProfile(event: H3Event, userId: string, profileData: Partial<Profile>): Promise<Profile | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    handleError(error, 'Error updating profile')
    return null
  }
}

async function updateOrInsertRelatedData(
  event: H3Event,
  userId: string,
  tableName: 'profiles' | 'physical_data' | 'habits' | 'medical_data' | 'goals' | 'preferences' | 'chats' | 'messages',
  data: any
): Promise<boolean> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    const { data: existingData, error: checkError } = await supabase
      .from(tableName)
      .select('id')
      .eq('profile_id', userId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 is the "no rows returned" error, which is expected if no record exists
      throw checkError
    }

    if (existingData) {
      const { error } = await supabase
        .from(tableName)
        .update(data)
        .eq('profile_id', userId)

      if (error) throw error
    } else {
      const { error } = await supabase
        .from(tableName)
        .insert({ ...data, profile_id: userId })

      if (error) throw error
    }

    return true
  } catch (error) {
    handleError(error, `Error updating ${tableName}`)
    return false
  }
}

export async function updateFullProfileData(
  event: H3Event,
  userId: string,
  data: {
    profile?: Partial<Profile>
    physicalData?: Partial<PhysicalData>
    habits?: Partial<Habits>
    medicalData?: Partial<MedicalData>
    goals?: Partial<Goals>
    preferences?: Partial<Preferences>
  }
): Promise<ProfileUpdateResult> {
  const updates: string[] = []

  try {
    if (data.profile) {
      await updateProfile(event, userId, data.profile)
      updates.push('profile')
    }

    const updateTasks = [
      data.physicalData && updateOrInsertRelatedData(event, userId, 'physical_data', data.physicalData)
        .then(success => success && updates.push('physical_data')),
      data.habits && updateOrInsertRelatedData(event, userId, 'habits', data.habits)
        .then(success => success && updates.push('habits')),
      data.medicalData && updateOrInsertRelatedData(event, userId, 'medical_data', data.medicalData)
        .then(success => success && updates.push('medical_data')),
      data.goals && updateOrInsertRelatedData(event, userId, 'goals', data.goals)
        .then(success => success && updates.push('goals')),
      data.preferences && updateOrInsertRelatedData(event, userId, 'preferences', data.preferences)
        .then(success => success && updates.push('preferences'))
    ].filter(Boolean)

    await Promise.all(updateTasks)

    return {
      success: true,
      updated: updates
    }
  } catch (error) {
    handleError(error, 'Error updating full profile data')
    return {
      success: false,
      updated: updates
    }
  }
}
