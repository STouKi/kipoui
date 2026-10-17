import { z } from 'zod/v3'

// A food of a meal, as estimated by the analysis (lib/ai/mealAnalysis.ts)
export const mealItemSchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(40),
  kcal: z.number().min(0).max(5000),
  protein_g: z.number().min(0).max(1000),
  carbs_g: z.number().min(0).max(1000),
  fat_g: z.number().min(0).max(1000)
})

export type MealItem = z.infer<typeof mealItemSchema>

// POST /api/meals: the totals are computed from the items, never taken from the client
export const newMealSchema = z.object({
  eaten_at: z.string().datetime({ offset: true }),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  name: z.string().trim().min(1).max(120),
  items: z.array(mealItemSchema).min(1).max(30)
})

function round(value: number, decimals = 1) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function roundItem(item: MealItem): MealItem {
  return {
    ...item,
    kcal: Math.round(item.kcal),
    protein_g: round(item.protein_g),
    carbs_g: round(item.carbs_g),
    fat_g: round(item.fat_g)
  }
}

export function mealTotals(items: MealItem[]) {
  return {
    kcal: Math.round(items.reduce((sum, item) => sum + item.kcal, 0)),
    protein_g: round(items.reduce((sum, item) => sum + item.protein_g, 0)),
    carbs_g: round(items.reduce((sum, item) => sum + item.carbs_g, 0)),
    fat_g: round(items.reduce((sum, item) => sum + item.fat_g, 0))
  }
}
