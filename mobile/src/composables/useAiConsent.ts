import { computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { user } from '@/lib/session'

// Explicit consent to send profile data (including health data) and messages to the AI
// providers, required by the GDPR (art. 9) and App Store guideline 5.1.2(i). Same storage as on
// the website: the chat route refuses to answer without it
export function useAiConsent() {
  const hasConsent = computed(() => !!user.value?.user_metadata?.ai_consent_at)

  async function setConsent(given: boolean) {
    const { error } = await supabase.auth.updateUser({
      data: { ai_consent_at: given ? new Date().toISOString() : null }
    })
    if (error) throw error
  }

  return { hasConsent, setConsent }
}
