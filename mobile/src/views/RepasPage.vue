<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
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
  IonSpinner,
  IonTitle,
  IonToolbar,
  actionSheetController,
  onIonViewWillEnter
} from '@ionic/vue'
import type { RefresherCustomEvent } from '@ionic/vue'
import { add, chevronBack, chevronForward } from 'ionicons/icons'
import AddMealModal from '@/components/AddMealModal.vue'
import AiConsentModal from '@/components/AiConsentModal.vue'
import MealDetailModal from '@/components/MealDetailModal.vue'
import SubscriptionNotice from '@/components/SubscriptionNotice.vue'
import { useAiConsent } from '@/composables/useAiConsent'
import { useMeals } from '@/composables/useMeals'
import { useProfile } from '@/composables/useProfile'
import { showAlert, showErrorToast } from '@/lib/feedback'
import { AttachmentError, resizeImage } from '@/lib/files'
import { formatDay } from '@/lib/format'
import { tapFeedback, warningFeedback } from '@/lib/native'
import {
  MEAL_TYPES,
  addDays,
  dayKey,
  estimateDailyNeeds,
  formatGrams,
  formatKcal,
  showsNutritionFigures,
  startOfDay,
  timeOf
} from '@/lib/nutrition'
import type { Meal } from '@/lib/types'

// The analysis doesn't need more: smaller photos travel faster
const PHOTO_SIDE = 1280

const { mealsByDay, loadDay, deleteMeal } = useMeals()
const { profile, loadProfile, hasActiveSubscription } = useProfile()
const { hasConsent } = useAiConsent()

const page = ref<{ $el: HTMLElement } | null>(null)
const presentingElement = ref<HTMLElement>()
const cameraInput = ref<HTMLInputElement | null>(null)
const libraryInput = ref<HTMLInputElement | null>(null)

const day = ref(startOfDay(new Date()))
const failed = ref(false)
const addOpen = ref(false)
const photo = ref<File | null>(null)
const selectedMeal = ref<Meal | null>(null)
const consentOpen = ref(false)

const isToday = computed(() => dayKey(day.value) === dayKey(new Date()))
const loaded = computed(() => dayKey(day.value) in mealsByDay.value)
const meals = computed(() => mealsByDay.value[dayKey(day.value)] ?? [])
const showFigures = computed(() => showsNutritionFigures(profile.value))
// The notice waits for the profile, so it never flashes for subscribers
const subscriptionInactive = computed(() => !!profile.value && !hasActiveSubscription.value)

const totals = computed(() => meals.value.reduce((sum, meal) => ({
  kcal: sum.kcal + meal.kcal,
  protein_g: sum.protein_g + meal.protein_g,
  carbs_g: sum.carbs_g + meal.carbs_g,
  fat_g: sum.fat_g + meal.fat_g
}), { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 }))
const needs = computed(() => estimateDailyNeeds(profile.value, profile.value?.physicalData?.weight_kg ?? null))

const groups = computed(() => MEAL_TYPES
  .map(type => ({ ...type, meals: meals.value.filter(meal => meal.meal_type === type.value) }))
  .filter(group => group.meals.length > 0)
  .map(group => ({ ...group, kcal: group.meals.reduce((sum, meal) => sum + meal.kcal, 0) })))

async function refresh() {
  try {
    await Promise.all([loadDay(day.value), loadProfile()])
    failed.value = false
  } catch {
    failed.value = true
  }
}

// Each time the tab shows up: a new day may have started meanwhile
onIonViewWillEnter(() => {
  void refresh()
})

onMounted(() => {
  presentingElement.value = page.value?.$el
})

watch(day, () => {
  void refresh()
})

async function onRefresh(event: RefresherCustomEvent) {
  await refresh()
  await event.target.complete()
}

function changeDay(change: number) {
  tapFeedback()
  day.value = addDays(day.value, change)
}

function goToToday() {
  if (isToday.value) return
  tapFeedback()
  day.value = startOfDay(new Date())
}

