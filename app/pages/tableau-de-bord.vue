<script setup lang="ts">
useSeoMeta({
  title: 'Tableau de bord',
  description: 'Gérez votre compte et vos préférences'
})
</script>

<template>
  <div class="container mx-auto p-6">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">
            Tableau de bord
          </h1>
        </div>
      </template>

      <div>
        <div class="mb-6">
          <p class="text-lg">
            Bienvenue !
          </p>
        </div>
      </div>
    </UCard>
  </div>
</template>
