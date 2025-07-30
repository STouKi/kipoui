import type { H3Event } from 'h3'
import { createTavilySearchTool } from './tavilySearch'
import { createAddResourceTool } from './addResource'
import { createGetInformationTool } from './getInformation'

/**
 * Crée tous les outils d'IA nécessaires pour le chat
 * @param event L'événement H3 pour accéder au contexte
 * @returns Un objet contenant tous les outils configurés
 */
export function createAITools(event: H3Event) {
  return {
    tavilySearch: createTavilySearchTool(event),
    addResource: createAddResourceTool(event),
    getInformation: createGetInformationTool(event)
  }
}
