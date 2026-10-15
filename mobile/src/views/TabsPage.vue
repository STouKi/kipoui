<script setup lang="ts">
import { ref } from 'vue'
import { IonIcon, IonLabel, IonPage, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/vue'
import { analytics, analyticsOutline, chatbubbles, chatbubblesOutline, personCircle, personCircleOutline } from 'ionicons/icons'

// Like iOS, the active tab shows a filled icon
const activeTab = ref('coach')

function onTabChange({ tab }: { tab: string }) {
  activeTab.value = tab
}

const tabs = [
  { tab: 'coach', label: 'Coach', icon: chatbubblesOutline, activeIcon: chatbubbles },
  { tab: 'suivi', label: 'Suivi', icon: analyticsOutline, activeIcon: analytics },
  { tab: 'profil', label: 'Profil', icon: personCircleOutline, activeIcon: personCircle }
]
</script>

<template>
  <ion-page>
    <ion-tabs @ion-tabs-did-change="onTabChange">
      <ion-router-outlet />
      <ion-tab-bar slot="bottom">
        <ion-tab-button
          v-for="item in tabs"
          :key="item.tab"
          :tab="item.tab"
          :href="`/tabs/${item.tab}`"
        >
          <ion-icon
            :icon="activeTab === item.tab ? item.activeIcon : item.icon"
            aria-hidden="true"
          />
          <ion-label>{{ item.label }}</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>
