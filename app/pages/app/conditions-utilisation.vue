<script setup lang="ts">
// Opened by the iOS app in its in-app browser: without the site's header and footer, which lead to
// the offers (a companion app can't link to a purchase, App Store guideline 3.1.3(f))
definePageMeta({
  layout: false
})

useHead({
  title: 'Conditions Générales d\'Utilisation'
})
useSeoMeta({
  description: 'Conditions générales d\'utilisation de Kipoui',
  robots: 'noindex'
})
</script>

<template>
  <LegalTermsOfUse />
</template>
