import { requireAuth } from '../../repositories/supabaseRepository'
import { getFullProfileData } from '../../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const fullProfile = await getFullProfileData(event, user.id)

    return fullProfile
  } catch (error) {
    console.error('Error in profile.get route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error fetching profile data'
    })
  }
})
