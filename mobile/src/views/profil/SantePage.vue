<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { IonCheckbox, IonItem, IonList, onIonViewWillLeave } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useProfile } from '@/composables/useProfile'
import { debounce } from '@/lib/debounce'
import { showSaveError } from '@/lib/feedback'
import { ALLERGY_LABELS, EATING_DISORDER_LABELS, MEDICAL_REGIMEN_LABELS, options } from '@/lib/profileOptions'
import type { FullProfile } from '@/lib/types'

type MedicalData = NonNullable<FullProfile['medicalData']>
type ListField = 'allergies' | 'eating_disorders' | 'medical_regimen'

const { profile, loadProfile, saveSection } = useProfile()

const selected = ref<Record<ListField, string[]>>({
  allergies: [],
  eating_disorders: [],
  medical_regimen: []
})

function fill(data: FullProfile | null) {
  selected.value = {
    allergies: data?.medicalData?.allergies ?? [],
    eating_disorders: data?.medicalData?.eating_disorders ?? [],
    medical_regimen: data?.medicalData?.medical_regimen ?? []
  }
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

const groups = [
  { field: 'allergies', title: 'Allergies', options: options(ALLERGY_LABELS) },
  { field: 'eating_disorders', title: 'Troubles alimentaires', options: options(EATING_DISORDER_LABELS) },
  { field: 'medical_regimen', title: 'Régime médical', options: options(MEDICAL_REGIMEN_LABELS) }
] as const

// Several boxes ticked in a row make a single save, with all three lists
const medicalSave = debounce(async () => {
  try {
    await saveSection('medicalData', { ...selected.value } as Partial<MedicalData>)
  } catch {
    fill(profile.value)
    await showSaveError()
  }
}, 600)

function toggle(field: ListField, value: string, checked: boolean) {
  const current = selected.value[field].filter(item => item !== value)
  selected.value = { ...selected.value, [field]: checked ? [...current, value] : current }
  medicalSave.schedule()
}

onIonViewWillLeave(() => medicalSave.flush())
onBeforeUnmount(() => medicalSave.flush())
</script>

<template>
  <ProfileSubPage title="Santé">
    <p class="intro">
      Ces informations aident le coach à adapter ses conseils. Elles ne lui sont transmises
      qu'avec votre accord pour le traitement par l'IA.
    </p>

    <template
      v-for="group in groups"
      :key="group.field"
    >
      <h2 class="group-title">
        {{ group.title }}
      </h2>
      <ion-list inset>
        <ion-item
          v-for="option in group.options"
          :key="option.value"
        >
          <ion-checkbox
            :checked="selected[group.field].includes(option.value)"
            justify="space-between"
            @ion-change="toggle(group.field, option.value, $event.detail.checked)"
          >
            {{ option.label }}
          </ion-checkbox>
        </ion-item>
      </ion-list>
    </template>
  </ProfileSubPage>
</template>

<style scoped>
.intro {
  margin: 0;
  padding: 0 16px;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}
</style>
