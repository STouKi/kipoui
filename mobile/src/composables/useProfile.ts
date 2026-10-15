import { computed, ref, watch } from 'vue'
import { api } from '@/lib/api'
import { resizeImage } from '@/lib/files'
import { session, user } from '@/lib/session'
import type { FullProfile } from '@/lib/types'

const profile = ref<FullProfile | null>(null)

watch(session, (value) => {
  if (!value) profile.value = null
})

// Same rule as the website (hasActiveSubscription in the user store)
const SUBSCRIBED_STATUSES = ['active', 'trialing']

type Section = Exclude<keyof FullProfile, 'customer'>

export function useProfile() {
  async function loadProfile() {
    profile.value = await api<FullProfile>('/api/profile/get')
  }

  // Each Profil screen saves its own section, as soon as a value changes
  async function saveSection<S extends Section>(section: S, data: Partial<NonNullable<FullProfile[S]>>) {
    await api('/api/profile/update', { method: 'POST', body: { [section]: data } })
    if (profile.value) {
      profile.value = {
        ...profile.value,
        [section]: { ...profile.value[section], ...data }
      }
    }
  }

  // The API also saves the photo's URL in the profile
  async function uploadAvatar(file: File) {
    const form = new FormData()
    form.append('file', await resizeImage(file, 512), 'avatar.jpg')
    const { avatarUrl } = await api<{ avatarUrl: string }>('/api/profile/upload/avatar', {
      method: 'POST',
      body: form
    })
    if (profile.value?.profile) {
      profile.value = {
        ...profile.value,
        profile: { ...profile.value.profile, avatar_url: avatarUrl }
      }
    }
  }

  const subscriptionStatus = computed(() => profile.value?.customer?.subscription_status ?? null)
  const hasActiveSubscription = computed(() => SUBSCRIBED_STATUSES.includes(subscriptionStatus.value ?? ''))

  const displayName = computed(() => profile.value?.profile?.full_name
    || profile.value?.profile?.username
    || user.value?.email?.split('@')[0]
    || '')

  return {
    profile,
    loadProfile,
    saveSection,
    uploadAvatar,
    subscriptionStatus,
    hasActiveSubscription,
    displayName
  }
}
