<script setup lang="ts">
import { computed } from 'vue'
import { useProfile } from '@/composables/useProfile'

// The user's photo, or their initials
const props = withDefaults(defineProps<{ size?: number }>(), { size: 64 })

const { profile, displayName } = useProfile()

const avatarUrl = computed(() => profile.value?.profile?.avatar_url ?? null)
const initials = computed(() => displayName.value
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(word => word.charAt(0).toUpperCase())
  .join(''))

const style = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${Math.round(props.size * 0.375)}px`
}))
</script>

<template>
  <img
    v-if="avatarUrl"
    :src="avatarUrl"
    alt=""
    class="avatar"
    :style="style"
  >
  <span
    v-else
    class="avatar initials"
    aria-hidden="true"
    :style="style"
  >{{ initials }}</span>
</template>

<style scoped>
.avatar {
  flex-shrink: 0;
  border-radius: 50%;
  object-fit: cover;
}

.initials {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--kp-tint-bg);
  color: var(--kp-tint-fg);
  font-weight: 600;
}
</style>
