<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon, IonSpinner } from '@ionic/vue'
import { documentTextOutline } from 'ionicons/icons'
import type { FileUIPart, UIMessage } from 'ai'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import { renderMarkdown } from '@/lib/markdown'
import { openExternal } from '@/lib/native'

const props = defineProps<{
  message: UIMessage
  // The answer being written: shows the typing dots until there is something to read
  active?: boolean
}>()

// What the coach is doing before its answer starts (same labels as the website)
const TOOL_LABELS: Record<string, string> = {
  'tool-getInformation': 'Récupération des informations…',
  'tool-addResource': 'Mémorisation des informations…',
  'tool-exaSearch': 'Recherche des informations…',
  'tool-logWeight': 'Enregistrement du poids…'
}

const text = computed(() => props.message.parts
  .flatMap(part => part.type === 'text' ? [part.text] : [])
  .join(''))

const files = computed(() => props.message.parts.filter((part): part is FileUIPart => part.type === 'file'))
const images = computed(() => files.value.filter(file => file.mediaType.startsWith('image/') && file.url))
const documents = computed(() => files.value.filter(file => !file.mediaType.startsWith('image/')))

const toolLabel = computed(() => {
  const tool = [...props.message.parts].reverse().find(part => part.type in TOOL_LABELS)
  return tool ? TOOL_LABELS[tool.type] : undefined
})

const html = computed(() => renderMarkdown(text.value))

// Links of the coach's answers open in the in-app browser
function onClick(event: MouseEvent) {
  const link = (event.target as HTMLElement).closest('a')
  if (link?.href.startsWith('http')) {
    event.preventDefault()
    openExternal(link.href)
  }
}
</script>

<template>
  <div
    v-if="message.role === 'user'"
    class="user"
  >
    <div
      v-if="images.length || documents.length"
      class="attachments"
    >
      <img
        v-for="(image, index) in images"
        :key="index"
        :src="image.url"
        :alt="image.filename || 'Photo envoyée'"
        class="photo"
      >
      <span
        v-for="(document, index) in documents"
        :key="index"
        class="document"
      >
        <ion-icon
          :icon="documentTextOutline"
          aria-hidden="true"
        />
        {{ document.filename || 'Document' }}
      </span>
    </div>
    <p
      v-if="text"
      class="bubble"
    >
      {{ text }}
    </p>
  </div>

  <div
    v-else-if="text || toolLabel || active"
    class="assistant"
  >
    <KiwiAvatar :size="28" />
    <!-- eslint-disable vue/no-v-html -- markdown rendered without raw HTML (lib/markdown.ts) -->
    <div
      v-if="text"
      class="bubble markdown"
      @click="onClick"
      v-html="html"
    />
    <!-- eslint-enable vue/no-v-html -->
    <p
      v-else-if="toolLabel"
      class="bubble status"
    >
      <ion-spinner name="crescent" />
      {{ toolLabel }}
    </p>
    <p
      v-else
      class="bubble typing"
      aria-label="Le coach écrit"
    >
      <span />
      <span />
      <span />
    </p>
  </div>
</template>

<style scoped>
.user {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.assistant {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.bubble {
  margin: 0;
  font-size: 17px;
  line-height: 23px;
  -webkit-user-select: text;
  user-select: text;
  overflow-wrap: anywhere;
}

.user .bubble {
  max-width: 80%;
  padding: 10px 14px;
  border-radius: 20px 20px 6px 20px;
  background: var(--kp-green);
  color: var(--kp-on-green);
  white-space: pre-wrap;
}

.assistant .bubble {
  min-width: 0;
  max-width: calc(100% - 36px);
  padding: 12px 14px;
  border-radius: 20px 20px 20px 6px;
  background: var(--kp-fill);
  color: var(--kp-text);
}

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-style: italic;
  color: var(--kp-text-muted) !important;
}

.status ion-spinner {
  width: 16px;
  height: 16px;
  color: var(--kp-text-muted);
}

.typing {
  display: flex;
  gap: 5px;
  padding: 16px 16px !important;
}

.typing span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--kp-text-subtle);
  animation: typing 1.2s infinite ease-in-out;
}

.typing span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing {
  0%,
  60%,
  100% {
    opacity: 0.35;
    transform: translateY(0);
  }

  30% {
    opacity: 1;
    transform: translateY(-3px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .typing span {
    animation: none;
  }
}

.attachments {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;
  max-width: 80%;
}

.photo {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 16px;
  background: var(--kp-fill);
}

.document {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 16px;
  background: var(--kp-fill);
  font-size: 15px;
}

.markdown :deep(> :first-child) {
  margin-top: 0;
}

.markdown :deep(> :last-child) {
  margin-bottom: 0;
}

.markdown :deep(p),
.markdown :deep(ul),
.markdown :deep(ol) {
  margin: 0 0 10px;
}

.markdown :deep(ul),
.markdown :deep(ol) {
  padding-left: 22px;
}

.markdown :deep(li + li) {
  margin-top: 4px;
}

.markdown :deep(h1),
.markdown :deep(h2),
.markdown :deep(h3),
.markdown :deep(h4) {
  margin: 14px 0 6px;
  font-size: 18px;
  line-height: 24px;
  font-weight: 600;
}

.markdown :deep(strong) {
  font-weight: 600;
}

.markdown :deep(a) {
  color: var(--kp-accent);
}

.markdown :deep(code) {
  font-size: 15px;
}

.markdown :deep(pre) {
  overflow-x: auto;
  padding: 10px;
  border-radius: 10px;
  background: var(--kp-surface);
}

.markdown :deep(table) {
  display: block;
  overflow-x: auto;
  border-collapse: collapse;
  font-size: 15px;
}

.markdown :deep(th),
.markdown :deep(td) {
  padding: 4px 8px;
  border: 1px solid var(--kp-border);
}
</style>
