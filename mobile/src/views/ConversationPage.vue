<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar,
  useIonRouter
} from '@ionic/vue'
import { add, arrowUp, close, documentTextOutline, stop } from 'ionicons/icons'
import { Chat } from '@ai-sdk/vue'
import { DefaultChatTransport } from 'ai'
import type { UIMessage } from 'ai'
import AiConsentModal from '@/components/AiConsentModal.vue'
import ChatMessage from '@/components/ChatMessage.vue'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import SubscriptionNotice from '@/components/SubscriptionNotice.vue'
import { useAiConsent } from '@/composables/useAiConsent'
import { useChats } from '@/composables/useChats'
import { useProfile } from '@/composables/useProfile'
import { useWeights } from '@/composables/useWeights'
import { api, getAuthHeaders, getErrorReason } from '@/lib/api'
import { API_URL } from '@/lib/config'
import { AttachmentError, prepareAttachment, toFileParts } from '@/lib/files'
import { showAlert } from '@/lib/feedback'
import { tapFeedback, warningFeedback } from '@/lib/native'
import { supabase } from '@/lib/supabase'
import type { Chat as ChatRow, ChatWithMessages, Message, StoredAttachment } from '@/lib/types'

// Same suggestions as the website's new chat page
const SUGGESTIONS = [
  'Tu peux m’aider à établir un plan alimentaire ?',
  'Donne-moi des idées de repas équilibrés pour la semaine.',
  'J’ai du mal à garder la motivation, tu peux me booster un peu ?',
  'Quels aliments privilégier pour prendre du muscle sans prendre trop de gras ?',
  'Je grignote souvent le soir, comment je peux éviter ça ?'
]

const MAX_ATTACHMENTS = 4

interface Attachment {
  file: File
  preview?: string
}

const route = useRoute()
const ionRouter = useIonRouter()

const { chats, loadChats } = useChats()
const { profile, loadProfile, hasActiveSubscription } = useProfile()
const { loadWeights } = useWeights()
const { hasConsent } = useAiConsent()

// Ionic keeps this page alive under the next ones, while the route changes: read it once.
// "nouvelle" is a new conversation, created with its first message
const routeId = String(route.params.id)
const chatId = ref<number | null>(routeId === 'nouvelle' ? null : Number(routeId))

const title = ref('')
const chat = shallowRef<Chat<UIMessage> | null>(null)
const loading = ref(chatId.value !== null)
const loadFailed = ref(false)
// First message of a new conversation, shown while the conversation is created
const pendingText = ref<string | null>(null)
// Errors handled by the page itself (consent, subscription) don't show the retry message
const handledError = ref(false)
const consentDeclined = ref(false)

const input = ref('')
const attachments = ref<Attachment[]>([])
const fileInput = ref<HTMLInputElement | null>(null)
const content = ref<{ $el: HTMLIonContentElement } | null>(null)

const messages = computed(() => chat.value?.messages ?? [])
const status = computed(() => chat.value?.status ?? 'ready')
const waiting = computed(() => pendingText.value !== null || status.value === 'submitted')
const busy = computed(() => waiting.value || status.value === 'streaming')
const canSend = computed(() => !busy.value && (input.value.trim() !== '' || attachments.value.length > 0))
// The notice waits for the profile, so it never flashes for subscribers
const subscriptionInactive = computed(() => !!profile.value && !hasActiveSubscription.value)
const showConsent = computed(() => !hasConsent.value && !consentDeclined.value)
const showError = computed(() => status.value === 'error' && !handledError.value)

// Messages saved empty by a former bug are skipped
function toUIMessages(rows: Message[]): UIMessage[] {
  return rows.flatMap((row): UIMessage[] => {
    const parts: UIMessage['parts'] = []
    if (row.content) {
      parts.push({ type: 'text', text: row.content })
    }
    const stored = (Array.isArray(row.experimental_attachments) ? row.experimental_attachments : []) as unknown as (StoredAttachment | null)[]
    for (const attachment of stored) {
      if (attachment?.url) {
        parts.push({
          type: 'file',
          url: attachment.url,
          filename: attachment.name,
          mediaType: attachment.type ?? attachment.contentType ?? ''
        })
      }
    }
    return row.role && parts.length > 0 ? [{ id: String(row.id), role: row.role, parts }] : []
  })
}

