import { requireAuth } from '../../repositories/supabaseRepository'
import { updateFullProfileData } from '../../repositories/profileRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const body = await readBody(event)

    const result = await updateFullProfileData(event, user.id, body)

    return result
  } catch (error) {
    console.error('Error in profile.update route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error updating profile data'
    })
  }
})
