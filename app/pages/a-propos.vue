<script setup lang="ts">
const { data: page } = await useAsyncData('aPropos', () => queryCollection('aPropos').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useSeoMeta({
  titleTemplate: 'Kipoui - A propos',
  title,
  ogTitle: title,
  description,
  ogDescription: description
})
</script>

<template>
  <div v-if="page">
    <UPageSection
      v-for="(section, index) in page.sections"
      :key="index"
      :title="section.title"
      :description="section.description"
      :orientation="section.orientation"
      :reverse="section.reverse"
      :features="section.features"
    >
      <NuxtImg
        :src="`/${section.image}`"
        class="w-full h-full object-contain rounded-3xl"
      />
    </UPageSection>
  </div>
</template>
