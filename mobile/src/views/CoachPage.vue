<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
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
  onIonViewWillEnter
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

const { chats, loaded, loadChats, deleteChat } = useChats()
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
</script>

<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Coach</ion-title>
        <ion-buttons slot="end">
          <ion-button
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
        >
          <ion-item
            :router-link="`/conversation/${chat.id}`"
            :detail="false"
            button
          >
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

.empty-state .main-action {
  margin-top: 8px;
  width: 100%;
}
</style>
