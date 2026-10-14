<script setup lang="ts">
const toast = useToast()
const { hasConsent, setConsent } = useAiConsent()

const loading = ref(false)

async function toggleConsent() {
  loading.value = true
  const { error } = await setConsent(!hasConsent.value)
  loading.value = false

  if (error) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  toast.add({
    title: hasConsent.value ? 'Accord enregistré' : 'Accord retiré',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <UPageCard
    title="Traitement par l'intelligence artificielle"
    :description="hasConsent
      ? 'Vos données de profil, y compris sensibles (santé, régime alimentaire), et vos messages sont traités par des services d\'IA tiers pour personnaliser vos conseils. Si vous retirez votre accord, le chat ne sera plus accessible.'
      : 'Vous n\'avez pas donné votre accord : le chat reste inaccessible tant que vos données ne peuvent pas être traitées par des services d\'IA tiers.'"
    variant="subtle"
  >
    <div class="flex flex-wrap items-center gap-4">
      <UButton
        :label="hasConsent ? 'Retirer mon accord' : 'Donner mon accord'"
        :color="hasConsent ? 'neutral' : 'primary'"
        :variant="hasConsent ? 'outline' : 'solid'"
        :loading="loading"
        class="w-fit"
        @click="toggleConsent"
      />

      <ULink
        to="/confidentialite"
        class="text-sm font-medium text-primary"
      >
        Politique de confidentialité
      </ULink>
    </div>
  </UPageCard>
</template>
