import { ref } from 'vue'

// The subscription screen, shown above everything (App.vue) from any screen that needs it
const open = ref(false)

export function usePaywall() {
  return {
    paywallOpen: open,
    openPaywall: () => {
      open.value = true
    },
    closePaywall: () => {
      open.value = false
    }
  }
}
