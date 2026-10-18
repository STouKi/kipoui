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

  // The coach's reaction to a meal just added, saved with it. The day's bounds and the time zone
  // let the server read the other meals of the user's day
  async function commentMeal(meal: Meal, needs: number | null) {
    const day = startOfDay(new Date(meal.eaten_at))
    const { comment } = await api<{ comment: string }>(`/api/meals/${meal.id}/comment`, {
      method: 'POST',
      body: {
        day_start: day.toISOString(),
        day_end: addDays(day, 1).toISOString(),
        needs,
        time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })
    const key = dayKey(day)
    mealsByDay.value = {
      ...mealsByDay.value,
      [key]: (mealsByDay.value[key] ?? []).map(item => item.id === meal.id ? { ...item, coach_comment: comment } : item)
    }
    return comment
  }

  return { mealsByDay, loadDay, analyzeMeal, addMeal, deleteMeal, commentMeal }
}
