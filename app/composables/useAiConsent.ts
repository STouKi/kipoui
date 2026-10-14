export function useAiConsent() {
  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Explicit consent to have profile data (including health data) and messages processed by
  // third-party AI providers, required by the GDPR (art. 9) and App Store guideline 5.1.2(i).
  // The chat route checks it server-side before any AI call
  const hasConsent = computed(() => !!user.value?.user_metadata?.ai_consent_at)

  function setConsent(given: boolean) {
    return supabase.auth.updateUser({
      data: { ai_consent_at: given ? new Date().toISOString() : null }
    })
  }

  return { hasConsent, setConsent }
}
