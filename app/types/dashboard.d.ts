import type { AvatarProps } from '@nuxt/ui'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  location: string
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}
