<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'dashboard'
})

const links = [[{
  label: 'Profil',
  icon: 'i-lucide-user',
  to: '/tableau-de-bord/parametres',
  exact: true
}, {
  label: 'Notifications',
  icon: 'i-lucide-bell',
  to: '/tableau-de-bord/parametres/notifications'
}, {
  label: 'Sécurité',
  icon: 'i-lucide-shield',
  to: '/tableau-de-bord/parametres/securite'
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardPanel
    id="settings"
    :ui="{ body: 'lg:py-12' }"
  >
    <template #header>
      <UDashboardNavbar title="Paramètres">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu
          :items="links"
          highlight
          class="flex-1 -mx-1"
        />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div class="flex flex-col w-full mx-auto gap-4 sm:gap-6 lg:gap-12 lg:max-w-2xl">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>
