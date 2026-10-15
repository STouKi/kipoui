import { createClient } from '@supabase/supabase-js'
import { Preferences } from '@capacitor/preferences'
import { SUPABASE_KEY, SUPABASE_URL } from './config'

// Only used for authentication: the data goes through the website's API.
// The session is kept in the native preferences rather than in the WebView's storage, which iOS
// may clear when the device runs out of space
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: {
      getItem: async key => (await Preferences.get({ key })).value,
      setItem: (key, value) => Preferences.set({ key, value }),
      removeItem: key => Preferences.remove({ key })
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
})
