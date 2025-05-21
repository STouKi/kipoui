import { getUser } from '../../utils/getUser'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = getRouterParams(event)

  const chat = await useDrizzle().query.chats.findFirst({
    where: (chat, { eq }) => and(eq(chat.id, Number(id)), eq(chat.profileId, user.id)),
    with: {
      messages: true
    }
  })

  return chat
})
