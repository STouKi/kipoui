import { getUser } from '../utils/getUser'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  return (await useDrizzle().select().from(tables.chats).where(eq(tables.chats.profileId, user.id))).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
})
