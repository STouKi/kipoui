import { getUser, createChat, addMessage } from '../utils/supabase'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { input } = await readBody(event)
  const chat = await createChat(event, user.id, '')
  await addMessage(event, chat.id, 'user', input)

  return chat
})
