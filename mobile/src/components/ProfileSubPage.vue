<script setup lang="ts">
import { IonBackButton, IonButtons, IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/vue'

// A screen opened from the Profil tab: back button, title and gray grouped background
defineProps<{ title: string }>()
</script>

<template>
  <ion-page class="grouped-page">
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button
            default-href="/tabs/profil"
            text="Profil"
          />
        </ion-buttons>
        <ion-title>{{ title }}</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <div class="page-body sub-page">
        <slot />
      </div>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.sub-page {
  padding-top: 16px;
}
</style>
