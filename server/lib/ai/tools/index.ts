import type { H3Event } from 'h3'
import { createAddResourceTool } from './addResource'
import { createGetInformationTool } from './getInformation'
import { createExaSearchTool } from './exa'

export function createAITools(event: H3Event) {
  return {
    exaSearch: createExaSearchTool(event),
    addResource: createAddResourceTool(event),
    getInformation: createGetInformationTool(event)
  }
}
