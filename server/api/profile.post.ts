import { requireAuth } from '../repositories/baseRepository'
import { updateFullProfileData } from '../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event)

    const result = await updateFullProfileData(event, user.id, body)

    return result
  } catch (error) {
    console.error('Error in profile.post route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error updating profile data'
    })
  }
})
