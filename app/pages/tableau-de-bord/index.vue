<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})

const route = useRoute()
const { checkout } = route.query

const { stripe } = useClientStripe()
const checkoutProcessed = ref(false)

watchEffect(() => {
  if (stripe.value && checkout && !checkoutProcessed.value) {
    verifyCheckoutSession()
  }
})

async function verifyCheckoutSession() {
  checkoutProcessed.value = true
  const toast = useToast()

  try {
    const { data, error } = await useFetch('/api/stripe/verify-checkout-session', {
      query: { checkout }
    })

    if (error.value) {
      console.error('Erreur lors de la vérification du paiement:', error.value)
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification de votre paiement',
        color: 'error'
      })
      return
    }

    if (data.value?.success) {
      if ('status' in data.value && data.value.status === 'completed') {
        toast.add({
          title: 'Félicitations !',
          description: data.value.message,
          color: 'success'
        })
      } else if ('status' in data.value && data.value.status === 'cancelled') {
        toast.add({
          title: 'Information',
          description: data.value.message,
          color: 'info'
        })
      }
    } else if (data.value && 'error' in data.value) {
      toast.add({
        title: 'Erreur',
        description: data.value.error,
        color: 'error'
      })
    }

    await navigateTo({ path: route.path }, { replace: true })
  } catch (e) {
    console.error('Erreur inattendue lors de la vérification du paiement:', e)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur inattendue est survenue lors de la vérification de votre paiement',
      color: 'error'
    })
  }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Tableau de bord"
        :ui="{ right: 'gap-3' }"
      />
    </template>

    <template #body>
      <h2 class="text-2xl font-bold">
        Bienvenue sur votre tableau de bord !
      </h2>

      <p>
        Pour le moment, seules les options de gestion des paramètres sont disponibles.
        <br><br>
        N'oubliez pas de compléter au maximum la section "Profil" avec vos informations : plus elles sont précises, plus votre chatbot pourra vous accompagner de manière attentive et personnalisée.
      </p>

      <p>
        Et ce n'est que le début ! Très bientôt, vous pourrez suivre ici votre évolution : poids, IMC, et bien d'autres indicateurs pour célébrer vos progrès pas à pas.
      </p>
    </template>
  </UDashboardPanel>
</template>
