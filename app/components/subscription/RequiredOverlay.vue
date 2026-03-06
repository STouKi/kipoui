<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()

function goBack() {
  router.back()
}
</script>

<template>
  <div
    v-if="!userStore.hasActiveSubscription"
    class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
  >
    <div class="w-full max-w-md p-6 mx-4 bg-white rounded-lg shadow-lg dark:bg-gray-800">
      <div class="flex flex-col items-center text-center gap-4">
        <UIcon
          name="i-lucide-lock"
          class="text-4xl text-primary"
        />

        <h2 class="text-2xl font-bold">
          Accès limité
        </h2>

        <p class="text-gray-600 dark:text-gray-300">
          Cette fonctionnalité nécessite un abonnement actif pour être utilisée.
        </p>

        <div class="flex flex-col w-full gap-2">
          <UButton
            block
            color="primary"
            to="/tarifs"
          >
            Voir les offres d'abonnement
          </UButton>

          <UButton
            block
            color="neutral"
            variant="ghost"
            @click="goBack"
          >
            Retourner à la page précédente
          </UButton>
        </div>

        <p
          v-if="userStore.subscriptionStatus === 'waiting_payment'"
          class="text-sm text-amber-600 dark:text-amber-400"
        >
          Votre période d'essai est terminée. Veuillez ajouter une méthode de paiement pour continuer.
        </p>

        <p
          v-else-if="userStore.subscriptionStatus === 'cancelled'"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Votre abonnement a été annulé. Réactivez-le pour accéder à toutes les fonctionnalités.
        </p>

        <p
          v-else-if="userStore.subscriptionStatus === 'expired'"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Votre abonnement a expiré. Renouvelez-le pour accéder à toutes les fonctionnalités.
        </p>
      </div>
    </div>
  </div>
</template>
