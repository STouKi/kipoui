<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue'
import type { RefresherCustomEvent } from '@ionic/vue'
import { add, removeOutline, trendingDown, trendingUp } from 'ionicons/icons'
import AddWeightModal from '@/components/AddWeightModal.vue'
import WeightChart from '@/components/WeightChart.vue'
import { useProfile } from '@/composables/useProfile'
import { useWeights } from '@/composables/useWeights'
import { formatDay, formatWeight, formatWeightChange } from '@/lib/format'
import { showErrorToast } from '@/lib/feedback'
import { tapFeedback, warningFeedback } from '@/lib/native'
import type { WeightRecord } from '@/lib/types'

const DAY = 24 * 60 * 60 * 1000

const PERIODS = [
  { value: '7', label: '7 j', days: 7, title: 'sur 7 jours' },
  { value: '30', label: '1 mois', days: 30, title: 'sur 1 mois' },
  { value: '90', label: '3 mois', days: 90, title: 'sur 3 mois' },
  { value: '365', label: '1 an', days: 365, title: 'sur 1 an' }
]

const { records, loaded, loadWeights, deleteWeight } = useWeights()
const { profile, loadProfile } = useProfile()

const page = ref<{ $el: HTMLElement } | null>(null)
const presentingElement = ref<HTMLElement>()
const addOpen = ref(false)
const failed = ref(false)
const period = ref('30')
// The periods end today: refreshed with the data
const now = ref(new Date())

const points = computed(() => records.value.flatMap(record => record.weight_kg === null
  ? []
  : [{ date: new Date(record.recorded_at), kg: record.weight_kg }]))
const latest = computed(() => points.value.at(-1))
const target = computed(() => profile.value?.goals?.target_weight ?? null)

// Change over the last 30 days: since the last weigh-in before then, or else the first one after
const change = computed(() => {
  const last = latest.value
  if (!last) return null
  const since = now.value.getTime() - 30 * DAY
  const reference = [...points.value].reverse().find(point => point.date.getTime() <= since)
    ?? points.value.find(point => point.date.getTime() > since)
  if (!reference || reference === last) return null
  return {
    delta: Math.round((last.kg - reference.kg) * 10) / 10,
    closerToGoal: target.value !== null && Math.abs(target.value - last.kg) < Math.abs(target.value - reference.kg)
  }
})

// From the first weigh-in to the goal
const progress = computed(() => {
  const start = points.value[0]?.kg
  const current = latest.value?.kg
  if (start === undefined || current === undefined || target.value === null || start === target.value) return null
  return Math.min(1, Math.max(0, (start - current) / (start - target.value)))
})

const selectedPeriod = computed(() => PERIODS.find(item => item.value === period.value) ?? PERIODS[1])
const periodStart = computed(() => new Date(now.value.getTime() - selectedPeriod.value.days * DAY))
const visiblePoints = computed(() => points.value.filter(point => point.date >= periodStart.value))
const recent = computed(() => [...records.value].reverse().slice(0, 5))

async function refresh() {
  now.value = new Date()
  try {
    await Promise.all([loadWeights(), loadProfile()])
    failed.value = false
  } catch {
    failed.value = true
  }
}

// Each time the tab shows up: the coach may have recorded a weigh-in meanwhile
onIonViewWillEnter(() => {
  void refresh()
})

onMounted(() => {
  presentingElement.value = page.value?.$el
})

async function onRefresh(event: RefresherCustomEvent) {
  await refresh()
  await event.target.complete()
}

async function remove(record: WeightRecord, event: Event) {
  const sliding = (event.target as HTMLElement).closest('ion-item-sliding')
  try {
    await deleteWeight(record.id)
    tapFeedback()
  } catch {
    warningFeedback()
    await sliding?.close()
    await showErrorToast('La pesée n\'a pas pu être supprimée.')
  }
}
</script>