// The photo and the description go to the AI: like the chat, it needs the user's consent
async function startAdding() {
  if (!hasConsent.value) {
    consentOpen.value = true
    return
  }
  const sheet = await actionSheetController.create({
    header: 'Ajouter un repas',
    buttons: [
      // iOS only opens a file input clicked during the tap itself, not once the sheet is closed
      { text: 'Prendre une photo', handler: () => cameraInput.value?.click() },
      { text: 'Choisir une photo', handler: () => libraryInput.value?.click() },
      { text: 'Décrire le repas', handler: () => openAddModal(null) },
      { text: 'Annuler', role: 'cancel' }
    ]
  })
  await sheet.present()
}

// Once accepted, the consent modal closes and the user goes on adding the meal
watch(hasConsent, (given) => {
  if (given && consentOpen.value) {
    consentOpen.value = false
    void startAdding()
  }
})

async function onPhotoPicked(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return
  try {
    openAddModal(await resizeImage(file, PHOTO_SIDE))
  } catch (error) {
    if (!(error instanceof AttachmentError)) throw error
    await showAlert('Photo refusée', error.message)
  }
}

function openAddModal(file: File | null) {
  photo.value = file
  addOpen.value = true
}

async function remove(meal: Meal, event: Event) {
  const sliding = (event.target as HTMLElement).closest('ion-item-sliding')
  try {
    await deleteMeal(meal)
    tapFeedback()
  } catch {
    warningFeedback()
    await sliding?.close()
    await showErrorToast('Le repas n\'a pas pu être supprimé.')
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
        <ion-title>Repas</ion-title>
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
            Repas
          </ion-title>
        </ion-toolbar>
      </ion-header>

      <div class="page-body">
        <div
          class="day-switcher"
          role="group"
          aria-label="Jour affiché"
        >
          <ion-button
            fill="clear"
            aria-label="Jour précédent"
            @click="changeDay(-1)"
          >
            <ion-icon
              slot="icon-only"
              :icon="chevronBack"
            />
          </ion-button>
          <button
            type="button"
            class="day-label"
            :aria-label="isToday ? 'Aujourd\'hui' : `${formatDay(day.toISOString())}, revenir à aujourd'hui`"
            @click="goToToday"
          >
            {{ formatDay(day.toISOString()) }}
          </button>
          <ion-button
            fill="clear"
            aria-label="Jour suivant"
            :disabled="isToday"
            @click="changeDay(1)"
          >
            <ion-icon
              slot="icon-only"
              :icon="chevronForward"
            />
          </ion-button>
        </div>

        <div
          v-if="!loaded && failed"
          class="empty-state"
        >
          <h2>Connexion impossible</h2>
          <p>Vos repas n'ont pas pu être chargés. Tirez vers le bas pour réessayer.</p>
        </div>

        <div
          v-else-if="!loaded"
          class="empty-state"
        >
          <ion-spinner name="crescent" />
        </div>

        <template v-else>
          <section
            v-if="showFigures"
            class="card summary"
            aria-label="Bilan du jour"
          >
            <div class="summary-top">
              <div class="eaten">
                <span class="caption">Consommé</span>
                <span class="value">
                  <span class="number">{{ formatKcal(totals.kcal) }}</span>
                  <span class="unit">kcal</span>
                </span>
              </div>
              <div
                v-if="needs"
                class="needs"
              >
                <span class="caption">Besoin estimé</span>
                <span class="needs-value">{{ formatKcal(needs) }} kcal</span>
              </div>
            </div>
            <div
              v-if="needs"
              class="bar"
              role="progressbar"
              aria-label="Part du besoin estimé"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="Math.min(100, Math.round((totals.kcal / needs) * 100))"
            >
              <div :style="{ width: `${Math.min(100, (totals.kcal / needs) * 100)}%` }" />
            </div>
            <div class="macros">
              <div>
                <strong>{{ formatGrams(totals.protein_g) }}</strong>
                <span>Protéines</span>
              </div>
              <div>
                <strong>{{ formatGrams(totals.carbs_g) }}</strong>
                <span>Glucides</span>
              </div>
              <div>
                <strong>{{ formatGrams(totals.fat_g) }}</strong>
                <span>Lipides</span>
              </div>
            </div>
            <p
              v-if="!needs"
              class="hint"
            >
              Renseignez votre sexe, votre date de naissance, votre taille et votre poids dans Profil
              pour connaître votre besoin estimé.
            </p>
          </section>

          <SubscriptionNotice
            v-if="subscriptionInactive"
            class="notice"
          />
          <ion-button
            v-else
            expand="block"
            color="brand"
            class="main-action"
            @click="startAdding"
          >
            <ion-icon
              slot="start"
              :icon="add"
              aria-hidden="true"
            />
            Ajouter un repas
          </ion-button>

          <p
            v-if="!meals.length"
            class="no-meal"
          >
            {{ isToday ? 'Aucun repas enregistré aujourd\'hui.' : 'Aucun repas enregistré ce jour-là.' }}
            Prenez votre assiette en photo : le coach estime ce qu'elle contient.
          </p>

          <template
            v-for="group in groups"
            :key="group.value"
          >
            <h2 class="group-title meal-group">
              <span>{{ group.label }}</span>
              <span v-if="showFigures">{{ formatKcal(group.kcal) }} kcal</span>
            </h2>
            <ion-list inset>
              <ion-item-sliding
                v-for="meal in group.meals"
                :key="meal.id"
              >
                <ion-item
                  button
                  :detail="false"
                  @click="selectedMeal = meal"
                >
                  <ion-label>
                    <h3>{{ meal.name }}</h3>
                    <p>{{ timeOf(new Date(meal.eaten_at)) }}</p>
                  </ion-label>
                  <ion-note
                    v-if="showFigures"
                    slot="end"
                  >
                    {{ formatKcal(meal.kcal) }} kcal
                  </ion-note>
                </ion-item>
                <ion-item-options side="end">
                  <ion-item-option
                    color="destructive"
                    @click="remove(meal, $event)"
                  >
                    Supprimer
                  </ion-item-option>
                </ion-item-options>
              </ion-item-sliding>
            </ion-list>
          </template>
        </template>
      </div>

      <input
        ref="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        @change="onPhotoPicked"
      >
      <input
        ref="libraryInput"
        type="file"
        accept="image/*"
        hidden
        @change="onPhotoPicked"
      >
    </ion-content>

    <AddMealModal
      :is-open="addOpen"
      :presenting-element="presentingElement"
      :photo="photo"
      :day="day"
      @close="addOpen = false"
    />
    <MealDetailModal
      :meal="selectedMeal"
      :presenting-element="presentingElement"
      @close="selectedMeal = null"
    />
    <AiConsentModal
      :is-open="consentOpen && !hasConsent"
      @decline="consentOpen = false"
    />
  </ion-page>
</template>

<style scoped>
.day-switcher {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: -4px -8px 0;
}

.day-switcher ion-button {
  margin: 0;
  height: 44px;
}

.day-label {
  min-height: 44px;
  padding: 0 12px;
  border: 0;
  background: none;
  color: var(--kp-text);
  font-family: inherit;
  font-size: 17px;
  font-weight: 600;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.summary-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.eaten,
.needs {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.needs {
  align-items: flex-end;
  text-align: right;
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
  font-size: 40px;
  line-height: 46px;
  font-weight: 600;
}

.unit {
  font-size: 20px;
  font-weight: 500;
  color: var(--kp-text-muted);
}

.needs-value {
  font-size: 17px;
  font-weight: 600;
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

.macros {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.macros div {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.macros strong {
  font-size: 17px;
  font-weight: 600;
}

.macros span {
  font-size: 13px;
  color: var(--kp-text-muted);
}

.hint {
  margin: 0;
  font-size: 13px;
  line-height: 18px;
  color: var(--kp-text-muted);
}

.no-meal {
  margin: 4px 0 0;
  padding: 0 16px;
  font-size: 15px;
  line-height: 21px;
  text-align: center;
  color: var(--kp-text-muted);
}

.meal-group {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

ion-label h3 {
  font-size: 17px;
}

ion-label p {
  font-size: 13px;
  color: var(--kp-text-muted);
}

ion-note {
  font-size: 15px;
  color: var(--kp-text-muted);
}
</style>
