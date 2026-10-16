<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import {
  IonButton,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  onIonViewWillLeave
} from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useProfile } from '@/composables/useProfile'
import { debounce } from '@/lib/debounce'
import { showSaveError } from '@/lib/feedback'
import { tapFeedback } from '@/lib/native'
import type { FullProfile } from '@/lib/types'

const { profile, loadProfile, saveSection } = useProfile()

const dislikes = ref<string[]>([])
const newDislike = ref('')

function fill(data: FullProfile | null) {
  dislikes.value = data?.preferences?.dislikes ?? []
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

// Several changes in a row make a single save
const dislikesSave = debounce(async () => {
  try {
    await saveSection('preferences', { dislikes: dislikes.value })
  } catch {
    fill(profile.value)
    await showSaveError()
  }
}, 600)

function addDislike() {
  const food = newDislike.value.trim()
  newDislike.value = ''
  if (!food || dislikes.value.some(item => item.toLocaleLowerCase('fr') === food.toLocaleLowerCase('fr'))) return
  dislikes.value = [...dislikes.value, food]
  tapFeedback()
  dislikesSave.schedule()
}

function removeDislike(food: string) {
  dislikes.value = dislikes.value.filter(item => item !== food)
  tapFeedback()
  dislikesSave.schedule()
}

onIonViewWillLeave(() => dislikesSave.flush())
onBeforeUnmount(() => dislikesSave.flush())
</script>

<template>
  <ProfileSubPage title="Préférences">
    <h2 class="group-title">
      Aliments que vous n'aimez pas
    </h2>
    <ion-list inset>
      <ion-item-sliding
        v-for="food in dislikes"
        :key="food"
      >
        <ion-item>
          <ion-label>{{ food }}</ion-label>
        </ion-item>
        <ion-item-options side="end">
          <ion-item-option
            color="destructive"
            expandable
            @click="removeDislike(food)"
          >
            Supprimer
          </ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
      <ion-item>
        <form
          class="add"
          @submit.prevent="addDislike"
        >
          <ion-input
            v-model="newDislike"
            placeholder="Ajouter un aliment"
            aria-label="Ajouter un aliment"
            enterkeyhint="done"
            autocapitalize="sentences"
          />
          <ion-button
            type="submit"
            fill="clear"
            :disabled="!newDislike.trim()"
          >
            Ajouter
          </ion-button>
        </form>
      </ion-item>
    </ion-list>
    <p class="group-hint">
      Le coach évitera de vous les proposer. Glissez un aliment vers la gauche pour le retirer.
    </p>
  </ProfileSubPage>
</template>

<style scoped>
.add {
  display: flex;
  align-items: center;
  width: 100%;
}

.add ion-button {
  margin: 0;
}
</style>
