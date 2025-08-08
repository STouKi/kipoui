export default defineNuxtPlugin(() => {
  const userStore = useUserStore()
  const user = useSupabaseUser()

  // Initialize Pinia store during SSR with current user from cookies/session
  // This ensures headers render the correct branch on first paint
  userStore.setUser(user.value ?? null)
})
