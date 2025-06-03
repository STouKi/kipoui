<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const user = useSupabaseUser()
const supabase = useSupabaseClient()
const toast = useToast()
const colorMode = useColorMode()

const items = computed<DropdownMenuItem[][]>(() => ([[{
  type: 'label',
  icon: 'i-lucide-user',
  label: user.value?.user_metadata?.name || user.value?.user_metadata?.username || 'Mon compte',
  avatar: {
    src: user.value?.user_metadata?.avatar,
    alt: user.value?.user_metadata?.name || user.value?.user_metadata?.username
  }
}], [{
  label: 'Thème',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Lumineux',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()

      colorMode.preference = 'light'
    }
  }, {
    label: 'Sombre',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onUpdateChecked(checked: boolean) {
      if (checked) {
        colorMode.preference = 'dark'
      }
    },
    onSelect(e: Event) {
      e.preventDefault()
    }
  }]
}], [{
  label: 'Accueil',
  icon: 'i-lucide-home',
  to: '/'
}, {
  label: 'Tableau de bord',
  icon: 'i-lucide-layout-dashboard',
  to: '/tableau-de-bord'
}, {
  label: 'Chat',
  icon: 'i-lucide-message-square-text',
  to: '/chat'
}], [{
  label: 'Se déconnecter',
  icon: 'i-lucide-log-out',
  onSelect: async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      toast.add({
        title: 'Erreur',
        description: error.message,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })

      return
    }

    toast.add({
      title: 'Succès',
      description: 'Déconnexion effectuée avec succès',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    navigateTo('/')
  }
}]]))
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      v-bind="{
        label: collapsed ? undefined : (user?.user_metadata?.name || user?.user_metadata?.username || 'Mon compte'),
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down'
      }"
      :avatar="{
        src: user?.user_metadata?.avatar || undefined,
        alt: user?.user_metadata?.name || user?.user_metadata?.username
      }"
      icon="i-lucide-user"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated w-50"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />

    <template #chip-leading="{ item }">
      <span
        :style="{
          '--color-light': `var(--color-${(item as any).chip}-500)`,
          '--color-dark': `var(--color-${(item as any).chip}-400)`
        }"
        class="ms-0.5 size-2 rounded-full bg-(--color-light) dark:bg-(--color-dark)"
      />
    </template>
  </UDropdownMenu>
</template>
