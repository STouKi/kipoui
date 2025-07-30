import { tool } from 'ai'
import { z } from 'zod'
import type { H3Event } from 'h3'
import Exa from 'exa-js'

export function createExaSearchTool(event: H3Event) {
  const runtimeConfig = useRuntimeConfig(event)
  const exa = new Exa(runtimeConfig.exa.apiKey)

  return tool({
    description: `
      Search the web for up-to-date information

      You have access to a tool called exaSearch, which performs live web searches and returns up-to-date, relevant content from the internet. Use this tool whenever the user asks a question about:
          - recent events or breaking news (e.g. "What's happening in Ukraine right now?")
          - current prices, laws, weather, trends, or product availability (e.g. "What's the iPhone 15 Pro price today?", "Is CBD legal in Germany?")
          - people, companies, or topics where your internal knowledge might be outdated or insufficient (e.g. "Who is the new CEO of OpenAI?", "What's the latest on the French elections?")
          - anything with a specific date or time-related relevance (e.g. "What concerts are happening in Paris this weekend?")

        Important usage guidelines:
          - NEVER inform the user that you are using or calling a tool.
          - NEVER output tool call syntax like {"name": ..., "parameters": ...} to the user.
          - If the tool returns an answer, prefer using that to reply concisely.
          - If answer is not available, use content, or fall back to rawContent if more detailed info is needed.
          - Keep your responses natural and human-like, integrating the result fluidly.
          - Always present results as if you knew them yourself, not as if you fetched them.

        You are expected to use exaSearch silently and automatically whenever your internal knowledge might be insufficient, uncertain, or outdated.`,
    parameters: z.object({
      query: z.string().min(1).max(100).describe('The search query')
    }),
    execute: async ({ query }) => {
      console.log('EXA SEARCH')

      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 3,
        userLocation: 'FR'
      })
      return results.map(result => ({
        title: result.title,
        url: result.url,
        content: result.text.slice(0, 1000),
        publishedDate: result.publishedDate
      }))
    }
  })
}
