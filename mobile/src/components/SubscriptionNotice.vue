<script setup lang="ts">
import { computed } from 'vue'
import { IonIcon } from '@ionic/vue'
import { lockClosedOutline } from 'ionicons/icons'
import { useProfile } from '@/composables/useProfile'

// The app is a companion app: subscriptions are only sold on the website, and Apple forbids any
// call to action to purchase outside the app (guideline 3.1.3(f)). This notice only states the status
const { subscriptionStatus } = useProfile()

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
  </div>
</template>

<style scoped>
.notice {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 12px 16px;
  padding: 14px 16px;
  border-radius: 16px;
  background: var(--kp-fill);
  color: var(--kp-text-muted);
}

.notice ion-icon {
  flex-shrink: 0;
  font-size: 22px;
}

.notice p {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
}
</style>
