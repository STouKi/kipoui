import type { H3Event } from 'h3'
import type { Database } from '../types/supabase'
import { getSupabaseClient, handleError } from './baseRepository'

type Message = Database['public']['Tables']['messages']['Row']

export async function getChatMessages(event: H3Event, chatId: number): Promise<Message[]> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data as Message[]
  } catch (error) {
    handleError(error, 'Error fetching chat messages')
    return []
  }
}

export async function addMessage(
  event: H3Event,
  chatId: number,
  role: 'user' | 'assistant',
  content: string
): Promise<Message | null> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('messages')
      .insert({
        chat_id: chatId,
        role,
        content
      })
      .select()
      .single()

    if (error) throw error
    return data as Message
  } catch (error) {
    handleError(error, 'Error adding message')
    return null
  }
}

export async function deleteMessage(event: H3Event, messageId: number): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient(event)
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error deleting message')
    return false
  }
}
