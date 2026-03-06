<template>
  <div class="flex items-center justify-center h-screen px-4">
    <UButton
      icon="i-lucide-chevron-left"
      to="/"
      size="xl"
      color="neutral"
      variant="subtle"
      class="absolute z-10 rounded-full left-8 top-8"
      aria-label="Retour"
    />

    <UPageCard
      variant="subtle"
      class="w-full max-w-sm"
    >
      <slot />
    </UPageCard>
  </div>
</template>
