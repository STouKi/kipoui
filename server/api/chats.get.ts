import { requireAuth } from '../repositories/baseRepository'
import { getUserChats } from '../repositories/chatRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    const chats = await getUserChats(event, user.id)

    return chats
  } catch (error) {
    console.error('Error in chats.get route:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Error fetching chats'
    })
  }
})
