<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSpinner,
  IonTitle,
  IonToolbar,
  actionSheetController,
  onIonViewWillEnter,
  onIonViewWillLeave,
  useIonRouter
} from '@ionic/vue'
import type { RefresherCustomEvent } from '@ionic/vue'
import { createOutline } from 'ionicons/icons'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import SubscriptionNotice from '@/components/SubscriptionNotice.vue'
import { useChats } from '@/composables/useChats'
import { useProfile } from '@/composables/useProfile'
import { formatListDate } from '@/lib/format'
import { showErrorToast } from '@/lib/feedback'
import { tapFeedback, warningFeedback } from '@/lib/native'
import type { Chat } from '@/lib/types'

const { chats, loaded, loadChats, deleteChat, deleteChats } = useChats()
const ionRouter = useIonRouter()
const { profile, loadProfile, hasActiveSubscription } = useProfile()

const search = ref('')
const failed = ref(false)

// The notice waits for the profile, so it never flashes for subscribers
const subscriptionInactive = computed(() => !!profile.value && !hasActiveSubscription.value)

const filteredChats = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('fr')
  if (!query) return chats.value
  return chats.value.filter(chat => (chat.title ?? '').toLocaleLowerCase('fr').includes(query))
})

async function refresh() {
  try {
    await Promise.all([loadChats(), loadProfile()])
    failed.value = false
  } catch {
    failed.value = true
  }
}

// Each time the tab shows up: a conversation may have been created or renamed meanwhile
onIonViewWillEnter(() => {
  void refresh()
})

async function onRefresh(event: RefresherCustomEvent) {
  await refresh()
  await event.target.complete()
}

async function confirmDelete(chat: Chat, event: Event) {
  const sliding = (event.target as HTMLElement).closest('ion-item-sliding')

  const sheet = await actionSheetController.create({
    header: 'La conversation sera supprimée définitivement.',
    buttons: [
      { text: 'Supprimer la conversation', role: 'destructive' },
      { text: 'Annuler', role: 'cancel' }
    ]
  })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()

  if (role !== 'destructive') {
    await sliding?.close()
    return
  }

  try {
    await deleteChat(chat.id)
    tapFeedback()
  } catch {
    warningFeedback()
    await sliding?.close()
    await showErrorToast('La conversation n\'a pas pu être supprimée.')
  }
}

// Selection, like iOS Mail: Modifier, then tick the conversations to delete them together
const selecting = ref(false)
const selected = ref<number[]>([])
const deleting = ref(false)

const allSelected = computed(() => filteredChats.value.length > 0
  && filteredChats.value.every(chat => selected.value.includes(chat.id)))
const selectionLabel = computed(() => {
  const count = selected.value.length
  if (count === 0) return 'Sélectionnez des conversations'
  return count === 1 ? '1 conversation sélectionnée' : `${count} conversations sélectionnées`
})

function startSelecting() {
  selected.value = []
  selecting.value = true
  tapFeedback()
}

function stopSelecting() {
  selecting.value = false
  selected.value = []
}

function toggleSelected(id: number) {
  selected.value = selected.value.includes(id)
    ? selected.value.filter(item => item !== id)
    : [...selected.value, id]
  tapFeedback()
}

// Ionic keeps an item's router link even once it is removed: the tap is handled here
function openChat(chat: Chat) {
  if (selecting.value) toggleSelected(chat.id)
  else ionRouter.push(`/conversation/${chat.id}`)
}

function toggleAll() {
  selected.value = allSelected.value ? [] : filteredChats.value.map(chat => chat.id)
  tapFeedback()
}

// Only what is on screen stays selected: a search never deletes hidden conversations
watch(filteredChats, (list) => {
  selected.value = selected.value.filter(id => list.some(chat => chat.id === id))
  if (chats.value.length === 0) stopSelecting()
})

onIonViewWillLeave(() => stopSelecting())

