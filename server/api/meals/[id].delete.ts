import { requireAuth } from '../../repositories/supabaseRepository'
import { deleteMeal } from '../../repositories/mealRepository'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const id = getRouterParam(event, 'id')
  if (!id || !UUID.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid meal id' })
  }

  await deleteMeal(event, user.id, id)
  return { success: true }
})
