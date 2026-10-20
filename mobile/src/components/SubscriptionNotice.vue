<script setup lang="ts">
import { computed } from 'vue'
import { IonButton, IonIcon } from '@ionic/vue'
import { lockClosedOutline } from 'ionicons/icons'
import { usePaywall } from '@/composables/usePaywall'
import { useProfile } from '@/composables/useProfile'

// Shown where the coach needs a subscription. It leads to the in-app subscription screen only:
// Apple forbids pointing to the website's offers (guideline 3.1.1)
const { subscriptionStatus } = useProfile()
const { openPaywall } = usePaywall()

const message = computed(() => {
  switch (subscriptionStatus.value) {
    case 'waiting_payment':
      return 'Votre période d\'essai est terminée : le coach est en pause.'
    case 'cancelled':
      return 'Votre abonnement a été résilié : le coach n\'est plus disponible.'
    case 'expired':
      return 'Votre abonnement a expiré : le coach n\'est plus disponible.'
    default:
      return 'Le coach nécessite un abonnement actif.'
  }
})
</script>

<template>
  <div
    class="notice"
    role="status"
  >
    <ion-icon
      :icon="lockClosedOutline"
      aria-hidden="true"
    />
    <p>{{ message }}</p>
    <ion-button
      fill="clear"
      size="small"
      class="offers"
      @click="openPaywall"
    >
      Voir les offres
    </ion-button>
  </div>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px;
  padding: 14px 8px 14px 16px;
  border-radius: 16px;
  background: var(--kp-fill);
  color: var(--kp-text-muted);
}

.notice ion-icon {
  flex-shrink: 0;
  font-size: 22px;
}

.notice p {
  flex: 1;
  margin: 0;
  font-size: 15px;
  line-height: 21px;
}

.offers {
  flex-shrink: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
}
</style>
