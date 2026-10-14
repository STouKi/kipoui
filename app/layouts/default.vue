<script setup lang="ts">
const { isNative } = useRuntimeConfig().public
const router = useRouter()
</script>

<template>
  <!-- In the app, only the legal pages use this layout: a way back instead of the site navigation -->
  <div
    v-if="isNative"
    class="fixed inset-0 flex flex-col safe-area-y"
  >
    <div class="px-4 py-2 shrink-0">
      <UButton
        icon="i-lucide-chevron-left"
        size="xl"
        color="neutral"
        variant="subtle"
        class="rounded-full"
        aria-label="Retour"
        @click="router.back()"
      />
    </div>

    <div class="flex-1 overflow-y-auto">
      <slot />
    </div>
  </div>

  <div v-else>
    <AppHeader />

    <UMain>
      <slot />
    </UMain>

    <AppFooter />
  </div>
</template>
