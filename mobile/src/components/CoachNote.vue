<script setup lang="ts">
import KiwiAvatar from '@/components/KiwiAvatar.vue'

// The coach's comment on a meal. Without text, the coach is still writing it
defineProps<{
  text: string | null
  caption?: string
}>()
</script>

<template>
  <section
    class="card coach-note"
    aria-live="polite"
  >
    <KiwiAvatar :size="36" />
    <div class="body">
      <span class="label">Le mot du coach<template v-if="caption"> · {{ caption }}</template></span>
      <p v-if="text">
        {{ text }}
      </p>
      <p
        v-else
        class="writing"
      >
        Le coach regarde votre repas<span
          class="dots"
          aria-hidden="true"
        ><span>.</span><span>.</span><span>.</span></span>
      </p>
    </div>
  </section>
</template>

<style scoped>
.coach-note {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.label {
  font-size: 13px;
  font-weight: 500;
  color: var(--kp-accent);
}

p {
  margin: 0;
  font-size: 16px;
  line-height: 22px;
  color: var(--kp-text);
}

.writing {
  color: var(--kp-text-muted);
}

.dots span {
  animation: blink 1.2s infinite both;
}

.dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% {
    opacity: 0.2;
  }

  40% {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .dots span {
    animation: none;
  }
}
</style>
