<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonTitle,
  IonToolbar,
  actionSheetController
} from '@ionic/vue'
import CoachNote from '@/components/CoachNote.vue'
import { useMeals } from '@/composables/useMeals'
import { useProfile } from '@/composables/useProfile'
import { showErrorToast } from '@/lib/feedback'
import { tapFeedback, warningFeedback } from '@/lib/native'
import { formatGrams, formatKcal, mealTypeLabel, showsNutritionFigures, timeOf } from '@/lib/nutrition'
import type { Meal, MealItem } from '@/lib/types'

const props = defineProps<{
  meal: Meal | null
  presentingElement?: HTMLElement
}>()
const emit = defineEmits<{ close: [] }>()

const { deleteMeal } = useMeals()
const { profile } = useProfile()

const deleting = ref(false)
const showFigures = computed(() => showsNutritionFigures(profile.value))
// A JSON column: only well-formed items are shown
const items = computed(() => {
  const stored = props.meal?.items
  return (Array.isArray(stored) ? stored : [])
    .filter(item => !!item && typeof item === 'object' && !Array.isArray(item) && 'name' in item) as unknown as MealItem[]
})
const subtitle = computed(() => props.meal
  ? `${mealTypeLabel(props.meal.meal_type)} · ${timeOf(new Date(props.meal.eaten_at))}`
  : '')

async function confirmDelete() {
  const meal = props.meal
  if (!meal) return
  const sheet = await actionSheetController.create({
    header: 'Ce repas sera retiré de votre journal.',
    buttons: [
      { text: 'Supprimer le repas', role: 'destructive' },
      { text: 'Annuler', role: 'cancel' }
    ]
  })
  await sheet.present()
  const { role } = await sheet.onDidDismiss()
  if (role !== 'destructive') return

  deleting.value = true
  try {
    await deleteMeal(meal)
    tapFeedback()
    emit('close')
  } catch {
    warningFeedback()
    await showErrorToast('Le repas n\'a pas pu être supprimé.')
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <ion-modal
    :is-open="!!meal"
    :presenting-element="presentingElement"
    class="grouped-page"
    @did-dismiss="emit('close')"
  >
    <ion-header>
      <ion-toolbar>
        <ion-title>Repas</ion-title>
        <ion-buttons slot="end">
          <ion-button
            :strong="true"
            @click="emit('close')"
          >
            OK
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div
        v-if="meal"
        class="page-body body"
      >
        <div class="heading">
          <h1>{{ meal.name }}</h1>
          <p>{{ subtitle }}</p>
        </div>

        <CoachNote
          v-if="meal.coach_comment"
          :text="meal.coach_comment"
        />

        <section
          v-if="showFigures"
          class="card totals"
          aria-label="Total du repas"
        >
          <div class="total">
            <span class="number">{{ formatKcal(meal.kcal) }}</span>
            <span class="unit">kcal</span>
          </div>
          <div class="macros">
            <div>
              <strong>{{ formatGrams(meal.protein_g) }}</strong>
              <span>Protéines</span>
            </div>
            <div>
              <strong>{{ formatGrams(meal.carbs_g) }}</strong>
              <span>Glucides</span>
            </div>
            <div>
              <strong>{{ formatGrams(meal.fat_g) }}</strong>
              <span>Lipides</span>
            </div>
          </div>
        </section>

        <template v-if="items.length">
          <h2 class="group-title">
            Aliments
          </h2>
          <ion-list inset>
            <ion-item
              v-for="(item, index) in items"
              :key="`${index}-${item.name}`"
            >
              <ion-label>
                <h3>{{ item.name }}</h3>
                <p v-if="item.quantity">
                  {{ item.quantity }}
                </p>
              </ion-label>
              <ion-note
                v-if="showFigures"
                slot="end"
              >
                {{ formatKcal(item.kcal) }} kcal
              </ion-note>
            </ion-item>
          </ion-list>
          <p
            v-if="showFigures"
            class="group-hint"
          >
            Valeurs estimées à partir de la photo ou de la description du repas.
          </p>
        </template>

        <ion-list inset>
          <ion-item
            button
            :detail="false"
            :disabled="deleting"
            @click="confirmDelete"
          >
            <ion-label color="danger">
              Supprimer le repas
            </ion-label>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  </ion-modal>
</template>

<style scoped>
.body {
  padding-top: 16px;
}

.heading {
  padding: 0 4px;
}

h1 {
  margin: 0;
  font-size: 24px;
  line-height: 30px;
  font-weight: 600;
}

.heading p {
  margin: 4px 0 0;
  font-size: 15px;
  color: var(--kp-text-muted);
}

.totals {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.number {
  font-size: 36px;
  line-height: 42px;
  font-weight: 600;
}

.unit {
  font-size: 18px;
  font-weight: 500;
  color: var(--kp-text-muted);
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
