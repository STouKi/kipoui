<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)
// Subscriptions are only managed on the website (companion app, App Store guideline 3.1.3(f))
const { isNative } = useRuntimeConfig().public

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
  }, ...(isNative
    ? []
    : [{
        label: 'Abonnement',
        to: '/tableau-de-bord/parametres/abonnement',
        onSelect: () => {
          open.value = false
        }
      }]), {
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
  const config = useRuntimeConfig()
  if (config.public.isNative) return
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
  <UDashboardGroup
    unit="rem"
    class="safe-area-panels"
  >
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default', content: 'safe-area-y' }"
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
