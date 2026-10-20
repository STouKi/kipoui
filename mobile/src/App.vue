<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonRouterOutlet, useIonRouter } from '@ionic/vue'
import PaywallModal from '@/components/PaywallModal.vue'
import { identifyPurchaser } from '@/lib/purchases'
import { session, user } from '@/lib/session'

const route = useRoute()
const ionRouter = useIonRouter()

// Signed out from the Profil tab, or the session couldn't be refreshed: back to the login screen
watch(session, (value) => {
  if (!value && !route.meta.public) {
    ionRouter.navigate('/connexion', 'root', 'replace')
  }
})

// In-app purchases belong to the signed-in Kipoui account
watch(() => user.value?.id ?? null, (id) => {
  identifyPurchaser(id).catch(() => {})
}, { immediate: true })
</script>

<template>
  <ion-app>
    <ion-router-outlet />
    <PaywallModal />
  </ion-app>
</template>
