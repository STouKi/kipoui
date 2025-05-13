<script setup lang="ts">
const columns = [
  {
    label: 'Entreprise',
    children: [
      {
        label: 'À propos',
        to: '/a-propos'
      },
      {
        label: 'Tarifs',
        to: '/tarifs'
      }, {
        label: 'Blog',
        to: '/blog'
      }
    ]
  }
]
</script>

<template>
  <USeparator
    :avatar="{
      src: '/logo/logo-whithout-text.png'
    }"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #right>
            <NuxtImg
              src="/logo/logo.png"
              alt="Kipoui"
              width="200"
            />
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        Copyright © {{ new Date().getFullYear() }}. Tous droits réservés.
      </p>
    </template>

    <template #right>
      <UColorModeButton />
    </template>
  </UFooter>
</template>
