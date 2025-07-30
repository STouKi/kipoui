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

    return result
  } catch (error) {
    console.error('Error in chat.get route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error fetching chat'
    })
  }
})
