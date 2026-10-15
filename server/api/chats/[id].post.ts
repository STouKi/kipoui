import { anthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { smoothStream, streamText, generateText, convertToModelMessages, stepCountIs } from 'ai'
import type { UIMessage, TextUIPart, FileUIPart } from 'ai'
import type { MultiPartData } from 'h3'
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

// The AI SDK treats data URLs as files to download, and only downloads http(s) URLs:
// attachments are passed as their base64 content instead
function toInlineData(url: string) {
  return url.startsWith('data:') ? url.slice(url.indexOf(',') + 1) : url
}

// New attachments are stored like those of a conversation's first message (/api/chats/post).
// Attachments that already have a storage URL (a regenerate resends them) are skipped
function toStoredFiles(parts: FileUIPart[]): MultiPartData[] | undefined {
  const files = parts
    .filter(part => part.url.startsWith('data:'))
    .map(part => ({
      filename: part.filename || `piece-jointe.${part.mediaType.split('/')[1]}`,
      type: part.mediaType,
      data: Buffer.from(toInlineData(part.url), 'base64')
    }))
  return files.length > 0 ? files : undefined
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  // Profile data (including health data) only reaches the AI providers with explicit consent
  if (!user.user_metadata?.ai_consent_at) {
    throw createError({ statusCode: 403, statusMessage: 'AI consent required' })
  }
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
    // The title is cosmetic: a model failure must not block the conversation
    let cleaned = (dbMessages[0]?.content ?? '').slice(0, 30)
    try {
      const titleRes = await generateText({
        model: groq('openai/gpt-oss-20b'),
        providerOptions: { groq: { reasoningEffort: 'low' } },
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
      cleaned = titleRes.text.replace(/:/g, '').split('\n')[0] || cleaned
    } catch (error) {
      console.error('Title generation error:', error)
    }
    await updateChatTitle(event, Number(id), cleaned)
  }

  const lastIndex = messages.length - 1
  const lastMessage = messages[lastIndex]
  if (lastMessage.role === 'user') {
    const lastDbMessage = dbMessages.length > 0 ? dbMessages[dbMessages.length - 1] : undefined

    const msgIn = lastMessage as unknown as UIMessage
    // UI messages carry their text in parts: they have no `content` since AI SDK 5
    const promptText = extractPromptText(msgIn)
    const fileParts = msgIn.parts.filter((part): part is FileUIPart => part && part.type === 'file')

    // A regenerate resends the last stored message (e.g. the first one, saved by /api/chats/post)
    if (!lastDbMessage || lastDbMessage.role !== 'user' || lastDbMessage.content !== (promptText ?? '')) {
      await addMessage(event, Number(id), 'user', promptText ?? '', toStoredFiles(fileParts))
    }

    if (fileParts.length > 0) {
      const currentMessage = { ...lastMessage }

      type ContentPart = TextUIPart | FileUIPart
      const contentArray: ContentPart[] = []
      if (promptText) contentArray.push({ type: 'text', text: promptText })

      for (const part of fileParts) {
        const mediaType = part.mediaType
        const url = part.url

        if (mediaType.startsWith('image/')) {
          try {
            const imagePrompt = promptText || 'Analyze this image'

            const visionRes = await generateText({
              model: groq('qwen/qwen3.8-27b'),
              messages: [{
                role: 'user',
                content: [
                  { type: 'image', image: toInlineData(url), mediaType },
                  { type: 'text', text: imagePrompt }
                ]
              }]
            })
            contentArray.push({ type: 'text', text: `[Image analysis: ${visionRes.text}]` })
          } catch (error) {
            console.error('Image processing error:', error)
            contentArray.push({ type: 'text', text: '[Image analysis failed]' })
          }
        } else if (mediaType === 'application/pdf') {
          // Claude reads the PDF itself (PDF branch below)
          contentArray.push({ ...part, url: toInlineData(url) })
        }
      }

      messages[lastIndex] = {
        ...currentMessage,
        parts: contentArray
      }
    }
  }

  // Earlier attachments can't be re-sent as data URLs (see toInlineData) and the text model
  // can't read them anyway: the conversation keeps a mention of them instead
  for (const message of messages.slice(0, lastIndex)) {
    message.parts = message.parts.map((part: UIMessage['parts'][number]) =>
      part.type === 'file' ? { type: 'text', text: `[Pièce jointe : ${part.filename ?? part.mediaType}]` } : part
    )
  }

  // Messages saved empty by a former bug have no parts and would become empty model messages
  const modelMessages = await convertToModelMessages(messages.filter((message: UIMessage) => message.parts.length > 0))

  const lastMessageHasPDF = lastMessage.parts?.some((part: FileUIPart | TextUIPart) =>
    part && part.type === 'file' && part.mediaType === 'application/pdf'
  )

  if (lastMessageHasPDF) {
    return streamText({
      model: anthropic('claude-sonnet-5'),
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
