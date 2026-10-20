import type { createGroq } from '@ai-sdk/groq'
import { generateText } from 'ai'
import { shorten, stripModelTokens } from './modelText'

const MAX_LENGTH = 40

const INSTRUCTIONS = `Tu donnes un titre à une conversation entre une personne et son coach nutrition, d'après le premier message de la personne.
Réponds uniquement par le titre : en français, 3 à 6 mots, 40 caractères au plus, sans guillemets, sans ponctuation finale, sans emoji, sans markdown.`

// A clean title from what the model returned, or '' when nothing usable is left
export function cleanTitle(raw: string) {
  const line = stripModelTokens(raw)
    .split('\n')
    .map(text => text.trim())
    .find(Boolean) ?? ''
  const title = line
    .replace(/^titre\s*:\s*/i, '')
    .replace(/["«»“”*_#`]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s.:;,!?-]+$/, '')
    .trim()
  // A title cut short doesn't end on a small word: "Idées de repas pour toute la"
  const short = shorten(title, MAX_LENGTH)
    .replace(/(\s+(?:à|au|aux|avec|d'|dans|de|des|du|en|et|l'|la|le|les|ou|par|pour|sans|sur|un|une))+$/i, '')
  return short.charAt(0).toUpperCase() + short.slice(1)
}

// The start of the first message, when the model gives no usable title
export function fallbackTitle(message: string) {
  const text = message.replace(/\s+/g, ' ').trim()
  return text.length > MAX_LENGTH ? `${shorten(text, MAX_LENGTH - 1)}…` : text
}

// The title of a new conversation. It is cosmetic: a model failure falls back on the start of
// the first message rather than blocking the conversation
export async function generateChatTitle(groq: ReturnType<typeof createGroq>, firstMessage: string) {
  try {
    const { text } = await generateText({
      model: groq('openai/gpt-oss-20b'),
      providerOptions: { groq: { reasoningEffort: 'low' } },
      system: INSTRUCTIONS,
      prompt: firstMessage
    })
    return cleanTitle(text) || fallbackTitle(firstMessage)
  } catch (error) {
    console.error('Title generation error:', error)
    return fallbackTitle(firstMessage)
  }
}
