import type { Enums, Tables } from '@server/types/public'

export type Chat = Tables<'chats'>
export type Message = Tables<'messages'>
export type WeightRecord = Tables<'weight_records'>
export type Meal = Tables<'meals'>
export type MealType = Enums<'meal_type'>

// A food of a meal, as estimated by the analysis (meals.items, a JSON column)
export interface MealItem {
  name: string
  quantity: string
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

// /api/meals/analyze: an estimate, saved only once the user confirms it
export interface MealAnalysis {
  isFood: boolean
  name: string
  items: MealItem[]
  kcal: number
  protein_g: number
  carbs_g: number
  fat_g: number
}

export interface ChatWithMessages {
  chat: Chat
  messages: Message[]
}

// /api/profile/get
export interface FullProfile {
  profile: Tables<'profiles'> | null
  physicalData: Tables<'physical_data'> | null
  habits: Tables<'habits'> | null
  medicalData: Tables<'medical_data'> | null
  goals: Tables<'goals'> | null
  preferences: Tables<'preferences'> | null
  customer: Tables<'customers'> | null
}

// Attachments as stored in messages.experimental_attachments (a JSON column)
export interface StoredAttachment {
  name?: string
  url?: string
  type?: string
  contentType?: string
}
