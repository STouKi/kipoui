import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import type { Database } from '../../server/types/public'

type UserProfile = Database['public']['Tables']['profiles']['Row']
type PhysicalData = Database['public']['Tables']['physical_data']['Row']
type Habits = Database['public']['Tables']['habits']['Row']
type MedicalData = Database['public']['Tables']['medical_data']['Row']
type Goals = Database['public']['Tables']['goals']['Row']
type Preferences = Database['public']['Tables']['preferences']['Row']
type Customer = Database['public']['Tables']['customers']['Row']

interface UserState {
  user: User | null
  profile: UserProfile | null
  physicalData: PhysicalData | null
  habits: Habits | null
  medicalData: MedicalData | null
  goals: Goals | null
  preferences: Preferences | null
  customer: Customer | null
  isAuthenticated: boolean
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    profile: null,
    physicalData: null,
    habits: null,
    medicalData: null,
    goals: null,
    preferences: null,
    customer: null,
    isAuthenticated: false
  }),

  getters: {
    // Base information
    userId: state => state.user?.id || null,
    userEmail: state => state.user?.email || null,
    userName: state => state.profile?.full_name || state.user?.user_metadata?.full_name || null,
    userAvatar: state => state.profile?.avatar_url || state.user?.user_metadata?.avatar_url || null,

    // Subscription status
    hasActiveSubscription: (state) => {
      if (!state.customer?.subscription_status) return false
      return ['active', 'trialing'].includes(state.customer.subscription_status)
    },
    subscriptionStatus: state => state.customer?.subscription_status || null,
    subscriptionExpiresAt: state => state.customer?.subscription_end_date || null,

    // Données physiques
    userHeight: state => state.physicalData?.height_cm || null,
    userWeight: state => state.physicalData?.weight_kg || null,
    userBMI: (state) => {
      const height = state.physicalData?.height_cm
      const weight = state.physicalData?.weight_kg
      if (height && weight) {
        const heightInM = height / 100
        return Math.round((weight / (heightInM * heightInM)) * 10) / 10
      }
      return null
    },

    // State
    isLoggedIn: state => state.isAuthenticated && !!state.user,
    isPremium: (_state) => {
      const store = useUserStore()
      return store.hasActiveSubscription
    }
  },

  actions: {
    async initUser() {
      try {
        const supabase = useSupabaseClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (user) {
          await this.setUser(user)
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'utilisateur:', error)
      }
    },

    async setUser(user: User | null) {
      this.user = user
      this.isAuthenticated = !!user

      if (user) {
        void this.fetchProfile()
      } else {
        this.profile = null
      }
    },

    clearUser() {
      this.user = null
      this.profile = null
      this.physicalData = null
      this.habits = null
      this.medicalData = null
      this.goals = null
      this.preferences = null
      this.customer = null
      this.isAuthenticated = false
    },

    async fetchProfile() {
      if (import.meta.server) return
      if (!this.user?.id) return

      try {
        const fullProfileData = await $fetch('/api/profile/get')

        if (fullProfileData) {
          this.profile = fullProfileData.profile
          this.physicalData = fullProfileData.physicalData
          this.habits = fullProfileData.habits
          this.medicalData = fullProfileData.medicalData
          this.goals = fullProfileData.goals
          this.preferences = fullProfileData.preferences
          this.customer = fullProfileData.customer
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données:', error)
      }
    },

    updateProfile(updates: Partial<UserProfile>) {
      if (!this.profile) return

      this.profile = { ...this.profile, ...updates }
    },

    updatePhysicalData(data: Partial<PhysicalData>) {
      this.physicalData = { ...this.physicalData, ...data } as PhysicalData
    },

    updateHabits(data: Partial<Habits>) {
      this.habits = { ...this.habits, ...data } as Habits
    },

    updateMedicalData(data: Partial<MedicalData>) {
      this.medicalData = { ...this.medicalData, ...data } as MedicalData
    },

    updateGoals(data: Partial<Goals>) {
      this.goals = { ...this.goals, ...data } as Goals
    },

    updatePreferences(preferences: Partial<Preferences>) {
      this.preferences = { ...this.preferences, ...preferences } as Preferences
    },

    updateSubscription(subscriptionData: { status?: string | null
      plan?: string | null
      expires_at?: string | null
    }) {
      if (!this.customer) return

      this.customer = { ...this.customer, ...subscriptionData }
    }
  }
})
