import { z } from 'zod/v3'
import { requireAuth } from '../../repositories/supabaseRepository'
import { deleteChats } from '../../repositories/chatRepository'

const bodySchema = z.object({
  ids: z.array(z.number().int().positive()).min(1).max(500)
})

// Several conversations at once (selection in the app's conversation list)
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const { ids } = await readValidatedBody(event, bodySchema.parse)

  const deleted = await deleteChats(event, ids, user.id)
  if (!deleted) {
    throw createError({ statusCode: 500, statusMessage: 'Chats not deleted' })
  }
  return { success: true }
})
