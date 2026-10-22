import { z } from 'zod/v3'
import { analyzeMeal } from '../../lib/ai/mealAnalysis'
import { mealTotals } from '../../lib/meals'
import { hasActiveSubscription } from '../../lib/subscription'
import { requireAuth } from '../../repositories/supabaseRepository'
import { getCustomerByProfileId } from '../../repositories/customerRepository'
import { countPhotoAnalysesSince, recordPhotoAnalysis } from '../../repositories/mealRepository'

export const maxDuration = 60

// Each photo costs a Claude call: enough for every meal of a day, with retries
const DAILY_PHOTO_LIMIT = 15

const bodySchema = z.object({
  // The photo as a data URL, resized by the app (Vercel refuses request bodies over 4.5 MB)
  image: z.string().regex(/^data:image\/(jpeg|png|webp);base64,/).max(4_000_000).optional(),
  description: z.string().trim().max(500).optional()
}).refine(body => body.image || body.description, 'A photo or a description is required')

// Estimates a meal from a photo or a description, without saving it: the user checks it first
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  // Like the chat: the photo and the description go to the AI providers, which cost money
  if (!user.user_metadata?.ai_consent_at) {
    throw createError({ statusCode: 403, statusMessage: 'AI consent required' })
  }
  const customer = await getCustomerByProfileId(event, user.id)
  if (!hasActiveSubscription(customer)) {
    throw createError({ statusCode: 403, statusMessage: 'Active subscription required' })
  }

  const body = await readValidatedBody(event, bodySchema.parse)
  const image = body.image
    ? { mediaType: body.image.slice(5, body.image.indexOf(';')), data: body.image.slice(body.image.indexOf(',') + 1) }
    : undefined

  if (image) {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
    if (await countPhotoAnalysesSince(user.id, since) >= DAILY_PHOTO_LIMIT) {
      throw createError({ statusCode: 429, statusMessage: 'Daily photo limit reached' })
    }
    await recordPhotoAnalysis(user.id)
  }

  try {
    const config = useRuntimeConfig()
    const { isFood, name, items } = await analyzeMeal(config.groq.apiKey as string, { image, description: body.description })
    return { isFood, name, items, ...mealTotals(items) }
  } catch (error) {
    console.error('Meal analysis error:', error)
    throw createError({ statusCode: 502, statusMessage: 'Meal analysis failed' })
  }
})
