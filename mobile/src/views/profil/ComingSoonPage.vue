<script setup lang="ts">
import { useRoute } from 'vue-router'
import { IonIcon } from '@ionic/vue'
import { constructOutline } from 'ionicons/icons'
import ProfileSubPage from '@/components/ProfileSubPage.vue'

// Profil screens not built yet
const TITLES: Record<string, string> = {
  notifications: 'Notifications',
  confidentialite: 'Politique de confidentialité'
}

// Ionic keeps this page alive under the next ones, while the route changes: read it once
const section = String(useRoute().params.section)
const title = TITLES[section] ?? 'Profil'
</script>

<template>
  <ProfileSubPage :title="title">
    <div class="empty-state">
      <ion-icon
        :icon="constructOutline"
        class="icon"
        aria-hidden="true"
      />
      <h2>Bientôt dans l'app</h2>
      <p>Cet écran arrive dans une prochaine version.</p>
    </div>
  </ProfileSubPage>
</template>

<style scoped>
.icon {
  font-size: 48px;
  color: var(--kp-slate-400);
}
</style>
