import { tool } from 'ai'
import { z } from 'zod/v3'
import type { H3Event } from 'h3'
import { requireAuth } from '../../../repositories/supabaseRepository'
import { addWeightRecord } from '../../../repositories/weightRepository'
import { updateFullProfileData } from '../../../repositories/profileRepository'

export function createLogWeightTool(event: H3Event) {
  return tool({
    description: `
      Use this tool to record a new weight entry for the user in their dashboard.

      Behavior:
      - When the user mentions their current weight (e.g. "je pèse 78kg", "j'ai perdu du poids, je fais 75kg now"), compare it to the weight already present in your context.
      - If it differs, ask: "Je vois que ton poids actuel diffère de celui enregistré dans ton dashboard. Tu veux que je le mette à jour ?"
      - Only call this tool after the user explicitly confirms (e.g. "oui", "vas-y", "mets à jour").
      - After saving, confirm naturally (e.g. "C'est noté ! Ton poids de 78 kg a bien été enregistré dans ton dashboard.").
      - Never call this tool without explicit user confirmation.
    `,
    inputSchema: z.object({
      weight_kg: z.number().describe('Le poids de l\'utilisateur en kilogrammes')
    }),
    execute: async ({ weight_kg }) => {
      const user = await requireAuth(event)
      const [record] = await Promise.all([
        addWeightRecord(event, user.id, { weight_kg }),
        updateFullProfileData(event, user.id, { physicalData: { weight_kg } })
      ])
      if (!record) return { success: false }
      return { success: true, weight_kg: record.weight_kg, recorded_at: record.recorded_at }
    }
  })
}
