import { readMultipartFormData } from 'h3'
import type { MultiPartData } from 'h3'
import { requireAuth } from '../../repositories/supabaseRepository'
import { createChat } from '../../repositories/chatRepository'
import { addMessage } from '../../repositories/messageRepository'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)

    let input = ''
    let files: MultiPartData[] = []

    const contentType = getRequestHeader(event, 'content-type') || ''

    if (contentType.includes('multipart/form-data')) {
      const formData = await readMultipartFormData(event)

      if (formData) {
        const inputField = formData.find(field => field.name === 'input')
        if (inputField && inputField.data) {
          input = inputField.data.toString()
        }

        files = formData
          .filter(field => field.name === 'files')
          .map(file => ({
            name: file.filename,
            type: file.type,
            data: file.data
          }))
      }
    } else {
      const body = await readBody(event)
      input = body.input || ''
    }

    const chat = await createChat(event, user.id, '')

    if (!chat) {
      throw createError({
        statusCode: 500,
        message: 'Failed to create chat'
      })
    }

    await addMessage(event, chat.id, 'user', input, files.length > 0 ? files : undefined)

    return chat
  } catch (error: unknown) {
    console.error('Error in chats.post route:', error)

    const err = error as { statusCode?: number, message?: string }
    throw createError({
      statusCode: err.statusCode || 500,
      message: err.message || 'Error creating chat'
    })
  }
})
