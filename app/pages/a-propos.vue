<script setup lang="ts">
const { data: page } = await useAsyncData('aPropos', () => queryCollection('aPropos').first())

const title = page.value?.seo?.title || page.value?.title
const description = page.value?.seo?.description || page.value?.description

useHead({
  title
})
useSeoMeta({
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
        :src="`/images/${section.image.name}.${section.image.extension}`"
        :width="section.image.width"
        :height="section.image.height"
        :alt="section.image.alt"
        format="auto"
        format-quality="80"
        class="object-contain w-full h-full rounded-3xl"
      />
    </UPageSection>
  </div>
</template>
