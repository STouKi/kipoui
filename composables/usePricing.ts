export const usePricing = () => {
  const config = useRuntimeConfig()

  const pricing = config.public.pricing as {
    customAICoachingMonthlyPrice: string
    customAICoachingTrimestrialPrice: string
    customAICoachingAnnualPrice: string
  }

  const pricingPlans = [
    {
      title: 'Offre mensuelle',
      description: 'Idéal pour tester notre approche.',
      price: '29,90 €',
      billingCycle: '/mois',
      button: {
        label: 'Choisir',
        to: `/paiement?priceId=${pricing.customAICoachingMonthlyPrice}`
      },
      features: [
        'Assistant nutrition 24/7',
        'Conseils motivation',
        'Espace personnel',
        'Recettes adaptées',
        'Analyse de progression',
        'Conseils personnalisés évolutifs'
      ]
    },
    {
      title: 'Offre trimestrielle',
      description: 'Le bon équilibre pour avoir des résultats concrets.',
      price: '24,90 €',
      discount: '17,90 €',
      billingCycle: '/mois',
      highlight: true,
      scale: true,
      button: {
        label: 'Choisir',
        to: `/paiement?priceId=${pricing.customAICoachingTrimestrialPrice}`
      },
      features: [
        'Assistant nutrition 24/7',
        'Conseils motivation',
        'Espace personnel',
        'Recettes adaptées',
        'Analyse de progression',
        'Conseils personnalisés évolutifs'
      ]
    },
    {
      title: 'Offre annuelle',
      description: 'Pour une transformation durable à prix doux.',
      price: '19,90 €',
      discount: '13,90 €',
      billingCycle: '/mois',
      button: {
        label: 'Choisir',
        to: `/paiement?priceId=${pricing.customAICoachingAnnualPrice}`
      },
      features: [
        'Assistant nutrition 24/7',
        'Conseils motivation',
        'Espace personnel',
        'Recettes adaptées',
        'Analyse de progression',
        'Conseils personnalisés évolutifs'
      ]
    }
  ]

  return {
    pricingPlans
  }
}
