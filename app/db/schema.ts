import { pgTable, pgEnum, uuid, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const genderEnum = pgEnum('gender', ['male', 'female'])

export const allergyEnum = pgEnum('allergy', [
  'celery',
  'cereals_containing_gluten',
  'crustaceans',
  'eggs',
  'fish',
  'lupin',
  'milk',
  'molluscs',
  'mustard',
  'peanuts',
  'sesame_seeds',
  'soybeans',
  'sulphur_dioxide_and_sulphites',
  'tree_nuts'
])

export const dietEnum = pgEnum('diet', ['vegan', 'vegetarian', 'pescatarian'])

export const religiousRegimeEnum = pgEnum('religious_regime', ['halal', 'kasher', 'buddhist', 'religious_fasting'])

export const medicalRegimenEnum = pgEnum('medical_regimen', ['diabetes', 'cholesterol', 'hypertension', 'crohn'])

export const eatingDisordersEnum = pgEnum('eating_disorders', ['anorexia', 'bulimia'])

export const roleEnum = pgEnum('role', ['user', 'assistant'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  username: text(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),

  profileDetail: text('profile_detail')
})

export const physicalData = pgTable('physical_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  gender: genderEnum(),
  birthDate: timestamp('birth_date'),
  heightCm: integer('height_cm'),
  weightKg: integer('weight_kg'),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const goals = pgTable('goals', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  targetWeight: integer('target_weight'),
  deadline: timestamp(),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const habits = pgTable('habits', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  sportWeekFrequency: integer('sport_week_frequency'),
  compulsivesHabits: boolean('compulsive_habits').notNull().default(false),
  diet: dietEnum(),
  religiousRegime: religiousRegimeEnum('religious_regime'),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const medicalData = pgTable('medical_data', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  medicalRegimen: medicalRegimenEnum('medical_regimen'),
  allergies: allergyEnum().array(),
  eatingDisorders: eatingDisordersEnum('eating_disorders').array(),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const preferences = pgTable('preferences', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),

  dislikes: text().array(),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const chats = pgTable('chats', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  title: text(),

  profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' })
})

export const messages = pgTable('messages', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  createdAt: timestamp('created_at').defaultNow().notNull(),

  role: roleEnum(),
  content: text(),

  chatId: integer('chat_id').references(() => chats.id, { onDelete: 'cascade' })
})

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  physicalData: one(physicalData),
  goals: one(goals),
  habits: one(habits),
  medicalData: one(medicalData),
  preferences: one(preferences),
  chats: many(chats)
}))

export const physicalDataRelations = relations(physicalData, ({ one }) => ({
  profile: one(profiles, {
    fields: [physicalData.profileId],
    references: [profiles.id]
  })
}))

export const goalsRelations = relations(goals, ({ one }) => ({
  profile: one(profiles, {
    fields: [goals.profileId],
    references: [profiles.id]
  })
}))

export const habitsRelations = relations(habits, ({ one }) => ({
  profile: one(profiles, {
    fields: [habits.profileId],
    references: [profiles.id]
  })
}))

export const medicalDataRelations = relations(medicalData, ({ one }) => ({
  profile: one(profiles, {
    fields: [medicalData.profileId],
    references: [profiles.id]
  })
}))

export const preferencesRelations = relations(preferences, ({ one }) => ({
  profile: one(profiles, {
    fields: [preferences.profileId],
    references: [profiles.id]
  })
}))

export const chatsRelations = relations(chats, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [chats.profileId],
    references: [profiles.id]
  }),
  messages: many(messages)
}))

export const messagesRelations = relations(messages, ({ one }) => ({
  chat: one(chats, {
    fields: [messages.chatId],
    references: [chats.id]
  })
}))
