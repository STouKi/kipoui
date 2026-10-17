import type { H3Event } from 'h3'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types/public'
import { getPublicSupabaseClient, handleError } from './supabaseRepository'

type Chat = Database['public']['Tables']['chats']['Row']
type Message = Database['public']['Tables']['messages']['Row']

export interface ChatWithMessages {
  chat: Chat
  messages: Message[]
}

export async function getUserChats(event: H3Event, userId: string): Promise<Chat[]> {
  try {
    const supabase = await getPublicSupabaseClient(event)
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
    const supabase = await getPublicSupabaseClient(event)

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
    const supabase = await getPublicSupabaseClient(event)
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
    const supabase = await getPublicSupabaseClient(event)
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
  return await deleteChats(event, [chatId], userId)
}

// Files attached to messages are stored at the root of the chat-files bucket as <uuid>.<ext>
const CHAT_FILE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.[a-z0-9]+$/i

// Paths in the chat-files bucket of the files attached to these chats' messages
export async function getChatFilePaths(supabase: SupabaseClient<Database>, chatIds: number[]): Promise<string[]> {
  if (chatIds.length === 0) return []
  const { data, error } = await supabase
    .from('messages')
    .select('experimental_attachments')
    .in('chat_id', chatIds)
    .not('experimental_attachments', 'is', null)

  if (error) throw error
  return data
    .flatMap(row => (Array.isArray(row.experimental_attachments) ? row.experimental_attachments : []))
    .map(attachment => (attachment as { name?: unknown } | null)?.name)
    .filter((name): name is string => typeof name === 'string' && CHAT_FILE.test(name))
}

// Deletes the user's chats among chatIds, their messages (ON DELETE CASCADE) and the photos and
// PDFs attached to them, which the cascade doesn't reach
export async function deleteChats(event: H3Event, chatIds: number[], userId: string): Promise<boolean> {
  try {
    const supabase = await getPublicSupabaseClient(event)
    const { data: owned, error: ownedError } = await supabase
      .from('chats')
      .select('id')
      .in('id', chatIds)
      .eq('profile_id', userId)

    if (ownedError) throw ownedError
    const ids = owned.map(chat => chat.id)
    if (ids.length === 0) return true

    const files = await getChatFilePaths(supabase, ids)

    const { error } = await supabase
      .from('chats')
      .delete()
      .in('id', ids)
      .eq('profile_id', userId)

    if (error) throw error

    // The conversations are gone: a file left behind is only logged
    if (files.length > 0) {
      const { error: filesError } = await supabase.storage.from('chat-files').remove(files)
      if (filesError) console.error('Error deleting chat files:', filesError)
    }
    return true
  } catch (error) {
    handleError(error, 'Error deleting chats')
    return false
  }
}
