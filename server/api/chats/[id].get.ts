import { getUser, getChatWithMessages } from '../../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = getRouterParams(event)

  const { chat, messages } = await getChatWithMessages(event, Number(id), user.id)
  return {
    ...chat,
    messages
  }
})