<template>
  <ion-page
    ref="page"
    class="grouped-page"
  >
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>Suivi</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-refresher
        slot="fixed"
        @ion-refresh="onRefresh"
      >
        <ion-refresher-content />
      </ion-refresher>

      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">
            Suivi
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <div
        v-if="!loaded && failed"
        class="empty-state"
      >
        <h2>Connexion impossible</h2>
        <p>Votre suivi n'a pas pu être chargé. Tirez vers le bas pour réessayer.</p>
      </div>

      <div
        v-else-if="!loaded"
        class="empty-state"
      >
        <ion-spinner name="crescent" />
      </div>

      <div
        v-else
        class="page-body"
      >
        <section
          class="card weight"
          aria-label="Poids actuel"
        >
          <template v-if="latest">
            <div class="weight-top">
              <div class="current">
                <span class="caption">Poids actuel</span>
                <span class="value">
                  <span class="number">{{ formatWeight(latest.kg) }}</span>
                  <span class="unit">kg</span>
                </span>
              </div>
              <span
                v-if="change"
                class="trend"
                :class="{ good: change.closerToGoal }"
              >
                <ion-icon
                  :icon="change.delta < 0 ? trendingDown : change.delta > 0 ? trendingUp : removeOutline"
                  aria-hidden="true"
                />
                {{ change.delta === 0 ? 'Stable' : formatWeightChange(change.delta) }} en 30 jours
              </span>
            </div>

            <div
              v-if="target !== null"
              class="goal"
            >
              <span>Objectif : {{ formatWeight(target) }} kg</span>
              <div
                v-if="progress !== null"
                class="bar"
                role="progressbar"
                aria-label="Progression vers l'objectif"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-valuenow="Math.round(progress * 100)"
              >
                <div :style="{ width: `${progress * 100}%` }" />
              </div>
            </div>
          </template>

          <p
            v-else
            class="no-data"
          >
            Ajoutez votre première pesée pour suivre votre évolution.
          </p>
        </section>

        <ion-segment
          v-model="period"
          aria-label="Période affichée"
        >
          <ion-segment-button
            v-for="item in PERIODS"
            :key="item.value"
            :value="item.value"
          >
            <ion-label>{{ item.label }}</ion-label>
          </ion-segment-button>
        </ion-segment>

        <section
          class="card chart"
          aria-label="Évolution du poids"
        >
          <h2>Évolution {{ selectedPeriod.title }}</h2>
          <WeightChart
            v-if="visiblePoints.length"
            :points="visiblePoints"
            :from="periodStart"
            :to="now"
          />
          <p
            v-else
            class="no-data"
          >
            Aucune pesée sur cette période.
          </p>
        </section>

        <ion-button
          expand="block"
          color="brand"
          class="main-action"
          @click="addOpen = true"
        >
          <ion-icon
            slot="start"
            :icon="add"
            aria-hidden="true"
          />
          Ajouter une pesée
        </ion-button>

        <template v-if="recent.length">
          <h2 class="group-title">
            Dernières pesées
          </h2>
          <ion-list inset>
            <ion-item-sliding
              v-for="record in recent"
              :key="record.id"
            >
              <ion-item>
                <ion-label>{{ formatDay(record.recorded_at) }}</ion-label>
                <ion-note
                  slot="end"
                  class="kg"
                >
                  {{ record.weight_kg === null ? '-' : `${formatWeight(record.weight_kg)} kg` }}
                </ion-note>
              </ion-item>
              <ion-item-options side="end">
                <ion-item-option
                  color="destructive"
                  @click="remove(record, $event)"
                >
                  Supprimer
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
        </template>
      </div>
    </ion-content>

    <AddWeightModal
      :is-open="addOpen"
      :presenting-element="presentingElement"
      @close="addOpen = false"
    />
  </ion-page>
</template>

<style scoped>
.weight {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.weight-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.current {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.caption {
  font-size: 15px;
  color: var(--kp-text-muted);
}

.value {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.number {
  font-size: 44px;
  line-height: 50px;
  font-weight: 600;
}

.unit {
  font-size: 22px;
  font-weight: 500;
  color: var(--kp-text-muted);
}

.trend {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
  padding: 5px 10px;
  border-radius: 999px;
  background: var(--kp-fill);
  color: var(--kp-text-muted);
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
}

.trend.good {
  background: var(--kp-tint-bg);
  color: var(--kp-tint-fg);
}

.goal {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 15px;
}

.bar {
  height: 8px;
  overflow: hidden;
  border-radius: 4px;
  background: var(--kp-fill-strong);
}

.bar div {
  height: 100%;
  border-radius: 4px;
  background: var(--kp-green);
}

.no-data {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}

.chart {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 16px 10px;
}

.chart h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 500;
}

.kg {
  font-size: 17px;
  font-weight: 500;
  color: var(--kp-text);
}
</style>
