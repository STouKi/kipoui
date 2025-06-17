import { requireAuth } from '../../repositories/supabaseRepository'
import { deleteChat } from '../../repositories/chatRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const { id } = getRouterParams(event)

    const result = await deleteChat(event, Number(id), user.id)

    if (!result) {
      throw createError({
        statusCode: 404,
        message: 'Chat not found or could not be deleted'
      })
    }

    return { success: true }
  } catch (error) {
    console.error('Error in chat.delete route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error deleting chat'
    })
  }
})
