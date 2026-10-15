<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSelect,
  IonSelectOption,
  IonToggle,
  onIonViewWillLeave
} from '@ionic/vue'
import type { SelectCustomEvent, ToggleCustomEvent } from '@ionic/vue'
import { add, remove } from 'ionicons/icons'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useProfile } from '@/composables/useProfile'
import { debounce } from '@/lib/debounce'
import { showSaveError } from '@/lib/feedback'
import { tapFeedback } from '@/lib/native'
import { DIET_LABELS, RELIGIOUS_REGIME_LABELS, options } from '@/lib/profileOptions'
import type { FullProfile } from '@/lib/types'

type Habits = NonNullable<FullProfile['habits']>

// The selects can't hold null: "none" stands for no diet
const NONE = 'none'

const { profile, loadProfile, saveSection } = useProfile()

const diet = ref<Habits['diet']>(null)
const religiousRegime = ref<Habits['religious_regime']>(null)
const sportDays = ref(0)
const compulsive = ref(false)

function fill(data: FullProfile | null) {
  diet.value = data?.habits?.diet ?? null
  religiousRegime.value = data?.habits?.religious_regime ?? null
  sportDays.value = data?.habits?.sport_week_frequency ?? 0
  compulsive.value = data?.habits?.compulsive_habits ?? false
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

async function save(data: Partial<Habits>) {
  try {
    await saveSection('habits', data)
  } catch {
    fill(profile.value)
    await showSaveError()
  }
}

function saveDiet(event: SelectCustomEvent<string>) {
  diet.value = event.detail.value === NONE ? null : event.detail.value as Habits['diet']
  void save({ diet: diet.value })
}

function saveReligiousRegime(event: SelectCustomEvent<string>) {
  religiousRegime.value = event.detail.value === NONE ? null : event.detail.value as Habits['religious_regime']
  void save({ religious_regime: religiousRegime.value })
}

function saveCompulsive(event: ToggleCustomEvent) {
  compulsive.value = event.detail.checked
  void save({ compulsive_habits: compulsive.value })
}

// Several taps on the stepper make a single save
const sportSave = debounce(() => save({ sport_week_frequency: sportDays.value }), 600)

function changeSportDays(step: number) {
  sportDays.value = Math.min(7, Math.max(0, sportDays.value + step))
  tapFeedback()
  sportSave.schedule()
}

onIonViewWillLeave(() => sportSave.flush())
onBeforeUnmount(() => sportSave.flush())
</script>

<template>
  <ProfileSubPage title="Habitudes alimentaires">
    <ion-list inset>
      <ion-item>
        <ion-select
          label="Régime alimentaire"
          interface="action-sheet"
          :interface-options="{ header: 'Régime alimentaire' }"
          cancel-text="Annuler"
          :value="diet ?? NONE"
          @ion-change="saveDiet"
        >
          <ion-select-option :value="NONE">
            Aucun
          </ion-select-option>
          <ion-select-option
            v-for="option in options(DIET_LABELS)"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </ion-item>
      <ion-item>
        <ion-select
          label="Régime religieux"
          interface="action-sheet"
          :interface-options="{ header: 'Régime religieux' }"
          cancel-text="Annuler"
          :value="religiousRegime ?? NONE"
          @ion-change="saveReligiousRegime"
        >
          <ion-select-option :value="NONE">
            Aucun
          </ion-select-option>
          <ion-select-option
            v-for="option in options(RELIGIOUS_REGIME_LABELS)"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </ion-select-option>
        </ion-select>
      </ion-item>
    </ion-list>

    <h2 class="group-title">
      Mode de vie
    </h2>
    <ion-list inset>
      <ion-item>
        <ion-label>
          <h3>Sport</h3>
          <p>Jours par semaine</p>
        </ion-label>
        <div
          slot="end"
          class="stepper"
          role="group"
          aria-label="Jours de sport par semaine"
        >
          <ion-button
            fill="clear"
            aria-label="Un jour de moins"
            :disabled="sportDays <= 0"
            @click="changeSportDays(-1)"
          >
            <ion-icon
              slot="icon-only"
              :icon="remove"
            />
          </ion-button>
          <span
            class="count"
            aria-live="polite"
          >{{ sportDays }}</span>
          <ion-button
            fill="clear"
            aria-label="Un jour de plus"
            :disabled="sportDays >= 7"
            @click="changeSportDays(1)"
          >
            <ion-icon
              slot="icon-only"
              :icon="add"
            />
          </ion-button>
        </div>
      </ion-item>
      <ion-item>
        <ion-toggle
          :checked="compulsive"
          justify="space-between"
          @ion-change="saveCompulsive"
        >
          Habitudes compulsives
        </ion-toggle>
      </ion-item>
    </ion-list>
    <p class="group-hint">
      Grignotage, fringales, envies de sucre…
    </p>
  </ProfileSubPage>
</template>

<style scoped>
ion-label h3 {
  font-size: 17px;
}

ion-label p {
  font-size: 13px;
  color: var(--kp-slate-600);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 10px;
  background: var(--kp-slate-100);
}

.stepper ion-button {
  margin: 0;
  height: 36px;
  --padding-start: 10px;
  --padding-end: 10px;
}

.count {
  min-width: 20px;
  font-size: 17px;
  font-weight: 600;
  text-align: center;
}
</style>
