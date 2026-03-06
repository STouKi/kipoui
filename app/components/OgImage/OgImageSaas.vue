<script setup lang="ts">
defineOptions({
  inheritAttrs: false
})

defineProps({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  }
})
</script>

<template>
  <div class="flex flex-col justify-center w-full h-full p-8 text-center bg-slate-900">
    <div class="relative">
      <h1 class="mb-4 text-white text-8xl">
        {{ title }}
      </h1>
      <p class="text-5xl leading-tight text-gray-200">
        {{ description }}
      </p>
    </div>
  </div>
</template>
