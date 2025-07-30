import { randomUUID } from 'crypto'
import type { H3Event, MultiPartData } from 'h3'
import type { Database } from '../types/public'
import { getPublicSupabaseClient, handleError } from './supabaseRepository'
import { uploadFile } from './fileRepository'

type Message = Database['public']['Tables']['messages']['Row']

export async function getChatMessages(event: H3Event, chatId: number): Promise<Message[]> {
  try {
    const supabase = await getPublicSupabaseClient(event)
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
  content: string,
  files?: MultiPartData[]
): Promise<Message | null> {
  try {
    const supabase = await getPublicSupabaseClient(event)

    type MessageData = {
      chat_id: number
      role: 'user' | 'assistant'
      content: string
      experimental_attachments?: Array<{
        name: string
        type: string
        url: string
      }>
    }

    const messageData: MessageData = {
      chat_id: chatId,
      role,
      content
    }

    if (files) {
      const attachments = []

      for (const file of files) {
        const fileExt = file.filename?.split('.').pop()
        const uniqueFilename = `${randomUUID()}.${fileExt}`

        const chatFileUrl = await uploadFile(
          event,
          'chat-files',
          uniqueFilename,
          file.data,
          file.type!
        )

        if (!chatFileUrl) {
          throw createError({
            statusCode: 500,
            message: 'Erreur lors du téléchargement du fichier'
          })
        }

        attachments.push({
          name: uniqueFilename,
          type: file.type!,
          url: chatFileUrl!
        })
      }

      if (attachments.length > 0) {
        messageData.experimental_attachments = attachments
      }
    }

    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
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
    const supabase = await getPublicSupabaseClient(event)
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