// Attachments sent from the app stay in the conversation as data URLs. The server only reads the
// last message's ones (older ones become a mention), and resending them all could exceed the
// API's 4.5 MB request limit
function withoutOldAttachments(list: UIMessage[]) {
  return list.map((message, index) => index === list.length - 1
    ? message
    : {
        ...message,
        parts: message.parts.map(part => part.type === 'file' && part.url.startsWith('data:') ? { ...part, url: '' } : part)
      })
}

// The first answer gives the conversation its title
async function refreshTitle(id: number) {
  try {
    await loadChats()
    title.value = chats.value.find(item => item.id === id)?.title ?? title.value
  } catch {
    // The title is cosmetic
  }
}

async function handleError(error: Error) {
  const reason = getErrorReason(error)
  if (reason === 'AI consent required') {
    // Withdrawn on another device: refreshing the session reopens the consent modal
    handledError.value = true
    await supabase.auth.refreshSession()
  } else if (reason === 'Active subscription required') {
    handledError.value = true
    await loadProfile().catch(() => {})
  } else {
    warningFeedback()
  }
}

function createChat(id: number, initialMessages: UIMessage[]) {
  return new Chat<UIMessage>({
    id: String(id),
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: `${API_URL}/api/chats/${id}`,
      headers: getAuthHeaders,
      prepareSendMessagesRequest: ({ id: requestId, messages: list, body, headers, trigger, messageId }) => ({
        headers,
        body: { ...body, id: requestId, messages: withoutOldAttachments(list), trigger, messageId }
      })
    }),
    onFinish: ({ message }) => {
      void refreshTitle(id)
      // The coach can record a weigh-in: the Suivi tab must show it
      if (message.parts.some(part => part.type === 'tool-logWeight')) {
        loadWeights().catch(() => {})
      }
    },
    onError: (error) => {
      void handleError(error)
    }
  })
}

async function scrollToBottom(duration = 300) {
  await nextTick()
  await content.value?.$el.scrollToBottom(duration)
}

async function isNearBottom() {
  const element = await content.value?.$el.getScrollElement()
  return !element || element.scrollHeight - element.scrollTop - element.clientHeight < 150
}

