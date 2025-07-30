import { anthropic } from '@ai-sdk/anthropic'
import { smoothStream, streamText } from 'ai'
import { createWorkersAI } from 'workers-ai-provider'
import { requireAuth } from '../../repositories/supabaseRepository'
import { getFullProfileData } from '../../repositories/profileRepository'
import type { ChatWithMessages } from '../../repositories/chatRepository'
import { updateChatTitle, getChatWithMessages } from '../../repositories/chatRepository'
import { addMessage } from '../../repositories/messageRepository'
import { generateSystemPrompt } from '../../lib/ai/systemPrompt'
import { createAITools } from '../../lib/ai/tools'

export const maxDuration = 60

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  const fullProfile = await getFullProfileData(event, user.id)

  const systemPrompt = generateSystemPrompt(fullProfile)

  const { id } = getRouterParams(event)
  const { messages } = await readBody(event)

  const gateway = process.env.CLOUDFLARE_AI_GATEWAY_ID && process.env.CLOUDFLARE_AI_API_KEY
    ? {
        id: process.env.CLOUDFLARE_AI_GATEWAY_ID,
        token: process.env.CLOUDFLARE_AI_API_KEY,
        cacheTtl: 60 * 60 * 24
      }
    : undefined
  const workersAI = createWorkersAI({ binding: hubAI(), gateway })

  const chatData: ChatWithMessages | null = await getChatWithMessages(event, Number(id), user.id)
  if (!chatData) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }
  const { chat, messages: dbMessages } = chatData

  if (!chat.title) {
    const { response: title } = await hubAI().run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
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
        content: dbMessages[0].content!
      }]
    }, {
      gateway
    })

    const cleaned = title.replace(/:/g, '').split('\n')[0]
    setHeader(event, 'X-Chat-Title', cleaned)
    await updateChatTitle(event, Number(id), cleaned)
  }

  const lastIndex = messages.length - 1
  const lastMessage = messages[lastIndex]
  if (lastMessage.role === 'user') {
    const lastDbMessage = dbMessages[dbMessages.length - 1]

    if (lastDbMessage.role !== lastMessage.role || lastDbMessage.content !== lastMessage.content) {
      await addMessage(event, Number(id), 'user', lastMessage.content)
    }

    if (lastMessage.experimental_attachments && lastMessage.experimental_attachments.length > 0) {
      const currentMessage = { ...lastMessage }

      const contentArray: Array<{ type: string, text?: string, image?: URL, data?: URL, mimeType?: string }> = [{ type: 'text', text: currentMessage.content }]

      for (const attachment of lastMessage.experimental_attachments) {
        if (attachment.contentType?.startsWith('image/') && attachment.url) {
          try {
            const imageResponse = await fetch(attachment.url)
            const imageBuffer = await imageResponse.arrayBuffer()
            const imageArray = [...new Uint8Array(imageBuffer)]

            const imagePrompt = typeof lastMessage.content === 'string'
              ? lastMessage.content
              : lastMessage.content?.find((c: { type: string, text?: string }) => c.type === 'text')?.text || 'Analyze this image'

            const llavaResponse = await hubAI().run('@cf/llava-hf/llava-1.5-7b-hf', {
              image: imageArray,
              prompt: imagePrompt,
              max_tokens: 512,
              temperature: 0.7
            })

            const imageAnalysis = (llavaResponse as { description?: string }).description || JSON.stringify(llavaResponse)

            contentArray.push({
              type: 'text',
              text: `[Image analysis: ${imageAnalysis}]`
            })
          } catch (error) {
            console.error('Image processing error:', error)
            contentArray.push({
              type: 'text',
              text: '[Image analysis failed]'
            })
          }
        } else if (attachment.contentType === 'application/pdf' && attachment.url) {
          contentArray.push({ type: 'file', data: new URL(attachment.url), mimeType: 'application/pdf' })
        }
      }

      messages[lastIndex] = {
        ...currentMessage,
        content: contentArray,
        parts: contentArray
      }
    }
  }

  const lastMessageHasPDF = lastMessage.experimental_attachments?.some(
    (attachment: { contentType?: string }) => attachment.contentType === 'application/pdf'
  ) || false

  const tools = createAITools(event)

  if (lastMessageHasPDF) {
    return streamText({
      model: anthropic('claude-sonnet-4-0'),
      system: systemPrompt,
      messages,
      maxTokens: 50000,
      temperature: 0.7,
      async onFinish(response) {
        await addMessage(event, Number(id), 'assistant', response.text)
      },
      onError: (error) => {
        console.error(error)
      }
    }).toDataStreamResponse()
  } else {
    return streamText({
      model: workersAI('@cf/meta/llama-4-scout-17b-16e-instruct'),
      system: systemPrompt,
      messages,
      maxTokens: 50000,
      maxSteps: 20,
      temperature: 0.7,
      topK: 50,
      frequencyPenalty: 0.5,
      presencePenalty: 0.5,
      toolCallStreaming: true,
      experimental_transform: smoothStream({ delayInMs: 10, chunking: 'word' }),
      tools,
      async onFinish(response) {
        await addMessage(event, Number(id), 'assistant', response.text)
      },
      onError: (error) => {
        console.error(error)
      }
    }).toDataStreamResponse()
  }
})
