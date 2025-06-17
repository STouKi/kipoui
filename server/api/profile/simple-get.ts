import { requireAuth } from '../../repositories/supabaseRepository'
import { getProfileById } from '../../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const profile = await getProfileById(event, user.id)

    return profile
  } catch (error) {
    console.error('Error in profile.simple.get route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error fetching simple profile data'
    })
  }
})