async function load(id: number, quiet = false) {
  if (!quiet) loading.value = true
  loadFailed.value = false
  try {
    const data = await api<ChatWithMessages>(`/api/chats/${id}`)
    title.value = data.chat.title ?? ''
    chat.value = createChat(id, toUIMessages(data.messages))
    void scrollToBottom(0)

    // The last message has no answer yet: the conversation was just created, or the answer failed
    if (chat.value.messages.at(-1)?.role === 'user' && hasConsent.value && !subscriptionInactive.value) {
      void chat.value.regenerate()
    }
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

// A new conversation is created with its first message and attachments, like on the website.
// Its answer is then requested like any other
async function start(text: string, files: File[]) {
  pendingText.value = text
  try {
    const form = new FormData()
    form.append('input', text)
    for (const file of files) {
      form.append('files', file)
    }
    const created = await api<ChatRow>('/api/chats/post', { method: 'POST', body: form })
    chatId.value = created.id
    await load(created.id, true)
    return true
  } catch {
    warningFeedback()
    await showAlert('Envoi impossible', 'Vérifiez votre connexion internet et réessayez.')
    return false
  } finally {
    pendingText.value = null
  }
}

async function send(text = input.value.trim()) {
  if (busy.value) return
  const sending = attachments.value
  if (!text && sending.length === 0) return

  input.value = ''
  attachments.value = []
  handledError.value = false
  tapFeedback()
  const files = sending.map(attachment => attachment.file)

  if (chatId.value === null) {
    if (!await start(text, files)) {
      // Nothing was sent: the user gets their message back
      input.value = text
      attachments.value = sending
      return
    }
  } else if (chat.value) {
    const fileParts = files.length > 0 ? await toFileParts(files) : undefined
    if (text) {
      await chat.value.sendMessage({ text, files: fileParts })
    } else if (fileParts) {
      await chat.value.sendMessage({ files: fileParts })
    }
  }
  revokePreviews(sending)
}

function retry() {
  handledError.value = false
  void chat.value?.regenerate()
}

function pickFiles() {
  fileInput.value?.click()
}

// iOS offers the photo library, the camera and the files
async function onFilesPicked(event: Event) {
  const target = event.target as HTMLInputElement
  const picked = Array.from(target.files ?? [])
  target.value = ''

  if (attachments.value.length + picked.length > MAX_ATTACHMENTS) {
    await showAlert('Trop de pièces jointes', `Vous pouvez joindre ${MAX_ATTACHMENTS} photos ou documents par message.`)
  }
  for (const file of picked.slice(0, MAX_ATTACHMENTS - attachments.value.length)) {
    try {
      const prepared = await prepareAttachment(file)
      const preview = prepared.type.startsWith('image/') ? URL.createObjectURL(prepared) : undefined
      attachments.value = [...attachments.value, { file: prepared, preview }]
    } catch (error) {
      if (!(error instanceof AttachmentError)) throw error
      await showAlert('Pièce jointe refusée', error.message)
    }
  }
}

function removeAttachment(index: number) {
  revokePreviews(attachments.value.slice(index, index + 1))
  attachments.value = attachments.value.filter((_, position) => position !== index)
}

function revokePreviews(list: Attachment[]) {
  for (const attachment of list) {
    if (attachment.preview) URL.revokeObjectURL(attachment.preview)
  }
}

function declineConsent() {
  consentDeclined.value = true
  if (ionRouter.canGoBack()) {
    ionRouter.back()
  } else {
    ionRouter.navigate('/tabs/coach', 'back', 'replace')
  }
}

watch(() => messages.value.length, () => {
  void scrollToBottom()
})

watch(pendingText, (value) => {
  if (value !== null) void scrollToBottom()
})

// While the answer streams, follow it, unless the user scrolled up to read
const streamedLength = computed(() => messages.value.at(-1)?.parts
  .reduce((length, part) => length + (part.type === 'text' ? part.text.length : 0), 0) ?? 0)

watch(streamedLength, async () => {
  if (await isNearBottom()) await scrollToBottom(0)
})

onBeforeUnmount(() => {
  revokePreviews(attachments.value)
  void chat.value?.stop()
})

if (chatId.value !== null) {
  void load(chatId.value)
}
if (!profile.value) {
  loadProfile().catch(() => {})
}
</script>

<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/tabs/coach"
            text="Coach"
          />
        </ion-buttons>
        <ion-title>
          <span class="title">
            <KiwiAvatar :size="26" />
            <span class="title-text">{{ title || 'Nouvelle conversation' }}</span>
          </span>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content
      ref="content"
      :fullscreen="true"
    >
      <div
        v-if="loading"
        class="empty-state"
      >
        <ion-spinner name="crescent" />
      </div>

      <div
        v-else-if="loadFailed"
        class="empty-state"
      >
        <h2>Conversation indisponible</h2>
        <p>Elle n'a pas pu être chargée. Vérifiez votre connexion internet.</p>
        <ion-button
          fill="clear"
          @click="chatId !== null && load(chatId)"
        >
          Réessayer
        </ion-button>
      </div>

      <div
        v-else
        class="thread"
      >
        <div
          v-if="!chat && pendingText === null"
          class="welcome"
        >
          <KiwiAvatar :size="72" />
          <h1>Comment puis-je vous aider aujourd'hui ?</h1>
          <div
            v-if="!subscriptionInactive"
            class="suggestions"
          >
            <button
              v-for="suggestion in SUGGESTIONS"
              :key="suggestion"
              type="button"
              class="suggestion"
              @click="send(suggestion)"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <ChatMessage
          v-for="(message, index) in messages"
          :key="message.id"
          :message="message"
          :active="status === 'streaming' && index === messages.length - 1"
        />
        <ChatMessage
          v-if="pendingText"
          :message="{ id: 'pending', role: 'user', parts: [{ type: 'text', text: pendingText }] }"
        />
        <ChatMessage
          v-if="waiting"
          :message="{ id: 'waiting', role: 'assistant', parts: [] }"
          active
        />

        <div
          v-if="showError"
          class="error"
          role="alert"
        >
          <p>Le coach n'a pas pu répondre.</p>
          <ion-button
            fill="clear"
            size="small"
            @click="retry"
          >
            Réessayer
          </ion-button>
        </div>
      </div>
    </ion-content>

    <ion-footer
      v-if="!loading && !loadFailed"
      class="composer"
    >
      <!-- The toolbar keeps the footer above the home indicator -->
      <ion-toolbar v-if="subscriptionInactive">
        <SubscriptionNotice class="footer-notice" />
      </ion-toolbar>
      <ion-toolbar v-else>
        <div
          v-if="attachments.length"
          class="attachments"
        >
          <div
            v-for="(attachment, index) in attachments"
            :key="attachment.preview ?? attachment.file.name"
            class="attachment"
          >
            <img
              v-if="attachment.preview"
              :src="attachment.preview"
              :alt="attachment.file.name"
            >
            <span
              v-else
              class="document"
            >
              <ion-icon
                :icon="documentTextOutline"
                aria-hidden="true"
              />
              {{ attachment.file.name }}
            </span>
            <button
              type="button"
              class="remove"
              :aria-label="`Retirer ${attachment.file.name}`"
              @click="removeAttachment(index)"
            >
              <ion-icon
                :icon="close"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>

        <div class="composer-row">
          <ion-button
            class="round"
            color="light"
            aria-label="Ajouter une photo ou un document"
            :disabled="busy || attachments.length >= MAX_ATTACHMENTS"
            @click="pickFiles"
          >
            <ion-icon
              slot="icon-only"
              :icon="add"
            />
          </ion-button>
          <ion-textarea
            v-model="input"
            class="message-input"
            :auto-grow="true"
            :rows="1"
            placeholder="Écrire au coach…"
            aria-label="Message au coach"
          />
          <ion-button
            v-if="status === 'streaming'"
            class="round"
            color="light"
            aria-label="Arrêter la réponse"
            @click="chat?.stop()"
          >
            <ion-icon
              slot="icon-only"
              :icon="stop"
            />
          </ion-button>
          <ion-button
            v-else
            class="round"
            color="brand"
            aria-label="Envoyer"
            :disabled="!canSend"
            @click="send()"
          >
            <ion-icon
              slot="icon-only"
              :icon="arrowUp"
            />
          </ion-button>
        </div>

        <input
          ref="fileInput"
          type="file"
          accept="image/*,application/pdf"
          multiple
          hidden
          @change="onFilesPicked"
        >
      </ion-toolbar>
    </ion-footer>

    <AiConsentModal
      :is-open="showConsent"
      @decline="declineConsent"
    />
  </ion-page>
</template>

<style scoped>
.title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: 100%;
}

.title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 16px;
  font-weight: 600;
}

