<script setup lang="ts">
const router = useRouter()
const toast = useToast()
const userStore = useUserStore()
const { hasConsent, setConsent } = useAiConsent()

const loading = ref(false)

async function accept() {
  loading.value = true
  const { error } = await setConsent(true)
  loading.value = false

  if (error) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <div
    v-if="userStore.hasActiveSubscription && !hasConsent"
    class="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30"
  >
    <div class="w-full max-w-md p-6 mx-4 rounded-lg shadow-lg bg-default">
      <div class="flex flex-col items-center text-center gap-4">
        <UIcon
          name="i-lucide-shield-check"
          class="text-4xl text-primary"
        />

        <h2 class="text-2xl font-bold">
          Votre accord avant de commencer
        </h2>

        <p class="text-muted">
          Pour personnaliser ses conseils, le coach transmet vos données de profil, y compris sensibles (santé, régime alimentaire), et vos messages à des services d'intelligence artificielle tiers.
        </p>

        <ULink
          to="/confidentialite"
          class="text-sm font-medium text-primary"
        >
          En savoir plus dans notre politique de confidentialité
        </ULink>

        <div class="flex flex-col w-full gap-2">
          <UButton
            block
            color="primary"
            :loading="loading"
            @click="accept"
          >
            J'accepte
          </UButton>

          <UButton
            block
            color="neutral"
            variant="ghost"
            @click="router.back()"
          >
            Retourner à la page précédente
          </UButton>
        </div>

        <p class="text-xs text-muted">
          Vous pourrez retirer votre accord à tout moment dans Paramètres > Sécurité.
        </p>
      </div>
    </div>
  </div>
</template>
