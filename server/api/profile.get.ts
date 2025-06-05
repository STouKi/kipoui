import { requireAuth } from '../repositories/baseRepository'
import { getFullProfileData } from '../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const fullProfile = await getFullProfileData(event, user.id)

    return fullProfile
  } catch (error) {
    console.error('Error in profile.get route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error fetching profile data'
    })
  }
})
