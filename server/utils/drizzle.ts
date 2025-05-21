import * as schema from '../../app/db/schema'
import { db } from '../../app/db/index'

export { eq, and, or } from 'drizzle-orm'

export const tables = schema

export function useDrizzle() {
  return db
}

export type Chat = typeof schema.chats.$inferSelect
export type Message = typeof schema.messages.$inferSelect

export const query = db.query
