import { computed } from 'vue'
import { useProfile } from '@/composables/useProfile'
import { user } from '@/lib/session'
import { supabase } from '@/lib/supabase'

// The guided start after signup: a few questions so the coach knows the essentials from the first
// message. Offered once (finished or put off), stored like the AI consent so it follows the account
export function useOnboarding() {
  const { profile } = useProfile()

  const completed = computed(() => !!user.value?.user_metadata?.onboarding_completed_at)

  // A profile already filled in, on the website for instance, doesn't need it
  const needed = computed(() => {
    if (!profile.value || completed.value) return false
    const physical = profile.value.physicalData
    return !physical?.gender || !physical.birth_date || !physical.height_cm || !physical.weight_kg
  })

  async function complete() {
    const { error } = await supabase.auth.updateUser({
      data: { onboarding_completed_at: new Date().toISOString() }
    })
    if (error) throw error
  }

  return { needed, complete }
}
