import { getUser } from '../utils/getUser'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { input } = await readBody(event)
  const db = useDrizzle()

  const [chat] = await db.insert(tables.chats).values({
    title: '',
    profileId: user.id
  }).returning()

  await db.insert(tables.messages).values({
    chatId: chat.id,
    role: 'user',
    content: input
  })

  return chat
})
