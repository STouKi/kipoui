import { anthropic } from '@ai-sdk/anthropic'
import { createGroq } from '@ai-sdk/groq'
import { generateText, Output } from 'ai'
import { z } from 'zod/v3'
import { roundItem } from '../meals'
import type { MealItem } from '../meals'

const itemSchema = z.object({
  name: z.string().describe('Aliment, par exemple « Spaghetti cuits »'),
  quantity: z.string().describe('Quantité estimée, par exemple « 150 g », « 1 tranche » ou « 250 ml »'),
  kcal: z.number().describe('Calories pour cette quantité'),
  protein_g: z.number().describe('Protéines en grammes pour cette quantité'),
  carbs_g: z.number().describe('Glucides en grammes pour cette quantité'),
  fat_g: z.number().describe('Lipides en grammes pour cette quantité')
})

const analysisSchema = z.object({
  is_food: z.boolean().describe('false si ce n\'est pas un repas, un aliment ou une boisson'),
  name: z.string().describe('Nom court du repas, 40 caractères au plus, par exemple « Spaghetti bolognaise et brocolis »'),
  items: z.array(itemSchema)
})

// Naming the dish first helps the model list what such a dish holds
const photoSchema = analysisSchema.extend({
  dish: z.string().describe('Le plat reconnu, par exemple « blanquette de veau » ou « poke bowl au saumon »')
})

const INSTRUCTIONS = `Tu es nutritionniste. À partir de la description d'un repas, liste chaque aliment avec sa quantité estimée et ses valeurs nutritionnelles pour cette quantité, d'après les tables de composition usuelles (Ciqual).
Règles :
- Réponds en français.
- Ne compte pas deux fois un même aliment, par exemple la viande déjà comprise dans une sauce.
- Si plusieurs portions ou plusieurs couverts apparaissent, ne compte que la portion d'une personne.
- Compte les boissons, sauf l'eau, que tu ignores.
- Si la description ne parle pas d'un repas, d'un aliment ou d'une boisson, is_food vaut false et items est vide.`

const PHOTO_INSTRUCTIONS = `Tu es nutritionniste et tu analyses la photo d'un repas.
1. Identifie le plat (champ dish).
2. Liste chaque aliment de l'assiette : ce que tu vois clairement, plus les ingrédients certains d'une préparation identifiée (la crème d'une sauce blanche, l'huile d'une poêlée). N'invente aucun aliment que rien ne laisse voir.
3. Pour chaque aliment, estime la quantité (grammes, millilitres ou unités) d'après la taille de l'assiette et des morceaux, puis ses valeurs nutritionnelles pour cette quantité, d'après les tables Ciqual.
Règles : réponds en français. Ne compte pas deux fois un même aliment. Si plusieurs assiettes apparaissent, ne compte que celle du premier plan ; une sauce servie à part compte. Ignore l'eau. Si la photo ne montre pas de nourriture, is_food vaut false et items est vide.`

export interface MealAnalysisInput {
  // Base64 content of a photo of the meal
  image?: { data: string, mediaType: string }
  // What the user typed: the whole meal, or details about the photo
  description?: string
}

type RawAnalysis = z.infer<typeof analysisSchema>

function clampItem(item: MealItem): MealItem {
  return roundItem({
    name: item.name.trim().slice(0, 80),
    quantity: item.quantity.trim().slice(0, 40),
    kcal: Math.max(0, Math.min(item.kcal, 5000)),
    protein_g: Math.max(0, Math.min(item.protein_g, 1000)),
    carbs_g: Math.max(0, Math.min(item.carbs_g, 1000)),
    fat_g: Math.max(0, Math.min(item.fat_g, 1000))
  })
}

function toResult(output: RawAnalysis) {
  const items = output.items
    .filter(item => item.name.trim())
    .map(clampItem)
    .slice(0, 30)
  return {
    isFood: output.is_food && items.length > 0,
    name: output.name.trim().slice(0, 120),
    items
  }
}

// Photos go to Claude Sonnet in a single step. Groq's vision model (Qwen, 27B) made up foods on
// mixed dishes, a salmon blanquette with rice became "carrots, anchovies and mustard", where
// Claude named every food of four test plates (blanquette, poke bowl, couscous, bolognese)
async function analyzePhoto(image: NonNullable<MealAnalysisInput['image']>, note: string) {
  const { output } = await generateText({
    model: anthropic('claude-sonnet-5'),
    output: Output.object({ schema: photoSchema }),
    messages: [{
      role: 'user',
      content: [
        { type: 'image', image: image.data, mediaType: image.mediaType },
        { type: 'text', text: note ? `${PHOTO_INSTRUCTIONS}\nPrécision de la personne : ${note}` : PHOTO_INSTRUCTIONS }
      ]
    }]
  })
  return toResult(output)
}

// Descriptions, and photos when Claude is unavailable: Groq's vision model describes the plate,
// then gpt-oss-120b turns the description into structured values. Asked for the structured values
// directly, the vision model failed to produce valid JSON about half the time
async function analyzeWithGroq(apiKey: string, input: MealAnalysisInput) {
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
  return toResult(output)
}

export async function analyzeMeal(apiKey: string, input: MealAnalysisInput) {
  if (input.image) {
    try {
      return await analyzePhoto(input.image, input.description?.trim() ?? '')
    } catch (error) {
      console.error('Claude meal analysis failed, Groq takes over:', error)
    }
  }
  return await analyzeWithGroq(apiKey, input)
}

// The values per 100 g, which the model knows from the tables, and the weight of the quantity:
// the code does the multiplication, which the model got wrong ("150 g of salmon" came back with
// the values of 100 g)
const estimateSchema = z.object({
  quantity: z.string().describe('La quantité, reprise telle quelle ou choisie, par exemple « 150 g » ou « 1 bol »'),
  grams: z.number().describe('Le poids en grammes de cette quantité, par exemple 150 pour « 150 g » ou 180 pour « 1 bol de riz cuit »'),
  kcal_per_100g: z.number(),
  protein_per_100g: z.number(),
  carbs_per_100g: z.number(),
  fat_per_100g: z.number()
})

// One food corrected or added by the user before saving the meal: its values for the given
// quantity. The user's name is kept; an empty quantity gets a usual portion
export async function estimateItem(apiKey: string, food: { name: string, quantity: string }) {
  const groq = createGroq({ apiKey })
  const { output } = await generateText({
    model: groq('openai/gpt-oss-120b'),
    providerOptions: { groq: { reasoningEffort: 'low' } },
    output: Output.object({ schema: estimateSchema }),
    system: 'Tu es nutritionniste. Pour cet aliment, donne le poids en grammes de la quantité indiquée et ses valeurs nutritionnelles pour 100 g, d\'après les tables Ciqual. Si la quantité manque ou reste vague, choisis une portion habituelle et indique-la. Réponds en français.',
    prompt: `Aliment : ${food.name}\nQuantité : ${food.quantity || 'non précisée'}`
  })
  const ratio = Math.max(0, Math.min(output.grams, 3000)) / 100
  return clampItem({
    name: food.name,
    quantity: food.quantity || output.quantity,
    kcal: output.kcal_per_100g * ratio,
    protein_g: output.protein_per_100g * ratio,
    carbs_g: output.carbs_per_100g * ratio,
    fat_g: output.fat_per_100g * ratio
  })
}
