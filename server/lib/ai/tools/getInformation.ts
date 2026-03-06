import { tool } from 'ai'
import { z } from 'zod/v3'
import type { H3Event } from 'h3'
import { findRelevantContent } from '../embedding'

export function createGetInformationTool(event: H3Event) {
  return tool({
    description: `
      You have access to a tool called getInformation, which allows you to retrieve relevant personal facts previously shared by the user. Use this tool automatically whenever a user's question or request might relate to something they told you earlier, such as:
        - follow-ups to past conversations (e.g. "How much weight have I lost?", "What did I say I eat for breakfast?")
        - reminders of preferences, habits, or personal context (e.g. "Remind me what supplements I'm taking", "What's my baby's age again?")
        - vague or context-dependent questions (e.g. "What's my goal weight?", "What did I say about my gym schedule?")

      Usage rules:
        - NEVER tell the user you are accessing stored information.
        - NEVER show tool call syntax like {"name": ..., "parameters": ...}.
        - Use getInformation silently whenever the user's query seems to depend on prior personal information.
        - Use the user's full question as the search query.
        - Present your answer naturally and confidently, as if you remembered it yourself.
        - If nothing relevant is found, continue the conversation without mentioning the tool.

      Use this tool proactively to make your answers more personalized and context-aware.
    `,
    inputSchema: z.object({
      question: z.string().describe('the user\'s question to search for in the knowledge base')
    }),
    execute: async ({ question }) => findRelevantContent(event, question)
  })
}
