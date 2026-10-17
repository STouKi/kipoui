import { createGroq } from '@ai-sdk/groq'
import { generateText, Output } from 'ai'
import { z } from 'zod/v3'
import { roundItem } from '../meals'

const analysisSchema = z.object({
  is_food: z.boolean().describe('false si ce n\'est pas un repas, un aliment ou une boisson'),
  name: z.string().describe('Nom court du repas, 40 caractères au plus, par exemple « Spaghetti bolognaise et brocolis »'),
  items: z.array(z.object({
    name: z.string().describe('Aliment, par exemple « Spaghetti cuits »'),
    quantity: z.string().describe('Quantité estimée, par exemple « 150 g », « 1 tranche » ou « 250 ml »'),
    kcal: z.number().describe('Calories pour cette quantité'),
    protein_g: z.number().describe('Protéines en grammes pour cette quantité'),
    carbs_g: z.number().describe('Glucides en grammes pour cette quantité'),
    fat_g: z.number().describe('Lipides en grammes pour cette quantité')
  }))
})

const INSTRUCTIONS = `Tu es nutritionniste. À partir de la description d'un repas, liste chaque aliment avec sa quantité estimée et ses valeurs nutritionnelles pour cette quantité, d'après les tables de composition usuelles (Ciqual).
Règles :
- Réponds en français.
- Ne compte pas deux fois un même aliment, par exemple la viande déjà comprise dans une sauce.
- Si plusieurs portions ou plusieurs couverts apparaissent, ne compte que la portion d'une personne.
- Compte les boissons, sauf l'eau, que tu ignores.
- Si la description ne parle pas d'un repas, d'un aliment ou d'une boisson, is_food vaut false et items est vide.`

export interface MealAnalysisInput {
  // Base64 content of a photo of the meal
  image?: { data: string, mediaType: string }
  // What the user typed: the whole meal, or details about the photo
  description?: string
}

// Two steps: the vision model describes the plate, then gpt-oss-120b turns the description into
// structured values. Asked for the structured values directly, the vision model failed to produce
// valid JSON about half the time
export async function analyzeMeal(apiKey: string, input: MealAnalysisInput) {
  const groq = createGroq({ apiKey })
  const note = input.description?.trim() ?? ''
  let description = note

  if (input.image) {
    const vision = await generateText({
      model: groq('qwen/qwen3.8-27b'),
      messages: [{
        role: 'user',
        content: [
          { type: 'image', image: input.image.data, mediaType: input.image.mediaType },
          { type: 'text', text: 'Liste chaque aliment et chaque boisson visibles sur cette photo, avec une estimation de leur quantité (grammes, millilitres ou unités). Sois factuel et concis.' }
        ]
      }]
    })
    description = note ? `${vision.text}\n\nPrécision de la personne : ${note}` : vision.text
  }

  const { output } = await generateText({
    model: groq('openai/gpt-oss-120b'),
    providerOptions: { groq: { reasoningEffort: 'low' } },
    output: Output.object({ schema: analysisSchema }),
    system: INSTRUCTIONS,
    prompt: `Repas :\n${description}`
  })

  const items = output.items
    .filter(item => item.name.trim() && item.kcal >= 0)
    .map(item => roundItem({
      name: item.name.trim().slice(0, 80),
      quantity: item.quantity.trim().slice(0, 40),
      kcal: Math.min(item.kcal, 5000),
      protein_g: Math.max(0, Math.min(item.protein_g, 1000)),
      carbs_g: Math.max(0, Math.min(item.carbs_g, 1000)),
      fat_g: Math.max(0, Math.min(item.fat_g, 1000))
    }))
    .slice(0, 30)

  return {
    isFood: output.is_food && items.length > 0,
    name: output.name.trim().slice(0, 120),
    items
  }
}
