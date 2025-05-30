import type { H3Event } from 'h3'
import type { Database } from '../types/supabase'
import { serverSupabaseClient, serverSupabaseUser } from '#supabase/server'

export async function useSupabase(event: H3Event) {
  const client = await serverSupabaseClient<Database>(event)
  return client
}

type Chat = Database['public']['Tables']['chats']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export async function getUser(event: H3Event) {
  const user = await serverSupabaseUser(event)

  if (!user) {
    console.error('User not found')
    return null
  }

  return user
}

export async function getChats(event: H3Event, userId: string) {
  const supabase = await useSupabase(event)
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('profile_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error

  return data as Chat[]
}

export async function getChatWithMessages(event: H3Event, chatId: number, userId: string) {
  const supabase = await useSupabase(event)
  const { data: chat, error: chatError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .eq('profile_id', userId)
    .single()

  if (chatError) throw chatError

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (messagesError) throw messagesError

  return {
    chat: chat as Chat,
    messages: messages as Message[]
  }
}

export async function createChat(event: H3Event, userId: string, title: string | null = null) {
  const supabase = await useSupabase(event)
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
}

export async function addMessage(event: H3Event, chatId: number, role: 'user' | 'assistant', content: string) {
  const supabase = await useSupabase(event)
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
}

export async function deleteChat(event: H3Event, chatId: number, userId: string) {
  const supabase = await useSupabase(event)
  const { error } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .eq('profile_id', userId)

  if (error) throw error
  return true
}
