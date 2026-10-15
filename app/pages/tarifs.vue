<script setup lang="ts">
import { usePricing } from '../../composables/usePricing'

const { pricingPlans } = usePricing()

const pageData = {
  title: 'Des formules pour chaque besoin',
  description: 'Choisissez l\'accompagnement qui vous convient le mieux. Que vous ayez besoin d\'un simple coup de pouce ou d\'un suivi approfondi, Kipoui s\'adapte à vous.',
  faq: {
    title: 'Questions fréquentes',
    description: 'Trouvez les réponses aux questions les plus courantes.',
    items: [
      {
        label: 'Puis-je annuler mon abonnement à tout moment ?',
        content: 'Oui, vous pouvez annuler votre abonnement à tout moment depuis votre espace personnel.'
      },
      {
        label: 'Y a-t-il une période d\'essai gratuite ?',
        content: 'Oui, nous proposons une période d\'essai de 7 jours avec l\'offre mensuelle.'
      },
      {
        label: 'Les conseils sont-ils vraiment personnalisés ?',
        content: 'Absolument ! Notre IA s\'adapte à vos préférences, objectifs et contraintes pour vous proposer des conseils sur mesure.'
      }
    ]
  }
}

const title = 'Tarifs'
const description = 'Comparez nos formules d\'accompagnement nutritionnel et motivationnel personnalisé.'

useHead({
  title
})
useSeoMeta({
  ogTitle: title,
  description,
  ogDescription: description
})

defineOgImageComponent('Saas')
</script>

<template>
  <div>
    <UPageHero
      :title="pageData.title"
      :description="pageData.description"
    />

    <UContainer>
      <UPricingPlans
        compact
        :plans="pricingPlans"
      />
    </UContainer>

    <UPageSection
      :title="pageData.faq.title"
      :description="pageData.faq.description"
    >
      <UPageAccordion
        :items="pageData.faq.items"
        multiple
        class="max-w-4xl mx-auto"
      />
    </UPageSection>
  </div>
</template>
