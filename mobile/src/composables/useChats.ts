import { ref, watch } from 'vue'
import { api } from '@/lib/api'
import { session } from '@/lib/session'
import type { Chat } from '@/lib/types'

// Shared by the conversation list and the conversation screen, which refreshes it
const chats = ref<Chat[]>([])
const loaded = ref(false)

watch(session, (value) => {
  if (!value) {
    chats.value = []
    loaded.value = false
  }
})

export function useChats() {
  async function loadChats() {
    chats.value = await api<Chat[]>('/api/chats/get')
    loaded.value = true
  }

  async function deleteChat(id: number) {
    await api(`/api/chats/${id}`, { method: 'DELETE' })
    chats.value = chats.value.filter(chat => chat.id !== id)
  }

  return { chats, loaded, loadChats, deleteChat }
}
