import { anthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { smoothStream, streamText, generateText, convertToModelMessages, stepCountIs } from 'ai'
import type { UIMessage, TextPart, TextUIPart, FileUIPart, FilePart } from 'ai'
import { requireAuth } from '../../repositories/supabaseRepository'
import { getFullProfileData } from '../../repositories/profileRepository'
import type { ChatWithMessages } from '../../repositories/chatRepository'
import { updateChatTitle, getChatWithMessages } from '../../repositories/chatRepository'
import { addMessage } from '../../repositories/messageRepository'
import { generateSystemPrompt } from '../../lib/ai/systemPrompt'
import { createAITools } from '../../lib/ai/tools'

defineRouteMeta({
  openAPI: {
    description: 'Chat with AI.',
    tags: ['ai']
  }
})

export const maxDuration = 60

function extractPromptText(message: UIMessage) {
  const textPart = message.parts.find((part): part is TextUIPart => part && part.type === 'text')
  if (textPart?.text) return textPart.text
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const fullProfile = await getFullProfileData(event, user.id)
  const systemPrompt = generateSystemPrompt(fullProfile)

  const { id } = getRouterParams(event)
  const { messages } = await readBody(event)

  const config = useRuntimeConfig()
  const groq = createGroq({ apiKey: config.groq.apiKey as string })

  const chatData: ChatWithMessages | null = await getChatWithMessages(event, Number(id), user.id)
  if (!chatData) {
    throw createError({ statusCode: 404, statusMessage: 'Chat not found' })
  }
  const { chat, messages: dbMessages } = chatData

  if (!chat.title) {
    const titleRes = await generateText({
      model: groq('llama-3.1-8b-instant'),
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
        content: dbMessages[0]?.content ?? ''
      }]
    })

    const cleaned = titleRes.text.replace(/:/g, '').split('\n')[0] ?? ''
    setHeader(event, 'X-Chat-Title', cleaned)
    await updateChatTitle(event, Number(id), cleaned)
  }

  const lastIndex = messages.length - 1
  const lastMessage = messages[lastIndex]
  if (lastMessage.role === 'user') {
    const lastDbMessage = dbMessages.length > 0 ? dbMessages[dbMessages.length - 1] : undefined

    if (!lastDbMessage || lastDbMessage.role !== lastMessage.role || lastDbMessage.content !== lastMessage.content) {
      await addMessage(event, Number(id), 'user', lastMessage.content)
    }

    const msgIn = lastMessage as unknown as UIMessage
    const fileParts = msgIn.parts.filter((part): part is FileUIPart => part && part.type === 'file')

    if (fileParts.length > 0) {
      const currentMessage = { ...lastMessage }
      const promptText = extractPromptText(msgIn)

      type ContentPart = TextPart | FilePart
      const contentArray: ContentPart[] = []
      if (promptText) contentArray.push({ type: 'text', text: promptText })

      for (const part of fileParts) {
        const mediaType = part.mediaType
        const url = part.url

        if (mediaType.startsWith('image/')) {
          try {
            const imagePrompt = promptText || 'Analyze this image'

            const visionRes = await generateText({
              model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', image: url },
                  { type: 'text', text: imagePrompt }
                ]
              }]
            })
            contentArray.push({ type: 'text', text: `[Image analysis: ${visionRes.text}]` })
          } catch (error) {
            console.error('Image processing error:', error)
            contentArray.push({ type: 'text', text: '[Image analysis failed]' })
          }
        }
      }

      messages[lastIndex] = {
        ...currentMessage,
        parts: contentArray
      }
    }
  }

  const modelMessages = await convertToModelMessages(messages)

  const lastMessageHasPDF = lastMessage.parts?.some((part: FileUIPart | TextUIPart) =>
    part && part.type === 'file' && part.mediaType === 'application/pdf'
  )

  if (lastMessageHasPDF) {
    return streamText({
      model: anthropic('claude-sonnet-4-0'),
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 8192,
      temperature: 0.7,
      async onFinish(response) {
        try {
          console.log('[AI Response preview]', response.text?.slice(0, 200))
        } catch (err) {
          console.debug('Preview log failed (PDF branch)', err)
        }
        await addMessage(event, Number(id), 'assistant', response.text)
      },
      onError: (error) => {
        console.error(error)
      }
    }).toUIMessageStreamResponse()
  } else {
    const lastUserText = extractPromptText(lastMessage as unknown as UIMessage) ?? ''
    const requiresLiveInfo = /\b(news|actualité|actu|derni(?:er|ère)s?|cette semaine|semaine|aujourd'hui|aujourdhui|today|this week|latest|mise à jour|updates?|prix|price|météo|weather|maintenant|now)\b/i.test(lastUserText)

    const model = groq('openai/gpt-oss-120b')
    const tools = createAITools(event)

    return streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
      maxOutputTokens: 8192,
      stopWhen: stepCountIs(20),
      temperature: 0.7,
      experimental_transform: smoothStream({ delayInMs: 10, chunking: 'word' }),
      tools,
      toolChoice: 'auto',

      async prepareStep({ stepNumber }) {
        if (stepNumber === 0 && requiresLiveInfo) {
          return {
            toolChoice: { type: 'tool', toolName: 'exaSearch' },
            activeTools: ['exaSearch'] as const
          }
        }
        return {}
      },

      async onStepFinish(step) {
        if (step.toolCalls && step.toolCalls.length > 0) {
          console.log('[ToolCalls]', step.toolCalls.map(tc => tc.toolName))
        }
      },

      async onFinish(response) {
        await addMessage(event, Number(id), 'assistant', response.text)
      },

      onError: (error) => {
        console.error(error)
      }
    }).toUIMessageStreamResponse()
  }
})
