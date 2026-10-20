import { computed, ref, watch } from 'vue'
import { api } from '@/lib/api'
import { resizeImage } from '@/lib/files'
import { session, user } from '@/lib/session'
import type { FullProfile } from '@/lib/types'

const profile = ref<FullProfile | null>(null)

watch(session, (value) => {
  if (!value) profile.value = null
})

// Same rule as the API and the website (server/lib/subscription.ts): a subscription bought on the
// website (Stripe) or in the app (App Store). The App Store one also needs its period ahead
const SUBSCRIBED_STATUSES = ['active', 'trialing']

function hasAppStoreAccess(customer: FullProfile['customer']) {
  return !!customer
    && SUBSCRIBED_STATUSES.includes(customer.app_store_status ?? '')
    && (!customer.app_store_expires_at || new Date(customer.app_store_expires_at) > new Date())
}

type Section = Exclude<keyof FullProfile, 'customer'>

export function useProfile() {
  async function loadProfile() {
    profile.value = await api<FullProfile>('/api/profile/get')
  }

  // Each Profil screen saves its own section, as soon as a value changes
  async function saveSection<S extends Section>(section: S, data: Partial<NonNullable<FullProfile[S]>>) {
    await api('/api/profile/update', { method: 'POST', body: { [section]: data } })
    mergeSection(section, data)
  }

  // Values the server already saved, through another route (a weigh-in updates the weight)
  function mergeSection<S extends Section>(section: S, data: Partial<NonNullable<FullProfile[S]>>) {
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

  const hasAppStoreSubscription = computed(() => hasAppStoreAccess(profile.value?.customer ?? null))
  // The App Store's status when it gives access, else the website's
  const subscriptionStatus = computed(() => hasAppStoreSubscription.value
    ? profile.value?.customer?.app_store_status ?? null
    : profile.value?.customer?.subscription_status ?? null)
  const hasActiveSubscription = computed(() => hasAppStoreSubscription.value
    || SUBSCRIBED_STATUSES.includes(profile.value?.customer?.subscription_status ?? ''))

  const displayName = computed(() => profile.value?.profile?.full_name
    || profile.value?.profile?.username
    || user.value?.email?.split('@')[0]
    || '')

  return {
    profile,
    loadProfile,
    saveSection,
    mergeSection,
    uploadAvatar,
    subscriptionStatus,
    hasActiveSubscription,
    hasAppStoreSubscription,
    displayName
  }
}
