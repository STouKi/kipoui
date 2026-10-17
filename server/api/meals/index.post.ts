import { requireAuth } from '../../repositories/supabaseRepository'
import { addMeal } from '../../repositories/mealRepository'
import { mealTotals, newMealSchema, roundItem } from '../../lib/meals'

// A meal analyzed by /api/meals/analyze, possibly edited by the user, then confirmed
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const meal = await readValidatedBody(event, newMealSchema.parse)

  const items = meal.items.map(roundItem)
  const saved = await addMeal(event, user.id, {
    eaten_at: meal.eaten_at,
    meal_type: meal.meal_type,
    name: meal.name,
    items,
    ...mealTotals(items)
  })
  if (!saved) {
    throw createError({ statusCode: 500, statusMessage: 'Meal not saved' })
  }
  return saved
})
