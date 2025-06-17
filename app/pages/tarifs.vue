<script setup lang="ts">
const { data: page } = await useAsyncData('pricing', () => queryCollection('pricing').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  titleTemplate: 'Kipoui - Tarifs',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImageComponent('Saas')
</script>

<template>
  <div v-if="page">
    <UPageHero
      :title="page.title"
      :description="page.description"
    />

    <UContainer>
      <UPricingPlans
        compact
        :plans="page.plans"
      />
    </UContainer>

    <UPageSection
      :title="page.faq.title"
      :description="page.faq.description"
    >
      <UPageAccordion
        :items="page.faq.items"
        multiple
        class="max-w-4xl mx-auto"
      />
    </UPageSection>
  </div>
</template>
