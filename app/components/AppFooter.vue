<script setup lang="ts">
const columns = [{
  label: 'Ressources',
  children: [{
    label: 'CGU',
    to: '/conditions-utilisation'
  }, {
    label: 'Confidentialité',
    to: '/confidentialite'
  }, {
    label: 'Contact',
    to: '/contact'
  }]
}, {
  label: 'Entreprise',
  children: [
    {
      label: 'À propos',
      to: '/a-propos'
    },
    {
      label: 'Tarifs',
      to: '/tarifs'
    },
    {
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
      src: '/images/logo/logo-whithout-text.png'
    }"
    decorative
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #right>
            <div class="flex flex-col items-start gap-6">
              <NuxtImg
                src="/images/logo/logo.png"
                alt="Kipoui"
                width="200"
                height="173"
                format="auto"
                format-quality="80"
              />
              <AppStoreBadge />
            </div>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-sm text-muted">
        Copyright © {{ new Date().getFullYear() }}. Tous droits réservés.
      </p>
    </template>

    <template #right>
      <UColorModeButton />
    </template>
  </UFooter>
</template>
