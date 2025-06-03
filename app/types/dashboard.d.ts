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
