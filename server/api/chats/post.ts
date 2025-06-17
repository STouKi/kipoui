import { requireAuth } from '../../repositories/supabaseRepository'
import { createChat } from '../../repositories/chatRepository'
import { addMessage } from '../../repositories/messageRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const { input } = await readBody(event)

    const chat = await createChat(event, user.id, '')

    if (!chat) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create chat'
      })
    }

    await addMessage(event, chat.id, 'user', input)

    return chat
  } catch (error) {
    console.error('Error in chats.post route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error creating chat'
    })
  }
})
