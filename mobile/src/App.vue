<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import { IonApp, IonRouterOutlet, useIonRouter } from '@ionic/vue'
import { session } from '@/lib/session'

const route = useRoute()
const ionRouter = useIonRouter()

// Signed out from the Profil tab, or the session couldn't be refreshed: back to the login screen
watch(session, (value) => {
  if (!value && !route.meta.public) {
    ionRouter.navigate('/connexion', 'root', 'replace')
  }
})
</script>

<template>
  <ion-app>
    <ion-router-outlet />
  </ion-app>
</template>
