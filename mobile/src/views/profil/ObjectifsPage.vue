<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { IonInput, IonItem, IonLabel, IonList, onIonViewWillLeave } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useProfile } from '@/composables/useProfile'
import { useWeights } from '@/composables/useWeights'
import { debounce } from '@/lib/debounce'
import { showAlert, showSaveError } from '@/lib/feedback'
import { formatWeight, parseWeight } from '@/lib/format'
import type { FullProfile } from '@/lib/types'

type Goals = NonNullable<FullProfile['goals']>

const { profile, loadProfile, saveSection } = useProfile()
const { records } = useWeights()

const target = ref('')
const deadline = ref('')
const today = new Date().toISOString().slice(0, 10)

// Filled once: refilling the fields after each save would erase what is being typed in another one
function fill(data: FullProfile | null) {
  target.value = data?.goals?.target_weight ? formatWeight(data.goals.target_weight) : ''
  deadline.value = data?.goals?.deadline ?? ''
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

const currentWeight = computed(() => {
  const latest = [...records.value].reverse().find(record => record.weight_kg !== null)?.weight_kg
  return latest ?? profile.value?.physicalData?.weight_kg ?? null
})

const remaining = computed(() => {
  const goal = profile.value?.goals?.target_weight
  if (!goal || currentWeight.value === null) return null
  const difference = Math.round((currentWeight.value - goal) * 10) / 10
  if (difference === 0) return 'Objectif atteint, bravo !'
  return difference > 0
    ? `Encore ${formatWeight(difference)} kg à perdre.`
    : `Encore ${formatWeight(-difference)} kg à prendre.`
})

async function save(data: Partial<Goals>, revert: () => void) {
  try {
    await saveSection('goals', data)
  } catch {
    revert()
    await showSaveError()
  }
}

async function saveTarget() {
  const previous = profile.value?.goals?.target_weight ?? null
  const restore = () => target.value = previous ? formatWeight(previous) : ''
  const value = parseWeight(target.value)
  if (value === previous) return
  if (value === null || value < 20 || value > 400) {
    restore()
    await showAlert('Poids invalide', 'Saisissez votre poids cible en kilos, par exemple 68.')
    return
  }
  const rounded = Math.round(value * 10) / 10
  target.value = formatWeight(rounded)
  await save({ target_weight: rounded }, restore)
}

// The date picker changes the value while the user scrolls through it
const deadlineSave = debounce(async () => {
  const previous = profile.value?.goals?.deadline ?? ''
  if (deadline.value === previous) return
  await save({ deadline: deadline.value || null }, () => deadline.value = previous)
}, 800)

function clearDeadline() {
  deadline.value = ''
  deadlineSave.schedule()
  deadlineSave.flush()
}

onIonViewWillLeave(() => deadlineSave.flush())
onBeforeUnmount(() => deadlineSave.flush())
</script>

<template>
  <ProfileSubPage title="Objectifs">
    <ion-list inset>
      <ion-item>
        <ion-input
          v-model="target"
          label="Poids cible"
          inputmode="decimal"
          class="value-end"
          placeholder="68"
          enterkeyhint="done"
          @ion-change="saveTarget"
        >
          <span
            slot="end"
            class="input-unit"
          >kg</span>
        </ion-input>
      </ion-item>
      <ion-item>
        <ion-input
          v-model="deadline"
          label="Échéance"
          type="date"
          class="value-end"
          :min="today"
          @ion-input="deadlineSave.schedule()"
        />
      </ion-item>
      <ion-item
        v-if="deadline"
        button
        :detail="false"
        @click="clearDeadline"
      >
        <ion-label color="danger">
          Retirer l'échéance
        </ion-label>
      </ion-item>
    </ion-list>
    <p
      v-if="remaining"
      class="group-hint"
    >
      {{ remaining }}
    </p>
  </ProfileSubPage>
</template>
