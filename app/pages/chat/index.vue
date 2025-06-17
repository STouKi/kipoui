<script setup lang="ts">
const input = ref('')
const loading = ref(false)

useSeoMeta({
  titleTemplate: 'Kipoui - Chat',
  title: 'Kipoui - Chat',
  ogTitle: 'Kipoui - Chat',
  description: 'Test',
  ogDescription: 'Test'
})

definePageMeta({
  layout: 'chat'
})

async function createChat(prompt: string) {
  input.value = prompt
  loading.value = true
  const chat = await useFetch('/api/chats/post', {
    method: 'POST',
    body: { input: prompt }
  })

  refreshNuxtData('chats')
  navigateTo(`/chat/${chat.data.value?.id}`)
}

function onSubmit() {
  createChat(input.value)
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
    <template #header>
      <DashboardNavbar />
    </template>

    <template #body>
      <UContainer class="flex-1 flex flex-col justify-center gap-4 sm:gap-6 py-8">
        <h1 class="text-3xl sm:text-4xl text-highlighted font-bold">
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
