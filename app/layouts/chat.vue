<script setup lang="ts">
import { LazyModalConfirm } from '#components'

const route = useRoute()
const toast = useToast()
const overlay = useOverlay()
const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)

const open = ref(false)

const deleteModal = overlay.create(LazyModalConfirm, {
  props: {
    title: 'Supprimer le chat',
    description: 'Êtes-vous sûr de vouloir supprimer ce chat ? Cette action est irréversible.'
  }
})

const { data: chats, refresh: refreshChats } = await useFetch('/api/chats/get', {
  key: 'chats',
  transform: data => data.map(chat => ({
    id: chat.id.toString(),
    label: chat.title || 'Untitled',
    to: `/chat/${chat.id}`,
    icon: 'i-lucide-message-circle',
    createdAt: chat.created_at
  }))
})

onNuxtReady(async () => {
  const first10 = (chats.value || []).slice(0, 10)
  for (const chat of first10) {
    await $fetch(`/api/chats/${chat.id}`)
  }
})

const { groups } = useChats(chats)

const items = computed(() => groups.value?.flatMap((group) => {
  return [{
    label: group.label,
    type: 'label' as const
  }, ...group.items.map(item => ({
    ...item,
    slot: 'chat' as const,
    icon: undefined,
    class: item.label === 'Untitled' ? 'text-muted' : ''
  }))]
}))

async function deleteChat(id: string) {
  const instance = deleteModal.open()
  const result = await instance.result
  if (!result) {
    return
  }

  await $fetch(`/api/chats/${id}`, { method: 'DELETE' })

  toast.add({
    title: 'Chat supprimé',
    description: 'Votre chat a été supprimé',
    icon: 'i-lucide-trash'
  })

  refreshChats()

  if (route.params.id === id) {
    navigateTo('/chat')
  }
}

defineShortcuts({
  c: () => {
    navigateTo('/chat')
  }
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      :min-size="12"
      collapsible
      resizable
      class="bg-elevated/50"
    >
      <template #header="{ collapsed }">
        <NuxtLink
          to="/chat"
          class="flex items-center gap-1"
        >
          <NuxtImg
            src="/images/logo/logo-whithout-text.png"
            alt="Kiwi"
            width="30"
            height="30"
            format="auto"
            format-quality="80"
          />
          <span
            v-if="!collapsed"
            class="text-xl font-bold text-primary"
          >Chat</span>
        </NuxtLink>

        <div
          v-if="!collapsed"
          class="flex items-center gap-1.5 ms-auto"
        >
          <UDashboardSidebarCollapse />
        </div>
      </template>

      <template #default="{ collapsed }">
        <div class="flex flex-col gap-1.5">
          <UButton
            v-bind="collapsed ? { icon: 'i-lucide-plus' } : { label: 'Nouveau chat' }"
            variant="soft"
            block
            to="/chat"
            @click="open = false"
          />

          <template v-if="collapsed">
            <UDashboardSearchButton collapsed />
            <UDashboardSidebarCollapse />
          </template>
        </div>

        <UNavigationMenu
          v-if="!collapsed"
          :items="items"
          :collapsed="collapsed"
          orientation="vertical"
          :ui="{ link: 'overflow-hidden' }"
        >
          <template #chat-trailing="{ item }">
            <div class="flex -mr-1.25 translate-x-full group-hover:translate-x-0 transition-transform">
              <UButton
                icon="i-lucide-x"
                color="neutral"
                variant="ghost"
                size="xs"
                class="text-muted hover:text-primary hover:bg-accented/50 focus-visible:bg-accented/50 p-0.5"
                tabindex="-1"
                aria-label="Supprimer le chat"
                @click.stop.prevent="deleteChat((item as any).id)"
              />
            </div>
          </template>
        </UNavigationMenu>
      </template>

      <template #footer="{ collapsed }">
        <UserMenu
          v-if="isAuthenticated"
          :collapsed="collapsed"
        />
      </template>
    </UDashboardSidebar>

    <slot />

    <SubscriptionRequiredOverlay />
  </UDashboardGroup>
</template>