.thread {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  gap: 12px;
  min-height: 100%;
  padding: 16px;
}

.welcome {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  text-align: center;
}

.welcome h1 {
  margin: 0;
  font-size: 24px;
  line-height: 30px;
  font-weight: 600;
}

.suggestions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.suggestion {
  padding: 12px 16px;
  border: 1px solid var(--kp-slate-200);
  border-radius: 16px;
  background: #ffffff;
  color: var(--kp-slate-900);
  font-family: inherit;
  font-size: 16px;
  line-height: 21px;
  text-align: left;
}

.suggestion:active {
  background: var(--kp-slate-100);
}

.error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 4px 4px 4px 14px;
  border-radius: 14px;
  background: #fef2f2;
  color: #991b1b;
}

.error p {
  margin: 0;
  font-size: 15px;
}

.composer ion-toolbar {
  --padding-start: 12px;
  --padding-end: 12px;
  --padding-top: 8px;
  --padding-bottom: 8px;
}

.footer-notice {
  margin: 0;
}

.composer-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.round {
  flex-shrink: 0;
  width: 44px;
  height: 44px;
  margin: 0;
  --border-radius: 50%;
  --padding-start: 0;
  --padding-end: 0;
}

.message-input {
  flex: 1;
  min-height: 44px;
  border: 1px solid var(--kp-slate-400);
  border-radius: 22px;
  --padding-start: 16px;
  --padding-end: 16px;
  --padding-top: 11px;
  --padding-bottom: 11px;
  font-size: 17px;
}

.attachments {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 8px;
}

.attachment {
  position: relative;
  flex-shrink: 0;
}

.attachment img {
  display: block;
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 12px;
}

.attachment .document {
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 180px;
  height: 64px;
  padding: 0 14px;
  border-radius: 12px;
  background: var(--kp-slate-100);
  font-size: 14px;
  overflow: hidden;
}

.remove {
  position: absolute;
  top: -6px;
  right: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid #ffffff;
  border-radius: 50%;
  background: var(--kp-slate-700);
  color: #ffffff;
  font-size: 14px;
}
</style>
