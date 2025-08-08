<script setup lang="ts">
const userStore = useUserStore()
const { isAuthenticated } = storeToRefs(userStore)

const route = useRoute()

const items = computed(() => [
  {
    label: 'À propos',
    to: '/a-propos',
    active: route.path.startsWith('/a-propos')
  },
  {
    label: 'Tarifs',
    to: '/tarifs',
    active: route.path.startsWith('/tarifs')
  },
  {
    label: 'Blog',
    to: '/blog',
    active: route.path.startsWith('/blog')
  }
])
</script>

<template>
  <UHeader mode="drawer">
    <template #left>
      <NuxtLink to="/">
        <NuxtImg
          src="/images/logo/logo.png"
          alt="Kipoui"
          width="60"
          height="52"
          format="auto"
          format-quality="80"
        />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <template v-if="!isAuthenticated">
        <UColorModeButton />

        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          to="/connexion"
          class="lg:hidden"
          aria-label="Se connecter"
        />

        <UButton
          label="Se connecter"
          color="neutral"
          variant="outline"
          to="/connexion"
          class="hidden lg:inline-flex"
        />

        <UButton
          label="S'inscrire"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          to="/inscription"
        />
      </template>

      <template v-else>
        <UserMenu />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <template v-if="!isAuthenticated">
        <USeparator class="my-6" />

        <UButton
          label="Se connecter"
          color="neutral"
          variant="subtle"
          to="/connexion"
          block
          class="mb-3"
        />
        <UButton
          label="S'inscrire"
          color="neutral"
          to="/inscription"
          block
        />
      </template>
    </template>
  </UHeader>
</template>
