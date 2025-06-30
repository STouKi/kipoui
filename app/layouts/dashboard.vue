<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Tableau de bord',
  icon: 'i-lucide-circle-gauge',
  to: '/tableau-de-bord',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Chat',
  icon: 'i-lucide-message-square-text',
  to: '/chat'
}, {
  label: 'Paramètres',
  to: '/tableau-de-bord/parametres',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  children: [{
    label: 'Profil',
    to: '/tableau-de-bord/parametres',
    exact: true,
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Notifications',
    to: '/tableau-de-bord/parametres/notifications',
    onSelect: () => {
      open.value = false
    }
  }, {
    label: 'Sécurité',
    to: '/tableau-de-bord/parametres/securite',
    onSelect: () => {
      open.value = false
    }
  }]
}]] satisfies NavigationMenuItem[][]

onMounted(async () => {
  const cookie = useCookie('cookie-consent')
  if (cookie.value === 'accepted') {
    return
  }

  toast.add({
    title: 'Nous utilisons des cookies tiers pour améliorer votre expérience sur notre site.',
    duration: 0,
    close: false,
    actions: [{
      label: 'Accepter',
      color: 'neutral',
      variant: 'outline',
      onClick: () => {
        cookie.value = 'accepted'
      }
    }, {
      label: 'Refuser',
      color: 'neutral',
      variant: 'ghost'
    }]
  })
})
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
