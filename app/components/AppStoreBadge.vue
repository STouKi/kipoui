<script setup lang="ts">
// Apple's official badge (Apple Marketing Tools, French, black), used as is: Apple forbids
// redrawing or altering it
const props = withDefaults(defineProps<{ height?: number }>(), { height: 44 })

// Counted as the `site` campaign in App Store Connect
const href = appStoreCampaignUrl('site')
// The badge's own proportions (126.5 x 40)
const width = computed(() => Math.round(props.height * 126.5 / 40))
</script>

<template>
  <a
    :href="href"
    class="inline-block shrink-0"
  >
    <img
      src="/images/app-store-badge.svg"
      alt="Télécharger dans l'App Store"
      :width="width"
      :height="height"
      class="block"
    >
  </a>
</template>
