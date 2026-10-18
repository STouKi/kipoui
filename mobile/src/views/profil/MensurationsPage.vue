<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonInput, IonItem, IonLabel, IonList, IonNote, IonSelect, IonSelectOption, onIonViewWillLeave } from '@ionic/vue'
import type { SelectCustomEvent } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useProfile } from '@/composables/useProfile'
import { useWeights } from '@/composables/useWeights'
import { debounce } from '@/lib/debounce'
import { showAlert, showSaveError } from '@/lib/feedback'
import { formatWeight } from '@/lib/format'
import { GENDER_LABELS, options } from '@/lib/profileOptions'
import type { FullProfile } from '@/lib/types'

type PhysicalData = NonNullable<FullProfile['physicalData']>

const { profile, loadProfile, saveSection } = useProfile()
const { records } = useWeights()

const gender = ref<PhysicalData['gender']>(null)
const birthDate = ref('')
const height = ref('')
const today = new Date().toISOString().slice(0, 10)

// Filled once: refilling the fields after each save would erase what is being typed in another one
function fill(data: FullProfile | null) {
  gender.value = data?.physicalData?.gender ?? null
  birthDate.value = data?.physicalData?.birth_date ?? ''
  height.value = data?.physicalData?.height_cm ? String(data.physicalData.height_cm) : ''
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

// The weight comes from the weigh-ins (Suivi tab), which also update the profile
const weight = computed(() => {
  const latest = [...records.value].reverse().find(record => record.weight_kg !== null)?.weight_kg
  return latest ?? profile.value?.physicalData?.weight_kg ?? null
})

async function save(data: Partial<PhysicalData>, revert: () => void) {
  try {
    await saveSection('physicalData', data)
  } catch {
    revert()
    await showSaveError()
  }
}

async function saveGender(event: SelectCustomEvent<PhysicalData['gender']>) {
  const previous = gender.value
  gender.value = event.detail.value
  await save({ gender: event.detail.value }, () => gender.value = previous)
}

// The date picker changes the value while the user scrolls through it
const birthDateSave = debounce(async () => {
  const previous = profile.value?.physicalData?.birth_date ?? ''
  if (birthDate.value === previous) return
  if (!birthDate.value || birthDate.value > today) {
    birthDate.value = previous
    return
  }
  await save({ birth_date: birthDate.value }, () => birthDate.value = previous)
}, 800)

async function saveHeight() {
  const previous = profile.value?.physicalData?.height_cm ?? null
  const value = Number.parseInt(height.value, 10)
  if (value === previous) return
  if (!Number.isInteger(value) || value < 100 || value > 250) {
    height.value = previous ? String(previous) : ''
    await showAlert('Taille invalide', 'Saisissez votre taille en centimètres, par exemple 168.')
    return
  }
  height.value = String(value)
  await save({ height_cm: value }, () => height.value = previous ? String(previous) : '')
}

onIonViewWillLeave(() => birthDateSave.flush())
onBeforeUnmount(() => birthDateSave.flush())
</script>

<template>
  <ProfileSubPage title="Mensurations">
    <ion-list inset>
      <ion-item>
        <ion-select
          label="Sexe"
          interface="action-sheet"
          :interface-options="{ header: 'Sexe' }"
          cancel-text="Annuler"
          placeholder="Choisir"
          :value="gender"
          @ion-change="saveGender"
        >
          <ion-select-option
            v-for="option in options(GENDER_LABELS)"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-input
          v-model="birthDate"
          label="Date de naissance"
          type="date"
          class="value-end"
          min="1900-01-01"
          :max="today"
          @ion-input="birthDateSave.schedule()"
        >
          <span
            v-if="!birthDate"
            slot="end"
            class="input-placeholder"
          >Choisir</span>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          v-model="height"
          label="Taille"
          inputmode="numeric"
          class="value-end"
          placeholder="168"
          enterkeyhint="done"
          @ion-change="saveHeight"
        >
          <span
            slot="end"
            class="input-unit"
          >cm</span>
        </ion-input>
      </ion-item>
    </ion-list>

    <ion-list inset>
      <ion-item
        router-link="/tabs/suivi"
        detail
      >
        <ion-label>Poids</ion-label>
        <ion-note slot="end">
          {{ weight === null ? 'Aucune pesée' : `${formatWeight(weight)} kg` }}
        </ion-note>
      </ion-item>
    </ion-list>
    <p class="group-hint">
      Votre poids se met à jour à chaque pesée ajoutée dans l'onglet Suivi.
    </p>
  </ProfileSubPage>
</template>

<style scoped>
ion-note {
  font-size: 17px;
  color: var(--kp-text-muted);
}
</style>
