import { computed, ref } from 'vue'
import type { Session } from '@supabase/supabase-js'
import { App } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import { supabase } from './supabase'

export const session = ref<Session | null>(null)

export const user = computed(() => session.value?.user ?? null)

// Called before the app mounts, so the router guard knows whether the user is signed in
export async function initSession() {
  const { data } = await supabase.auth.getSession()
  session.value = data.session

  supabase.auth.onAuthStateChange((_event, newSession) => {
    session.value = newSession
  })

  // The token refresh timer doesn't run while the app is in the background
  if (Capacitor.isNativePlatform()) {
    App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    })
  }
}
