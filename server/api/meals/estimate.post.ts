import { z } from 'zod/v3'
import { estimateItem } from '../../lib/ai/mealAnalysis'
import { hasActiveSubscription } from '../../lib/subscription'
import { requireAuth } from '../../repositories/supabaseRepository'
import { getCustomerByProfileId } from '../../repositories/customerRepository'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(80),
  quantity: z.string().trim().max(40)
})

// The values of one food the user corrected or added in an estimate, before saving the meal
export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  // Like the analysis: the food goes to an AI provider
  if (!user.user_metadata?.ai_consent_at) {
    throw createError({ statusCode: 403, statusMessage: 'AI consent required' })
  }
  if (!hasActiveSubscription(await getCustomerByProfileId(event, user.id))) {
    throw createError({ statusCode: 403, statusMessage: 'Active subscription required' })
  }

  const food = await readValidatedBody(event, bodySchema.parse)
  try {
    const config = useRuntimeConfig()
    return { item: await estimateItem(config.groq.apiKey as string, food) }
  } catch (error) {
    console.error('Meal item estimate error:', error)
    throw createError({ statusCode: 502, statusMessage: 'Meal item estimate failed' })
  }
})
