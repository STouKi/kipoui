import { requireAuth } from '../../repositories/supabaseRepository'
import { getUserChats } from '../../repositories/chatRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const chats = await getUserChats(event, user.id)

    return chats
  } catch (error) {
    console.error('Error in chats.get route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error fetching chats'
    })
  }
})
