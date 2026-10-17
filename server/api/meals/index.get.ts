import { requireAuth } from '../../repositories/supabaseRepository'
import { getMeals } from '../../repositories/mealRepository'

const MAX_RANGE = 62 * 24 * 60 * 60 * 1000

// The app asks for whole days in the user's time zone, as ISO dates: from (included), to (excluded)
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)

  const { from, to } = getQuery(event)
  const start = new Date(String(from))
  const end = new Date(String(to))
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start || end.getTime() - start.getTime() > MAX_RANGE) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid date range' })
  }

  return await getMeals(event, user.id, { from: start.toISOString(), to: end.toISOString() })
})
