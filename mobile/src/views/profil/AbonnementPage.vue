<script setup lang="ts">
import { computed, ref } from 'vue'
import { IonItem, IonLabel, IonList, IonSpinner, onIonViewWillEnter } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { usePaywall } from '@/composables/usePaywall'
import { useProfile } from '@/composables/useProfile'
import { api } from '@/lib/api'
import { showAlert } from '@/lib/feedback'
import { successFeedback, warningFeedback } from '@/lib/native'
import { MANAGE_SUBSCRIPTIONS_URL, purchasesAvailable, restorePurchases } from '@/lib/purchases'

const { profile, loadProfile, hasActiveSubscription, hasAppStoreSubscription, subscriptionStatus } = useProfile()
const { openPaywall } = usePaywall()

const restoring = ref(false)

onIonViewWillEnter(() => {
  void loadProfile().catch(() => {})
})

const date = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const status = computed(() => {
  const customer = profile.value?.customer
  if (hasAppStoreSubscription.value && customer) {
    const end = customer.app_store_expires_at ? date.format(new Date(customer.app_store_expires_at)) : null
    return {
      title: customer.app_store_status === 'trialing' ? 'Période d\'essai' : 'Abonnement actif',
      detail: !end
        ? 'Souscrit sur l\'App Store.'
        : customer.app_store_will_renew
          ? `Souscrit sur l'App Store. Prochain renouvellement le ${end}.`
          : `Souscrit sur l'App Store. Sans renouvellement : accès jusqu'au ${end}.`
    }
  }
  if (hasActiveSubscription.value) {
    // Bought on the website, or given by hand (beta testers): no Stripe subscription
    return {
      title: subscriptionStatus.value === 'trialing' ? 'Période d\'essai' : 'Abonnement actif',
      detail: customer?.stripe_subscription_id
        ? 'Souscrit sur le site Kipoui : il se gère depuis votre espace sur le site.'
        : 'Accès offert par Kipoui.'
    }
  }
  return {
    title: 'Aucun abonnement actif',
    detail: 'Abonnez-vous pour discuter avec votre coach et faire analyser vos repas.'
  }
})

async function restore() {
  restoring.value = true
  try {
    if (await restorePurchases()) {
      await api('/api/revenuecat/sync', { method: 'POST' }).catch(() => {})
      await loadProfile().catch(() => {})
      successFeedback()
      await showAlert('Abonnement restauré', 'Votre coach est de nouveau disponible.')
    } else {
      await showAlert('Aucun abonnement trouvé', 'Ce compte Apple n\'a pas d\'abonnement Kipoui en cours.')
    }
  } catch {
    warningFeedback()
    await showAlert('Restauration impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    restoring.value = false
  }
}
</script>

<template>
  <ProfileSubPage title="Abonnement">
    <section class="card status">
      <h2>{{ status.title }}</h2>
      <p>{{ status.detail }}</p>
    </section>

    <ion-list inset>
      <!-- Apple's subscription settings open in the App Store -->
      <ion-item
        v-if="hasAppStoreSubscription"
        :href="MANAGE_SUBSCRIPTIONS_URL"
        detail
      >
        <ion-label>Gérer mon abonnement</ion-label>
      </ion-item>
      <ion-item
        v-else-if="!hasActiveSubscription"
        button
        detail
        @click="openPaywall"
      >
        <ion-label>Voir les offres</ion-label>
      </ion-item>
      <ion-item
        v-if="purchasesAvailable"
        button
        :detail="false"
        :disabled="restoring"
        @click="restore"
      >
        <ion-label color="primary">
          Restaurer mes achats
        </ion-label>
        <ion-spinner
          v-if="restoring"
          slot="end"
          name="crescent"
        />
      </ion-item>
    </ion-list>
    <p
      v-if="hasAppStoreSubscription"
      class="group-hint"
    >
      Apple gère le paiement : modification et résiliation se font dans les réglages de votre compte Apple.
    </p>
  </ProfileSubPage>
</template>

<style scoped>
.status h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.status p {
  margin: 6px 0 0;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}
</style>
