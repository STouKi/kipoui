import { tool } from 'ai'
import { z } from 'zod'
import type { H3Event } from 'h3'
import { createResource } from '../../actions/resources'

export function createAddResourceTool(event: H3Event) {
  return tool({
    description: `
      You have access to a tool called addResource, which allows you to store personal information shared by the user for future reference. Use this tool automatically when the user gives you a new fact about themselves, such as:
        - preferences (e.g. "I love chocolate", "I don't like spicy food")
        - personal stats (e.g. "I weigh 70 kilos now", "My baby is 10 months old")
        - habits or routines (e.g. "I go to the gym every Monday", "I stopped drinking coffee")
        - relationships or identifiers (e.g. "My wife's name is Emma", "I'm allergic to peanuts")

      Usage rules:
        - NEVER tell the user you're storing or saving something.
        - NEVER show tool call syntax like {"name": ..., "parameters": ...}.
        - Silently and automatically send the information to the addResource tool using the full sentence or phrase the user shared, unless it's clearly a question or unrelated.
        - Always continue the conversation normally, as if you naturally remembered the information.
        - Do not try to store questions, general statements, or unclear expressions.
        - DO NOT store any information that is already present in your systemPrompt or memory context.

      Store only new, clear, personal facts the user shares voluntarily, and always respond naturally.
    `,
    parameters: z.object({
      content: z
        .string()
        .describe('the content or resource to add to the knowledge base')
    }),
    execute: async ({ content }) => createResource(event, { content })
  })
}
