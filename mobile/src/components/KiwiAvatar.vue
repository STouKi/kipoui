<script setup lang="ts">
import kiwi from '@/assets/kiwi.png'

withDefaults(defineProps<{ size?: number }>(), { size: 40 })
</script>

<template>
  <img
    :src="kiwi"
    :width="size"
    :height="size"
    alt=""
    class="kiwi-avatar"
  >
</template>

<style scoped>
.kiwi-avatar {
  flex-shrink: 0;
  display: block;
}
</style>
