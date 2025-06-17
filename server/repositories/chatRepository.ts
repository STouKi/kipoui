import type { H3Event } from 'h3'
import type { Database } from '../types/supabase'
import { getSupabaseClient, handleError } from './supabaseRepository'

type Chat = Database['public']['Tables']['chats']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export interface ChatWithMessages {
  chat: Chat
  messages: Message[]
}

export async function getUserChats(event: H3Event, userId: string): Promise<Chat[]> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data as Chat[]
  } catch (error) {
    handleError(error, 'Error fetching user chats')
    return []
  }
}

export async function getChatWithMessages(event: H3Event, chatId: number, userId: string): Promise<ChatWithMessages | null> {
  try {
    const supabase = await getSupabaseClient(event)

    const [chatResult, messagesResult] = await Promise.all([
      supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .eq('profile_id', userId)
        .single(),
      supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
    ])

    if (chatResult.error) throw chatResult.error
    if (messagesResult.error) throw messagesResult.error

    return {
      chat: chatResult.data as Chat,
      messages: messagesResult.data as Message[]
    }
  } catch (error) {
    handleError(error, 'Error fetching chat with messages')
    return null
  }
}

export async function createChat(event: H3Event, userId: string, title: string | null = null): Promise<Chat | null> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('chats')
      .insert({
        profile_id: userId,
        title
      })
      .select()
      .single()

    if (error) throw error
    return data as Chat
  } catch (error) {
    handleError(error, 'Error creating chat')
    return null
  }
}

export async function updateChatTitle(event: H3Event, id: number, title: string): Promise<Chat> {
  try {
    const supabase = await getSupabaseClient(event)
    const { data, error } = await supabase
      .from('chats')
      .update({
        title
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Chat
  } catch (error) {
    handleError(error, 'Error updating chat title')
    throw error
  }
}

export async function deleteChat(event: H3Event, chatId: number, userId: string): Promise<boolean> {
  try {
    const supabase = await getSupabaseClient(event)
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('id', chatId)
      .eq('profile_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    handleError(error, 'Error deleting chat')
    return false
  }
}
