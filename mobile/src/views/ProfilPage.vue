<script setup lang="ts">
import { computed } from 'vue'
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  actionSheetController,
  onIonViewWillEnter
} from '@ionic/vue'
import type { RefresherCustomEvent } from '@ionic/vue'
import {
  barbellOutline,
  chatbubbleEllipsesOutline,
  documentTextOutline,
  flagOutline,
  heartOutline,
  lockClosedOutline,
  mailOutline,
  openOutline,
  optionsOutline,
  personOutline,
  readerOutline,
  restaurantOutline,
  sparklesOutline
} from 'ionicons/icons'
import UserAvatar from '@/components/UserAvatar.vue'
import { useAiConsent } from '@/composables/useAiConsent'
import { useProfile } from '@/composables/useProfile'
import { CONTACT_EMAIL, PRIVACY_URL, TERMS_URL } from '@/lib/config'
import { openExternal } from '@/lib/native'
import { user } from '@/lib/session'
import { supabase } from '@/lib/supabase'

const { profile, loadProfile, subscriptionStatus, displayName } = useProfile()
const { hasConsent } = useAiConsent()

// The app is a companion app: the subscription only appears as a status, without price nor link
// to the offers (App Store guideline 3.1.3(f))
const SUBSCRIPTION_LABELS: Record<string, string> = {
  active: 'Abonnement actif',
  trialing: 'Période d\'essai',
  waiting_payment: 'Paiement en attente',
  cancelled: 'Abonnement résilié',
  expired: 'Abonnement expiré'
}

const subscription = computed(() => {
  const status = subscriptionStatus.value ?? ''
  return {
    label: SUBSCRIPTION_LABELS[status] ?? 'Aucun abonnement',
    tone: ['active', 'trialing'].includes(status) ? 'active' : status === 'waiting_payment' ? 'pending' : 'inactive'
  }
})

const profileRows = [
  { section: 'informations', label: 'Informations', icon: personOutline },
  { section: 'mensurations', label: 'Mensurations', icon: barbellOutline },
  { section: 'objectifs', label: 'Objectifs', icon: flagOutline },
  { section: 'habitudes', label: 'Habitudes alimentaires', icon: restaurantOutline },
  { section: 'sante', label: 'Santé', icon: heartOutline },
  { section: 'preferences', label: 'Préférences', icon: optionsOutline }
]

async function refresh() {
  try {
    await loadProfile()
  } catch {
    // The rows stay usable; the header keeps the last known values
  }
}

onIonViewWillEnter(() => {
  void refresh()
})

async function onRefresh(event: RefresherCustomEvent) {
  await refresh()
  await event.target.complete()
}

// App.vue goes back to the login screen once the session is gone
async function signOut() {
  const sheet = await actionSheetController.create({
    header: 'Vous pourrez vous reconnecter à tout moment.',
    buttons: [
      { text: 'Se déconnecter', role: 'destructive' },
      { text: 'Annuler', role: 'cancel' }
    ]
  })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()
  if (role === 'destructive') {
    await supabase.auth.signOut()
  }
}
</script>

<template>
  <ion-page class="grouped-page">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Profil</ion-title>
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
            Profil
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page-body">
        <section
          class="card identity"
          aria-label="Votre compte"
        >
          <UserAvatar :size="64" />
          <div class="who">
            <h2>{{ displayName }}</h2>
            <p>{{ user?.email }}</p>
            <span
              v-if="profile"
              class="subscription"
              :class="subscription.tone"
            >{{ subscription.label }}</span>
          </div>
        </section>

        <h2 class="group-title">
          Mon profil
        </h2>
        <ion-list inset>
          <ion-item
            v-for="row in profileRows"
            :key="row.section"
            :router-link="`/tabs/profil/${row.section}`"
            detail
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="row.icon"
                aria-hidden="true"
              />
            </span>
            <ion-label>{{ row.label }}</ion-label>
          </ion-item>
        </ion-list>

        <h2 class="group-title">
          Confidentialité
        </h2>
        <ion-list inset>
          <ion-item
            router-link="/tabs/profil/ia"
            detail
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="sparklesOutline"
                aria-hidden="true"
              />
            </span>
            <ion-label>Traitement par l'IA</ion-label>
            <ion-note slot="end">
              {{ hasConsent ? 'Activé' : 'Désactivé' }}
            </ion-note>
          </ion-item>
          <ion-item
            button
            :detail="false"
            @click="openExternal(PRIVACY_URL)"
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="documentTextOutline"
                aria-hidden="true"
              />
            </span>
            <ion-label>Politique de confidentialité</ion-label>
            <ion-icon
              slot="end"
              :icon="openOutline"
              class="end-icon"
              aria-hidden="true"
            />
          </ion-item>
          <ion-item
            router-link="/tabs/profil/securite"
            detail
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="lockClosedOutline"
                aria-hidden="true"
              />
            </span>
            <ion-label>Sécurité du compte</ion-label>
          </ion-item>
        </ion-list>

        <h2 class="group-title">
          Aide
        </h2>
        <ion-list inset>
          <ion-item
            :href="`mailto:${CONTACT_EMAIL}`"
            :detail="false"
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="chatbubbleEllipsesOutline"
                aria-hidden="true"
              />
            </span>
            <ion-label>Nous contacter</ion-label>
            <ion-icon
              slot="end"
              :icon="mailOutline"
              class="end-icon"
              aria-hidden="true"
            />
          </ion-item>
          <ion-item
            button
            :detail="false"
            @click="openExternal(TERMS_URL)"
          >
            <span
              slot="start"
              class="row-icon"
            >
              <ion-icon
                :icon="readerOutline"
                aria-hidden="true"
              />
            </span>
            <ion-label>Conditions d'utilisation</ion-label>
            <ion-icon
              slot="end"
              :icon="openOutline"
              class="end-icon"
              aria-hidden="true"
            />
          </ion-item>
        </ion-list>

        <ion-list
          inset
          class="sign-out"
        >
          <ion-item
            button
            :detail="false"
            @click="signOut"
          >
            <ion-label color="danger">
              Se déconnecter
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.identity {
  display: flex;
  align-items: center;
  gap: 14px;
}

.who {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
}

.who h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.who p {
  max-width: 100%;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 15px;
  color: var(--kp-slate-600);
}

.subscription {
  margin-top: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
}

.subscription.active {
  background: var(--kp-green-100);
  color: var(--kp-green-800);
}

.subscription.pending {
  background: #fef3c7;
  color: #92400e;
}

.subscription.inactive {
  background: var(--kp-slate-100);
  color: var(--kp-slate-700);
}

.end-icon {
  font-size: 18px;
  color: var(--kp-slate-400);
}

.sign-out {
  margin-top: 10px !important;
}

.sign-out ion-label {
  font-weight: 500;
}
</style>
