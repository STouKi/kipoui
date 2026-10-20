<script setup lang="ts">
const userStore = useUserStore()
const { customer, subscriptionStatus, hasAppStoreSubscription } = storeToRefs(userStore)
const { loading, openBillingPortal } = useBillingPortal()

const statusLabels: Record<string, string> = {
  active: 'Actif',
  trialing: 'Période d\'essai',
  waiting_payment: 'Paiement en attente',
  cancelled: 'Résilié',
  expired: 'Expiré'
}

const statusLabel = computed(() => {
  if (hasAppStoreSubscription.value) {
    return customer.value?.app_store_status === 'trialing' ? 'Période d\'essai (App Store)' : 'Actif (App Store)'
  }
  return subscriptionStatus.value ? statusLabels[subscriptionStatus.value] ?? subscriptionStatus.value : 'Aucun abonnement'
})

// An App Store subscription renews or ends on this date
const appStoreDate = computed(() => customer.value?.app_store_expires_at
  ? new Date(customer.value.app_store_expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  : null)
</script>

<template>
  <UPageCard
    title="Abonnement"
    :description="`Statut : ${statusLabel}`"
    variant="subtle"
  >
    <!-- Bought in the iOS app: Apple bills and manages it, Stripe can't -->
    <template v-if="hasAppStoreSubscription">
      <p
        v-if="appStoreDate"
        class="text-sm"
      >
        {{ customer?.app_store_will_renew ? `Renouvellement le ${appStoreDate}.` : `Accès jusqu'au ${appStoreDate}, sans renouvellement.` }}
      </p>
      <p class="text-sm text-muted">
        Vous vous êtes abonné dans l'application iPhone : Apple gère le paiement. Pour modifier ou résilier votre abonnement, ouvrez sur votre iPhone Réglages, puis votre nom, puis Abonnements.
      </p>
    </template>

    <template v-else-if="customer?.stripe_customer_id">
      <p
        v-if="subscriptionStatus === 'waiting_payment'"
        class="text-sm text-amber-600 dark:text-amber-400"
      >
        Ajoutez un moyen de paiement pour retrouver l'accès au coach.
      </p>
      <p class="text-sm text-muted">
        Moyen de paiement, factures ou résiliation : tout se gère sur la page sécurisée de Stripe, notre prestataire de paiement.
      </p>
      <UButton
        label="Gérer mon abonnement"
        icon="i-lucide-external-link"
        trailing
        class="w-fit"
        :loading="loading"
        @click="openBillingPortal"
      />
    </template>

    <UButton
      v-else
      label="Voir les offres"
      to="/tarifs"
      class="w-fit"
    />
  </UPageCard>
</template>
