import { ref, watch } from 'vue'
import { api } from '@/lib/api'
import { readAsDataUrl } from '@/lib/files'
import { addDays, dayKey, startOfDay } from '@/lib/nutrition'
import { session } from '@/lib/session'
import type { Meal, MealAnalysis, MealItem, MealType } from '@/lib/types'

// Meals by local day (dayKey), oldest first
const mealsByDay = ref<Record<string, Meal[]>>({})

watch(session, (value) => {
  if (!value) mealsByDay.value = {}
})

export interface NewMeal {
  eaten_at: string
  meal_type: MealType
  name: string
  items: MealItem[]
}

export function useMeals() {
  async function loadDay(day: Date) {
    const from = startOfDay(day)
    const meals = await api<Meal[]>('/api/meals', {
      query: { from: from.toISOString(), to: addDays(from, 1).toISOString() }
    })
    mealsByDay.value = { ...mealsByDay.value, [dayKey(day)]: meals }
  }

  // An estimate from a photo or a description, not saved yet
  async function analyzeMeal(input: { photo?: File, description?: string }) {
    return await api<MealAnalysis>('/api/meals/analyze', {
      method: 'POST',
      body: {
        image: input.photo ? await readAsDataUrl(input.photo) : undefined,
        description: input.description || undefined
      }
    })
  }

  async function addMeal(meal: NewMeal) {
    const saved = await api<Meal>('/api/meals', { method: 'POST', body: meal })
    const key = dayKey(new Date(saved.eaten_at))
    const list = [...(mealsByDay.value[key] ?? []), saved]
      .sort((a, b) => a.eaten_at.localeCompare(b.eaten_at))
    mealsByDay.value = { ...mealsByDay.value, [key]: list }
    return saved
  }

  async function deleteMeal(meal: Meal) {
    await api(`/api/meals/${meal.id}`, { method: 'DELETE' })
    const key = dayKey(new Date(meal.eaten_at))
    mealsByDay.value = {
      ...mealsByDay.value,
      [key]: (mealsByDay.value[key] ?? []).filter(item => item.id !== meal.id)
    }
  }

  return { mealsByDay, loadDay, analyzeMeal, addMeal, deleteMeal }
}
