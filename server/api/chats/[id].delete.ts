import { getUser } from '../../utils/getUser'

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = getRouterParams(event)

  const db = useDrizzle()

  return await db.delete(tables.chats)
    .where(and(eq(tables.chats.id, Number(id)), eq(tables.chats.profileId, user.id)))
    .returning()
})
