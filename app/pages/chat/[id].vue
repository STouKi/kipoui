<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage, FileUIPart } from 'ai'
import { useClipboard } from '@vueuse/core'
import ProseStreamPre from '../../components/prose/PreStream.vue'
import type { ChatWithMessages } from '~~/server/repositories/chatRepository'

const components = {
  pre: ProseStreamPre as unknown as DefineComponent
}

const route = useRoute()
const toast = useToast()
const clipboard = useClipboard()

definePageMeta({
  layout: 'chat'
})

const { data: chatWithMessages } = await useFetch<ChatWithMessages>(`/api/chats/${route.params.id}`, {
  cache: 'force-cache'
})
if (!chatWithMessages.value) {
  throw createError({ statusCode: 404, statusMessage: 'Chat not found', fatal: true })
}

const files = ref<FileList | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

const initialMessages: UIMessage[] = chatWithMessages.value.messages.map((message) => {
  const parts: UIMessage['parts'] = []

  if (message.content && message.content.length > 0) {
    parts.push({ type: 'text', text: message.content })
  }

  if (message.experimental_attachments && Array.isArray(message.experimental_attachments)) {
    const fileParts: FileUIPart[] = message.experimental_attachments
      .filter((attachment: any) => attachment && typeof attachment === 'object')
      .map((attachment: any): FileUIPart => ({
        type: 'file' as const,
        filename: attachment.name || '',
        url: attachment.url || '',
        mediaType: attachment.type || attachment.contentType || ''
      }))
      .filter(p => !!p.url)

    parts.push(...fileParts)
  }

  return {
    id: message.id.toString(),
    role: message.role!,
    parts
  }
})

const chat = new Chat({
  id: chatWithMessages.value.chat.id.toString(),
  messages: initialMessages,
  transport: new DefaultChatTransport({ api: `/api/chats/${chatWithMessages.value.chat.id}` }),
  onFinish: () => {
    refreshNuxtData('chats')
  },
  onError(error) {
    const { message } = typeof error.message === 'string' && (error as any).message[0] === '{' ? JSON.parse((error as any).message) : (error as any)
    toast.add({ description: message, icon: 'i-lucide-alert-circle', color: 'error', duration: 0 })
  }
})

const copied = ref(false)

const { data: profile } = await useFetch('/api/profile/simple-get')

// Debug helper: render raw text without MDC when `?raw=1` is in the URL
const renderRaw = computed(() => String(route.query.raw || '') === '1')

function copy(e: MouseEvent, message: UIMessage) {
  const text = (message.parts || [])
    .filter(p => p.type === 'text')
    .map(p => p.text)
    .join('')
  clipboard.copy(text)
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}

function imageParts(m: UIMessage): FileUIPart[] {
  return (m.parts ?? []).filter((p): p is FileUIPart => p.type === 'file' && !!p.mediaType && p.mediaType.startsWith('image/'))
}

const input = ref('')

const handleSubmit = (event: Event) => {
  event.preventDefault()
  if ((input.value && input.value.trim().length > 0) || (files.value && files.value.length > 0)) {
    chat.sendMessage({ text: input.value, files: files.value ?? undefined })
  }
  input.value = ''
  files.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

onMounted(() => {
  const msgs = chat.messages
  const last = msgs.length > 0 ? msgs[msgs.length - 1] : undefined
  if (last?.role === 'user') {
    chat.regenerate()
  }
})
</script>

<template>
  <UDashboardPanel
    id="chat"
    class="relative"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex flex-col flex-1 gap-4 sm:gap-6">
        <UChatMessages
          :messages="chat.messages"
          :status="chat.status"
          :assistant="{ actions: [{ label: 'Copier', icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy', onClick: copy }], icon: 'i-lucide-bot' }"
          :user="{
            icon: profile?.avatar_url ? undefined : 'i-lucide-user',
            avatar: profile?.avatar_url ? {
              src: profile.avatar_url,
              alt: (profile?.username ?? profile?.full_name ?? undefined)
            } : undefined
          }"
          class="lg:pt-(--ui-header-height) pb-4 sm:pb-6"
          :spacing-offset="160"
        >
          <template #content="{ message }">
            <MDCCached
              v-if="message.parts?.some(p => p.type === 'text') && !renderRaw"
              :value="message.parts.filter(p => p.type === 'text').map(p => p.text).join('')"
              :cache-key="message.id"
              unwrap="p"
              :components="components"
              :parser-options="{ highlight: false }"
            />
            <pre
              v-else-if="message.parts?.some(p => p.type === 'text') && renderRaw"
              class="whitespace-pre-wrap font-sans text-[length:inherit] leading-normal"
            >{{ message.parts.filter(p => p.type === 'text').map(p => p.text).join('') }}</pre>
            <span
              v-else-if="message.parts?.some(part => part.type === 'tool-getInformation')"
              class="italic font-light"
            >
              Récupération des informations...
            </span>
            <span
              v-else-if="message.parts?.some(part => part.type === 'tool-addResource')"
              class="italic font-light"
            >
              Mémorisation des informations...
            </span>
            <span
              v-else-if="message.parts?.some(part => part.type === 'tool-exaSearch')"
              class="italic font-light"
            >
              Recherche des informations...
            </span>
            <div
              v-if="imageParts(message).length"
              class="flex flex-wrap mt-2 gap-2"
            >
              <div
                v-for="(part, index) in imageParts(message)"
                :key="`${message.id}-file-${index}`"
                class="relative w-40 h-40 overflow-hidden border border-gray-200 rounded-lg dark:border-gray-700"
              >
                <img
                  :src="part.url"
                  :alt="part.filename || `attachment-${index}`"
                  class="object-cover w-full h-full"
                >
              </div>
            </div>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          placeholder="Entrez votre message ici"
          :error="chat.error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          @submit="handleSubmit"
        >
          <template #footer>
            <UInput
              ref="fileInputRef"
              type="file"
              accept="image/*,text/*,application/pdf"
              multiple
              @change="files = ($event.target as HTMLInputElement)?.files"
            />
          </template>

          <UChatPromptSubmit
            :status="chat.status"
            color="neutral"
            @stop="chat.stop"
            @reload="chat.regenerate"
          />
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
