import { requireAuth } from '../../repositories/supabaseRepository'
import { getProfileById } from '../../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const profile = await getProfileById(event, user.id)

    return profile
  } catch (error) {
    console.error('Error in profile.simple.get route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error fetching simple profile data'
    })
  }
})
