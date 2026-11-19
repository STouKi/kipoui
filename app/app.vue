<script setup lang="ts">
import { fr } from '@nuxt/ui/locale'

const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')
const route = useRoute()

useHead({
  titleTemplate: (titleChunk) => {
    return titleChunk ? `Kipoui - ${titleChunk}` : 'Kipoui'
  },
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' }
  ],
  htmlAttrs: {
    lang: 'fr'
  }
})

// Safari on iPhone offers the app in a banner above the site's pages, except those opened inside
// the app (/app/...)
useHead({
  meta: computed(() => route.path.startsWith('/app/')
    ? []
    : [{ key: 'apple-itunes-app', name: 'apple-itunes-app', content: `app-id=${APP_STORE_ID}` }])
})

// Share previews of the pages without their own image: the launch film's poster
const shareImage = 'https://kipoui.com/images/og-kipoui.jpg'

useSeoMeta({
  ogImage: shareImage,
  twitterImage: shareImage,
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp :locale="fr">
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
