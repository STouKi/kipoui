export default defineNuxtPlugin(async () => {
  const userStore = useUserStore()
  const supabase = useSupabaseClient()

  await userStore.initUser()

  supabase.auth.onAuthStateChange(async (event, session) => {
    switch (event) {
      case 'SIGNED_IN':
        if (session?.user) {
          await userStore.setUser(session.user)
        }
        break

      case 'SIGNED_OUT':
        await userStore.setUser(null)
        break

      case 'TOKEN_REFRESHED':
        if (session?.user) {
          await userStore.setUser(session.user)
        }
        break
    }
  })
})
