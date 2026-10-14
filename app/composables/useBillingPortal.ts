export function useBillingPortal() {
  const toast = useToast()
  const loading = ref(false)

  // Website only: the iOS app is a companion app and links to no purchase flow
  async function openBillingPortal() {
    loading.value = true
    try {
      const session = await $fetch('/api/stripe/create-portal-session', { method: 'POST' })
      if (!session?.url) throw new Error('Session de portail vide')
      await navigateTo(session.url, { external: true })
    } catch {
      loading.value = false
      toast.add({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir la gestion de votre abonnement. Réessayez dans un instant.',
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
    }
  }

  return { loading, openBillingPortal }
}
