<script setup lang="ts">
const { stripe } = useClientStripe()

watchEffect(() => {
  if (stripe.value) {
    redirectToCheckout()
  }
})

async function redirectToCheckout() {
  const route = useRoute()
  const { priceId, trial } = route.query

  try {
    const { data, error: fetchError } = await useFetch('/api/stripe/create-checkout-session', {
      params: {
        priceId,
        trial: trial ? true : false
      }
    })

    if (fetchError.value) {
      throw new Error(fetchError.value.message || 'Erreur lors de la communication avec le serveur')
    }

    const { sessionId, error: sessionError } = data.value || {}

    if (sessionError) {
      throw new Error(sessionError as string)
    }

    if (!sessionId) {
      throw new Error('Aucun ID de session retourné par le serveur')
    }

    const { error: redirectError } = await stripe.value.redirectToCheckout({
      sessionId
    })

    if (redirectError) {
      throw new Error(redirectError.message)
    }
  } catch (e) {
    console.error(e)
  }
}
</script>

<template>
  <div class="container mx-auto p-4">
    <UCard>
      <div class="flex items-center justify-center p-4">
        <UIcon
          name="i-heroicons-arrow-path"
          class="animate-spin mr-2"
        />
        <p>
          Redirection vers la page de paiement...
        </p>
      </div>
    </UCard>
  </div>
</template>
