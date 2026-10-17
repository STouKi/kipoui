import type { FullProfile, MealItem, MealType } from './types'

// In the order of a day
export const MEAL_TYPES: { value: MealType, label: string }[] = [
  { value: 'breakfast', label: 'Petit-déjeuner' },
  { value: 'lunch', label: 'Déjeuner' },
  { value: 'snack', label: 'Collation' },
  { value: 'dinner', label: 'Dîner' }
]

export function mealTypeLabel(type: MealType) {
  return MEAL_TYPES.find(item => item.value === type)?.label ?? ''
}

// The meal people are most likely logging at that time
export function defaultMealType(date: Date): MealType {
  const hour = date.getHours() + date.getMinutes() / 60
  if (hour >= 4 && hour < 10.5) return 'breakfast'
  if (hour >= 10.5 && hour < 15) return 'lunch'
  if (hour >= 18 && hour < 23) return 'dinner'
  return 'snack'
}

// Time of a meal logged for another day than today
export const DEFAULT_TIMES: Record<MealType, string> = {
  breakfast: '08:00',
  lunch: '12:30',
  snack: '16:30',
  dinner: '19:30'
}

export function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

// Local day, as a key: 2026-10-17
export function dayKey(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function timeOf(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const kcalFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 })

// 1 240
export function formatKcal(kcal: number) {
  return kcalFormat.format(kcal)
}

// 62 g
export function formatGrams(grams: number) {
  return `${kcalFormat.format(grams)} g`
}

export function sumItems(items: MealItem[]) {
  return {
    kcal: Math.round(items.reduce((sum, item) => sum + item.kcal, 0)),
    protein_g: items.reduce((sum, item) => sum + item.protein_g, 0),
    carbs_g: items.reduce((sum, item) => sum + item.carbs_g, 0),
    fat_g: items.reduce((sum, item) => sum + item.fat_g, 0)
  }
}

function ageOn(birthDate: string, today: Date) {
  const birth = new Date(`${birthDate}T00:00:00`)
  let age = today.getFullYear() - birth.getFullYear()
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) {
    age--
  }
  return age
}

// Estimated daily needs in kcal: Mifflin-St Jeor resting needs, times the activity level, with a
// moderate gap when the goal is to lose (-400) or gain (+300) weight. Never below the resting
// needs, nor below the usual minimums (1 200 kcal for women, 1 500 for men). The formula is for
// adults: null for minors, and when the profile lacks one of the values it needs
export function estimateDailyNeeds(profile: FullProfile | null, weight: number | null, today = new Date()) {
  const physical = profile?.physicalData
  if (!physical?.gender || !physical.birth_date || !physical.height_cm || !weight) return null
  const age = ageOn(physical.birth_date, today)
  if (age < 18) return null

  const male = physical.gender === 'male'
  const resting = 10 * weight + 6.25 * physical.height_cm - 5 * age + (male ? 5 : -161)
  const sportDays = profile?.habits?.sport_week_frequency ?? 0
  const activity = sportDays === 0 ? 1.2 : sportDays <= 2 ? 1.375 : sportDays <= 5 ? 1.55 : 1.725

  let needs = resting * activity
  const target = profile?.goals?.target_weight
  if (target && target < weight - 0.5) needs -= 400
  else if (target && target > weight + 0.5) needs += 300

  return Math.round(Math.max(needs, resting, male ? 1500 : 1200) / 50) * 50
}

// Counting calories can harm people with an eating disorder: their journal shows no figures
export function showsNutritionFigures(profile: FullProfile | null) {
  return !profile?.medicalData?.eating_disorders?.length
}
