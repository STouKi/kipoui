import type { Tables } from '@server/types/public'

export type Chat = Tables<'chats'>
export type Message = Tables<'messages'>
export type WeightRecord = Tables<'weight_records'>

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
