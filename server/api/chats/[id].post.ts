import { streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { getUser } from '../../utils/getUser'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const user = await getUser(event)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const { id } = getRouterParams(event)
  // TODO: Use readValidatedBody
  const { model, messages } = await readBody(event)

  const db = useDrizzle()
  const gateway = process.env.CLOUDFLARE_AI_GATEWAY_ID
    ? {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID,
        cacheTtl: 60 * 60 * 24
      }
    : undefined
  const workersAI = createWorkersAI({ binding: hubAI(), gateway })

  const chat = await db.query.chats.findFirst({
    where: (chat, { eq }) => and(eq(chat.id, Number(id)), eq(chat.profileId, user.id)),
    with: {
      messages: true
    }
  })
  if (!chat) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }

  if (!chat.title) {
    const { response: title } = await hubAI().run('@cf/meta/llama-3.1-8b-instruct-fast', {
      stream: false,
      messages: [{
        role: 'system',
        content: `You are a title generator for a chat:
        - Generate a short title based on the first user's message
        - The title should be less than 30 characters long
        - The title should be a summary of the user's message
        - Do not use quotes (' or ") or colons (:) or any other punctuation
        - Do not use markdown, just plain text`
      }, {
        role: 'user',
        content: chat.messages[0]!.content
      }]
    }, {
      gateway
    })
    setHeader(event, 'X-Chat-Title', title.replace(/:/g, '').split('\n')[0])
    await db.update(tables.chats).set({ title }).where(eq(tables.chats.id, Number(id)))
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role === 'user' && messages.length > 1) {
    await db.insert(tables.messages).values({
      chatId: Number(id),
      role: 'user',
      content: lastMessage.content
    })
  }

  return streamText({
    model: workersAI(model),
    maxTokens: 10000,
    system: 'You are a helpful assistant that can answer questions and help.',
    messages,
    async onFinish(response) {
      await db.insert(tables.messages).values({
        chatId: Number(id),
        role: 'assistant',
        content: response.text
      })
    }
  }).toDataStreamResponse()
})
