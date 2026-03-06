<template>
  <UDashboardNavbar
    class="sticky inset-x-0 top-0 z-10 border-b-0 pointer-events-none lg:absolute bg-default/75 backdrop-blur lg:bg-transparent lg:backdrop-blur-none"
    :ui="{ left: 'pointer-events-auto', right: 'pointer-events-auto' }"
  >
    <template #right>
      <UColorModeButton />

      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-plus"
        to="/chat"
        class="lg:hidden"
        aria-label="Nouveau chat"
      />
    </template>
  </UDashboardNavbar>
</template>
