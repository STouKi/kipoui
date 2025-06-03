<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const toast = useToast()

const open = ref(false)

const links = [[{
  label: 'Accueil',
  icon: 'i-lucide-house',
  to: '/tableau-de-bord',
  onSelect: () => {
    open.value = false
  }
}, {
  label: 'Paramètres',
  to: '/tableau-de-bord/parametres',
  icon: 'i-lucide-settings',
  defaultOpen: true,
  type: 'trigger',
  children: [{
    label: 'Général',
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
}], [{
  label: 'Retour d\'information',
  icon: 'i-lucide-message-circle',
  to: 'https://github.com/nuxt-ui-pro/dashboard',
  target: '_blank'
}, {
  label: 'Aide & Support',
  icon: 'i-lucide-info',
  to: 'https://github.com/nuxt/ui-pro',
  target: '_blank'
}]] satisfies NavigationMenuItem[][]

const groups = computed(() => [{
  id: 'links',
  label: 'Navigation',
  items: links.flat()
}])

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
        <UDashboardSearchButton
          label="Rechercher..."
          :collapsed="collapsed"
          class="bg-transparent ring-default"
        />

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

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>
