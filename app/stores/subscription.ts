import { defineStore } from 'pinia'

export const useSubscriptionStore = defineStore('subscription', {
  state: () => ({
    isValid: true,
    status: null as string | null
  }),
  actions: {
    setInvalid(status: string | null | undefined) {
      this.isValid = false
      this.status = status || null
    },
    setValid(status: string | null | undefined) {
      this.isValid = true
      this.status = status || null
    }
  }
})
