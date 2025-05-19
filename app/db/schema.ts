import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core'

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  username: varchar(),
  fullName: varchar('full_name'),
  avatarUrl: varchar('avatar_url')
})
