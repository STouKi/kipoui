<script setup lang="ts">
const userStore = useUserStore()
const { customer, subscriptionStatus } = storeToRefs(userStore)
const { loading, openBillingPortal } = useBillingPortal()

const statusLabels: Record<string, string> = {
  active: 'Actif',
  trialing: 'Période d\'essai',
  waiting_payment: 'Paiement en attente',
  cancelled: 'Résilié',
  expired: 'Expiré'
}

const statusLabel = computed(() =>
  subscriptionStatus.value ? statusLabels[subscriptionStatus.value] ?? subscriptionStatus.value : 'Aucun abonnement'
)
</script>

<template>
  <UPageCard
    title="Abonnement"
    :description="`Statut : ${statusLabel}`"
    variant="subtle"
  >
    <template v-if="customer?.stripe_customer_id">
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
