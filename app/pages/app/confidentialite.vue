<script setup lang="ts">
// Opened by the iOS app in its in-app browser: without the site's header and footer, which lead to
// the offers (a companion app can't link to a purchase, App Store guideline 3.1.3(f))
definePageMeta({
  layout: false
})

useHead({
  title: 'Politique de confidentialité'
})
useSeoMeta({
  description: 'Comment Kipoui collecte, utilise et protège vos données personnelles',
  robots: 'noindex'
})
</script>

<template>
  <LegalPrivacyPolicy />
</template>