async function confirmDeleteSelected() {
  const ids = [...selected.value]
  if (ids.length === 0) return
  const sheet = await actionSheetController.create({
    header: ids.length === chats.value.length
      ? 'Toutes vos conversations seront supprimées définitivement, avec leurs photos et documents.'
      : ids.length === 1
        ? 'La conversation sélectionnée sera supprimée définitivement, avec ses photos et documents.'
        : `Les ${ids.length} conversations sélectionnées seront supprimées définitivement, avec leurs photos et documents.`,
    buttons: [
      { text: ids.length === 1 ? 'Supprimer la conversation' : `Supprimer ${ids.length} conversations`, role: 'destructive' },
      { text: 'Annuler', role: 'cancel' }
    ]
  })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()
  if (role !== 'destructive') return

  deleting.value = true
  try {
    await deleteChats(ids)
    tapFeedback()
    stopSelecting()
  } catch {
    warningFeedback()
    await showErrorToast(ids.length === 1
      ? 'La conversation n\'a pas pu être supprimée.'
      : 'Les conversations n\'ont pas pu être supprimées.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button
            v-if="selecting"
            @click="toggleAll"
          >
            {{ allSelected ? 'Tout désélectionner' : 'Tout sélectionner' }}
          </ion-button>
          <ion-button
            v-else-if="chats.length"
            @click="startSelecting"
          >
            Modifier
          </ion-button>
        </ion-buttons>
        <ion-title>Coach</ion-title>
        <ion-buttons slot="end">
          <ion-button
            v-if="selecting"
            :strong="true"
            @click="stopSelecting"
          >
            OK
          </ion-button>
          <ion-button
            v-else
            router-link="/conversation/nouvelle"
            aria-label="Nouvelle conversation"
            :disabled="subscriptionInactive"
          >
            <ion-icon
              slot="icon-only"
              :icon="createOutline"
            />
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        :disabled="selecting"
        @ion-refresh="onRefresh"
      >
        <ion-refresher-content />
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            Coach
          </ion-title>
        </ion-toolbar>
        <ion-toolbar>
          <ion-searchbar
            v-model="search"
            placeholder="Rechercher"
          />
        </ion-toolbar>
      </ion-header>

      <SubscriptionNotice v-if="subscriptionInactive" />

      <ion-list v-if="filteredChats.length">
        <ion-item-sliding
          v-for="chat in filteredChats"
          :key="chat.id"
          :disabled="selecting"
        >
          <ion-item
            :detail="false"
            button
            @click="openChat(chat)"
          >
            <ion-checkbox
              v-if="selecting"
              slot="start"
              class="select-box"
              :checked="selected.includes(chat.id)"
              :aria-label="chat.title || 'Nouvelle conversation'"
            />
            <KiwiAvatar
              slot="start"
              :size="40"
            />
            <ion-label class="chat-title">
              {{ chat.title || 'Nouvelle conversation' }}
            </ion-label>
            <ion-note slot="end">
              {{ formatListDate(chat.created_at) }}
            </ion-note>
          </ion-item>
          <ion-item-options
            side="end"
            @ion-swipe="confirmDelete(chat, $event)"
          >
            <ion-item-option
              color="destructive"
              expandable
              @click="confirmDelete(chat, $event)"
            >
              Supprimer
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
      </ion-list>

      <div
        v-else-if="loaded && search"
        class="empty-state"
      >
        <p>Aucune conversation ne correspond à « {{ search.trim() }} ».</p>
      </div>

      <div
        v-else-if="loaded"
        class="empty-state"
      >
        <KiwiAvatar :size="72" />
        <h2>Votre coach vous attend</h2>
        <p>Posez-lui vos questions sur vos repas, votre alimentation ou vos objectifs.</p>
        <ion-button
          v-if="!subscriptionInactive"
          router-link="/conversation/nouvelle"
          color="brand"
          class="main-action"
        >
          Démarrer une conversation
        </ion-button>
      </div>

      <div
        v-else-if="failed"
        class="empty-state"
      >
        <h2>Connexion impossible</h2>
        <p>Vos conversations n'ont pas pu être chargées. Tirez vers le bas pour réessayer.</p>
      </div>

      <div
        v-else
        class="empty-state"
      >
        <ion-spinner name="crescent" />
      </div>
    </ion-content>

    <ion-footer v-if="selecting">
      <ion-toolbar>
        <span
          slot="start"
          class="selection-label"
          aria-live="polite"
        >{{ selectionLabel }}</span>
        <ion-buttons slot="end">
          <ion-button
            color="danger"
            :disabled="selected.length === 0 || deleting"
            @click="confirmDeleteSelected"
          >
            Supprimer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-footer>
  </ion-page>
</template>

<style scoped>
.chat-title {
  font-size: 17px;
  font-weight: 500;
}

ion-note {
  font-size: 15px;
  color: var(--kp-text-subtle);
}

/* The row handles the tap: the box only shows the selection */
.select-box {
  pointer-events: none;
  margin-inline-end: 12px;
}

.selection-label {
  padding-inline-start: 16px;
  font-size: 15px;
  color: var(--kp-text-muted);
}

.empty-state .main-action {
  margin-top: 8px;
  width: 100%;
}
</style>
