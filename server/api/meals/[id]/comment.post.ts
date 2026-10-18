import { z } from 'zod/v3'
import { commentMeal } from '../../../lib/ai/mealComment'
import { requireAuth } from '../../../repositories/supabaseRepository'
import { getFullProfileData } from '../../../repositories/profileRepository'
import { getMeal, getMeals, setMealComment } from '../../../repositories/mealRepository'

export const maxDuration = 30

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const bodySchema = z.object({
  // The bounds of the meal's day in the user's time zone
  day_start: z.string().datetime({ offset: true }),
  day_end: z.string().datetime({ offset: true }),
  // Estimated daily needs, computed by the app from the profile
  needs: z.number().int().min(800).max(6000).nullable().optional(),
  time_zone: z.string().max(64).optional()
})

function isTimeZone(value: string | undefined): value is string {
  if (!value) return false
  try {
    new Intl.DateTimeFormat('fr-FR', { timeZone: value })
    return true
  } catch {
    return false
  }
}

// The coach's reaction to a meal just added to the journal, saved with the meal
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  // Like the chat: the profile and the day's meals go to the AI providers
  if (!user.user_metadata?.ai_consent_at) {
    throw createError({ statusCode: 403, statusMessage: 'AI consent required' })
  }
  const profile = await getFullProfileData(event, user.id)
  if (!['active', 'trialing'].includes(profile.customer?.subscription_status ?? '')) {
    throw createError({ statusCode: 403, statusMessage: 'Active subscription required' })
  }

  const id = getRouterParam(event, 'id')
  if (!id || !UUID.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid meal id' })
  }
  const body = await readValidatedBody(event, bodySchema.parse)
  const dayStart = new Date(body.day_start)
  const dayEnd = new Date(body.day_end)
  const span = dayEnd.getTime() - dayStart.getTime()
  if (span <= 0 || span > 26 * 60 * 60 * 1000) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid day' })
  }

  const meal = await getMeal(event, user.id, id)
  if (!meal) {
    throw createError({ statusCode: 404, statusMessage: 'Meal not found' })
  }
  const dayMeals = await getMeals(event, user.id, { from: dayStart.toISOString(), to: dayEnd.toISOString() })

  let comment: string
  try {
    const config = useRuntimeConfig()
    comment = await commentMeal(config.groq.apiKey as string, {
      profile,
      meal,
      dayMeals: dayMeals.some(item => item.id === meal.id) ? dayMeals : [...dayMeals, meal],
      needs: body.needs ?? null,
      timeZone: isTimeZone(body.time_zone) ? body.time_zone : 'Europe/Paris'
    })
  } catch (error) {
    console.error('Meal comment error:', error)
    throw createError({ statusCode: 502, statusMessage: 'Meal comment failed' })
  }
  if (!comment) {
    throw createError({ statusCode: 502, statusMessage: 'Meal comment failed' })
  }

  await setMealComment(event, user.id, id, comment)
  return { comment }
})
