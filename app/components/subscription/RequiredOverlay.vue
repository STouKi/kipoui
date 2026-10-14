<script setup lang="ts">
const router = useRouter()
const userStore = useUserStore()
// The iOS app is a companion app: subscriptions are only sold on the website, and Apple forbids
// any call to action to purchase outside the app (guideline 3.1.3(f))
const { isNative } = useRuntimeConfig().public

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
            v-if="!isNative"
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
          Votre période d'essai est terminée.<template v-if="!isNative">
            Veuillez ajouter une méthode de paiement pour continuer.
          </template>
        </p>

        <p
          v-else-if="userStore.subscriptionStatus === 'cancelled'"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Votre abonnement a été annulé.<template v-if="!isNative">
            Réactivez-le pour accéder à toutes les fonctionnalités.
          </template>
        </p>

        <p
          v-else-if="userStore.subscriptionStatus === 'expired'"
          class="text-sm text-red-600 dark:text-red-400"
        >
          Votre abonnement a expiré.<template v-if="!isNative">
            Renouvelez-le pour accéder à toutes les fonctionnalités.
          </template>
        </p>
      </div>
    </div>
  </div>
</template>
