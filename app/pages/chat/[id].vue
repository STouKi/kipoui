<script setup lang="ts">
import type { DefineComponent } from 'vue'
import { useChat } from '@ai-sdk/vue'
import type { Message } from '@ai-sdk/vue'
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

const { messages, input, handleSubmit, reload, stop, status, error } = useChat({
  maxSteps: 20,
  id: chatWithMessages.value.chat.id.toString(),
  api: `/api/chats/${chatWithMessages.value.chat.id}`,
  initialMessages: chatWithMessages.value.messages.map((message) => {
    const transformedMessage = {
      id: message.id.toString(),
      content: message.content!,
      role: message.role!
    }

    if (message.experimental_attachments && Array.isArray(message.experimental_attachments)) {
      const attachments = message.experimental_attachments
        .filter(function (attachment) { return attachment && typeof attachment === 'object' })
        .map(function (attachment) {
          if (typeof attachment === 'object' && attachment !== null) {
            interface AttachmentData {
              name?: string
              url?: string
              type?: string
            }
            const typedAttachment = attachment as AttachmentData
            return {
              name: typedAttachment.name || '',
              url: typedAttachment.url || '',
              contentType: typedAttachment.type || ''
            }
          }
          return null
        })
        .filter(function (item) { return item !== null })

      if (attachments.length > 0) {
        Object.assign(transformedMessage, { experimental_attachments: attachments })
      }
    }

    return transformedMessage
  }),
  onResponse(response) {
    if (response.headers.get('X-Chat-Title')) {
      refreshNuxtData('chats')
    }
  },
  onError(error) {
    const { message } = typeof error.message === 'string' && error.message[0] === '{' ? JSON.parse(error.message) : error
    toast.add({
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
      duration: 0
    })
  }
})

const copied = ref(false)

const { data: profile } = await useFetch('/api/profile/simple-get')

function copy(e: MouseEvent, message: Message) {
  clipboard.copy(message.content)

  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}

const submit = (event: Event) => {
  handleSubmit(event, {
    experimental_attachments: files.value as FileList
  })

  files.value = null

  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

onMounted(() => {
  if (chatWithMessages.value?.messages.length === 1) {
    reload()
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
      <UContainer class="flex-1 flex flex-col gap-4 sm:gap-6">
        <UChatMessages
          :messages="messages"
          :status="status"
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
              v-if="message.content.length > 0"
              :value="message.content"
              :cache-key="message.id"
              unwrap="p"
              :components="components"
              :parser-options="{ highlight: false }"
            />
            <span
              v-else-if="message.parts?.find(part => part.type === 'tool-invocation')?.toolInvocation.toolName === 'getInformation'"
              class="italic font-light"
            >
              Récupération des informations...
            </span>

            <span
              v-else-if="message.parts?.find(part => part.type === 'tool-invocation')?.toolInvocation.toolName === 'addResource'"
              class="italic font-light"
            >
              Mémorisation des informations...
            </span>

            <span
              v-else-if="message.parts?.find(part => part.type === 'tool-invocation')?.toolInvocation.toolName === 'exaSearch'"
              class="italic font-light"
            >
              Recherche des informations...
            </span>

            <div
              v-if="message.experimental_attachments?.length"
              class="mt-2 flex flex-wrap gap-2"
            >
              <div
                v-for="(attachment, index) in message.experimental_attachments.filter(a => a?.contentType?.startsWith('image/'))"
                :key="`${message.id}-exp-${index}`"
                class="relative w-40 h-40 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <img
                  :src="attachment.url"
                  :alt="attachment.name || `attachment-${index}`"
                  class="w-full h-full object-cover"
                >
              </div>
            </div>
          </template>
        </UChatMessages>

        <UChatPrompt
          v-model="input"
          placeholder="Entrez votre message ici"
          :error="error"
          variant="subtle"
          class="sticky bottom-0 [view-transition-name:chat-prompt] rounded-b-none z-10"
          @submit="submit"
        >
          <template #footer>
            <UInput
              ref="fileInputRef"
              type="file"
              accept="image/*,application/pdf"
              multiple
              @change="files = ($event.target as HTMLInputElement)?.files"
            />
          </template>

          <UChatPromptSubmit
            :status="status"
            color="neutral"
            @stop="stop"
            @reload="reload"
          />
        </UChatPrompt>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
