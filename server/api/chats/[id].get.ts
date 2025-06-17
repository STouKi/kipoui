import { requireAuth } from '../../repositories/supabaseRepository'
import { getChatWithMessages } from '../../repositories/chatRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    const { id } = getRouterParams(event)
    const result = await getChatWithMessages(event, Number(id), user.id)

    if (!result) {
      throw createError({
        statusCode: 404,
        message: 'Chat not found'
      })
    }

    return {
      ...result.chat,
      messages: result.messages
    }
  } catch (error) {
    console.error('Error in chat.get route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error fetching chat'
    })
  }
})
