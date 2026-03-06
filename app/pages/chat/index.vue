<script setup lang="ts">
const input = ref('')
const loading = ref(false)

useHead({
  title: 'Chat'
})
useSeoMeta({
  description: 'Lancez une conversation avec votre coach',
  robots: 'noindex, nofollow'
})

definePageMeta({
  layout: 'chat'
})

const filesRef = ref<FileList | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

async function createChat(prompt: string, attachments?: FileList | null) {
  input.value = prompt
  loading.value = true

  const formData = new FormData()
  formData.append('input', prompt)

  if (attachments && attachments.length > 0) {
    for (let i = 0; i < attachments.length; i++) {
      const file = attachments[i]
      if (file) {
        formData.append('files', file)
      }
    }
  }

  const chat = await useFetch('/api/chats/post', {
    method: 'POST',
    body: formData
  })

  refreshNuxtData('chats')
  navigateTo(`/chat/${chat.data.value?.id}`)
}

function onSubmit() {
  createChat(input.value, filesRef.value)

  filesRef.value = null
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

const quickChats = [
  {
    label: 'Tu peux m’aider à établir un plan alimentaire ?',
    icon: 'i-lucide-egg-fried'
  },
  {
    label: 'Donne-moi des idées de repas équilibrés pour la semaine.',
    icon: 'i-lucide-heart'
  },
  {
    label: 'J’ai du mal à garder la motivation, tu peux me booster un peu ?',
    icon: 'i-lucide-smile-plus'
  },
  {
    label: 'Quels aliments privilégier pour prendre du muscle sans prendre trop de gras ?',
    icon: 'i-lucide-biceps-flexed'
  },
  {
    label: 'Je grignote souvent le soir, comment je peux éviter ça ?',
    icon: 'i-lucide-cookie'
  }
]
</script>

<template>
  <UDashboardPanel
    id="home"
    :ui="{ body: 'p-0 sm:p-0' }"
  >
    <template #body>
      <UContainer class="flex flex-col justify-center flex-1 py-8 gap-4 sm:gap-6">
        <h1 class="text-3xl font-bold sm:text-4xl text-highlighted">
          Comment puis-je vous aider aujourd'hui ?
        </h1>

        <UChatPrompt
          v-model="input"
          placeholder="Entrez votre message ici"
          :status="loading ? 'streaming' : 'ready'"
          class="[view-transition-name:chat-prompt]"
          variant="subtle"
          @submit="onSubmit"
        >
          <template #footer>
            <UInput
              ref="fileInputRef"
              type="file"
              accept="image/*,application/pdf"
              multiple
              @change="filesRef = ($event.target as HTMLInputElement)?.files"
            />
          </template>
          <UChatPromptSubmit color="neutral" />
        </UChatPrompt>

        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickChat in quickChats"
            :key="quickChat.label"
            :icon="quickChat.icon"
            :label="quickChat.label"
            size="sm"
            color="neutral"
            variant="outline"
            class="rounded-full"
            @click="createChat(quickChat.label)"
          />
        </div>
      </UContainer>
    </template>
  </UDashboardPanel>
</template>
