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

  // A selection of the conversation list, with the photos and documents attached to them
  async function deleteChats(ids: number[]) {
    await api('/api/chats', { method: 'DELETE', body: { ids } })
    chats.value = chats.value.filter(chat => !ids.includes(chat.id))
  }

  return { chats, loaded, loadChats, deleteChat, deleteChats }
}
