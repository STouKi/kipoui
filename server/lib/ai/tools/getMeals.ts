import { tool } from 'ai'
import { z } from 'zod/v3'
import type { H3Event } from 'h3'
import { requireAuth } from '../../../repositories/supabaseRepository'
import { getMeals } from '../../../repositories/mealRepository'

const DAY = 24 * 60 * 60 * 1000
const MEAL_TYPES = { breakfast: 'petit-déjeuner', lunch: 'déjeuner', dinner: 'dîner', snack: 'collation' }
const dateFormat = new Intl.DateTimeFormat('fr-FR', {
  timeZone: 'Europe/Paris',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit'
})

// The meal journal of the iOS app (Repas tab)
export function createGetMealsTool(event: H3Event) {
  return tool({
    description: `
      Use this tool to read the user's meal journal: what they ate over the last days, with the estimated calories and macronutrients of each meal. The user logs meals in the app by taking a photo of their plate.

      Use it when the user talks about what they ate, asks how balanced their eating is, how many calories or proteins they had, or wants a review of their day or week.
      Never tell the user you are using a tool: talk about their journal naturally. The values are estimates.
    `,
    inputSchema: z.object({
      days: z.number().int().min(1).max(14).describe('Number of days to read, today included')
    }),
    execute: async ({ days }) => {
      const user = await requireAuth(event)
      const now = new Date()
      const meals = await getMeals(event, user.id, {
        from: new Date(now.getTime() - days * DAY).toISOString(),
        to: now.toISOString()
      })
      return {
        now: dateFormat.format(now),
        meals: meals.map(meal => ({
          date: dateFormat.format(new Date(meal.eaten_at)),
          type: MEAL_TYPES[meal.meal_type],
          name: meal.name,
          foods: Array.isArray(meal.items) ? meal.items.map(item => (item as { name?: string })?.name).filter(Boolean) : [],
          kcal: meal.kcal,
          protein_g: meal.protein_g,
          carbs_g: meal.carbs_g,
          fat_g: meal.fat_g
        }))
      }
    }
  })
}
