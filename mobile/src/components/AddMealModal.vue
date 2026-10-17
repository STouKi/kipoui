<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonLabel,
  IonList,
  IonModal,
  IonNote,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTextarea,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { cloudOfflineOutline, helpCircleOutline } from 'ionicons/icons'
import { useMeals } from '@/composables/useMeals'
import { useProfile } from '@/composables/useProfile'
import { getErrorReason } from '@/lib/api'
import { showAlert } from '@/lib/feedback'
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/native'
import {
  DEFAULT_TIMES,
  MEAL_TYPES,
  dayKey,
  defaultMealType,
  formatGrams,
  formatKcal,
  mealTypeLabel,
  showsNutritionFigures,
  sumItems,
  timeOf
} from '@/lib/nutrition'
import type { Meal, MealItem, MealType } from '@/lib/types'

const props = defineProps<{
  isOpen: boolean
  // The page shown behind the modal, scaled down like iOS cards
  presentingElement?: HTMLElement
  // Taken or chosen by the Repas tab; without it, the user describes the meal
  photo: File | null
  // The day shown in the Repas tab, which the meal is added to
  day: Date
}>()
const emit = defineEmits<{ close: [], saved: [meal: Meal] }>()

const { analyzeMeal, addMeal } = useMeals()
const { profile } = useProfile()

type Step = 'describe' | 'analyzing' | 'result' | 'not-food' | 'failed'

const step = ref<Step>('describe')
const photoFile = ref<File | null>(null)
const preview = ref<string | null>(null)
const description = ref('')
const name = ref('')
const mealType = ref<MealType>('lunch')
const time = ref('12:30')
const items = ref<MealItem[]>([])
const saving = ref(false)
const textarea = ref<{ $el: HTMLIonTextareaElement } | null>(null)

const showFigures = computed(() => showsNutritionFigures(profile.value))
const totals = computed(() => sumItems(items.value))
const isToday = computed(() => dayKey(props.day) === dayKey(new Date()))

function onWillPresent() {
  photoFile.value = props.photo
  preview.value = props.photo ? URL.createObjectURL(props.photo) : null
  description.value = ''
  name.value = ''
  items.value = []
  const now = new Date()
  mealType.value = defaultMealType(now)
  time.value = isToday.value ? timeOf(now) : DEFAULT_TIMES[mealType.value]
  if (photoFile.value) {
    void analyze()
  } else {
    step.value = 'describe'
  }
}

function onDidPresent() {
  if (step.value === 'describe') void textarea.value?.$el.setFocus()
}

function onDidDismiss() {
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
  emit('close')
}

// Another day than today: the time follows the kind of meal
watch(mealType, (type) => {
  if (!isToday.value) time.value = DEFAULT_TIMES[type]
})

async function analyze() {
  step.value = 'analyzing'
  try {
    const result = await analyzeMeal({ photo: photoFile.value ?? undefined, description: description.value.trim() })
    if (!result.isFood) {
      warningFeedback()
      step.value = 'not-food'
      return
    }
    name.value = result.name
    items.value = result.items
    tapFeedback()
    step.value = 'result'
  } catch (error) {
    warningFeedback()
    if (getErrorReason(error) === 'Active subscription required') {
      emit('close')
      await showAlert('Abonnement requis', 'L\'analyse des repas nécessite un abonnement actif.')
      return
    }
    step.value = 'failed'
  }
}

// After a photo that shows no meal: the description replaces it
function describeInstead() {
  photoFile.value = null
  if (preview.value) URL.revokeObjectURL(preview.value)
  preview.value = null
  step.value = 'describe'
  setTimeout(() => void textarea.value?.$el.setFocus(), 300)
}

function removeItem(index: number) {
  items.value = items.value.filter((_, position) => position !== index)
  tapFeedback()
}

async function save() {
  const [hours = 12, minutes = 0] = time.value.split(':').map(Number)
  const eatenAt = new Date(props.day.getFullYear(), props.day.getMonth(), props.day.getDate(), hours, minutes)
  saving.value = true
  try {
    const meal = await addMeal({
      eaten_at: eatenAt.toISOString(),
      meal_type: mealType.value,
      name: name.value.trim() || mealTypeLabel(mealType.value),
      items: items.value
    })
    successFeedback()
    emit('saved', meal)
    emit('close')
  } catch {
    warningFeedback()
    await showAlert('Enregistrement impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ion-modal
    :is-open="isOpen"
    :presenting-element="presentingElement"
    class="grouped-page"
    @will-present="onWillPresent"
    @did-present="onDidPresent"
    @did-dismiss="onDidDismiss"
  >
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="emit('close')">
            Annuler
          </ion-button>
        </ion-buttons>
        <ion-title>Nouveau repas</ion-title>
        <ion-buttons slot="end">
          <ion-button
            v-if="step === 'describe'"
            :strong="true"
            :disabled="!description.trim()"
            @click="analyze"
          >
            Analyser
          </ion-button>
          <ion-button
            v-else-if="step === 'result'"
            :strong="true"
            :disabled="saving || !items.length"
            @click="save"
          >
            Ajouter
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="page-body body">
        <img
          v-if="preview"
          :src="preview"
          alt="Photo du repas"
          class="photo"
          :class="{ dimmed: step === 'analyzing' }"
        >

        <template v-if="step === 'describe'">
          <ion-list inset>
            <ion-item>
              <ion-textarea
                ref="textarea"
                v-model="description"
                aria-label="Description du repas"
                placeholder="Par exemple : un bol de muesli avec du lait et une banane"
                :auto-grow="true"
                :rows="4"
                :maxlength="500"
              />
            </ion-item>
          </ion-list>
          <p class="group-hint">
            Précisez les quantités si vous les connaissez : l'estimation n'en sera que plus juste.
          </p>
        </template>

        <div
          v-else-if="step === 'analyzing'"
          class="state"
          role="status"
        >
          <ion-spinner name="crescent" />
          <p>Analyse de votre repas…</p>
        </div>

        <div
          v-else-if="step === 'not-food'"
          class="state"
        >
          <ion-icon
            :icon="helpCircleOutline"
            aria-hidden="true"
          />
          <h2>Aucun repas reconnu</h2>
          <p>Reprenez la photo en cadrant bien l'assiette, ou décrivez ce que vous avez mangé.</p>
          <ion-button
            fill="clear"
            @click="describeInstead"
          >
            Décrire le repas
          </ion-button>
        </div>

        <div
          v-else-if="step === 'failed'"
          class="state"
        >
          <ion-icon
            :icon="cloudOfflineOutline"
            aria-hidden="true"
          />
          <h2>L'analyse n'a pas abouti</h2>
          <p>Vérifiez votre connexion internet et réessayez.</p>
          <ion-button
            fill="clear"
            @click="analyze"
          >
            Réessayer
          </ion-button>
        </div>

        <template v-else>
          <ion-list inset>
            <ion-item>
              <ion-input
                v-model="name"
                label="Nom"
                class="value-end"
                :maxlength="120"
                enterkeyhint="done"
              />
            </ion-item>
            <ion-item>
              <ion-select
                v-model="mealType"
                label="Repas"
                interface="action-sheet"
                :interface-options="{ header: 'Repas' }"
                cancel-text="Annuler"
              >
                <ion-select-option
                  v-for="option in MEAL_TYPES"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </ion-select-option>
              </ion-select>
            </ion-item>
            <ion-item>
              <ion-input
                v-model="time"
                label="Heure"
                type="time"
                class="value-end"
              />
            </ion-item>
          </ion-list>

          <h2 class="group-title">
            Aliments
          </h2>
          <ion-list inset>
            <ion-item-sliding
              v-for="(item, index) in items"
              :key="`${index}-${item.name}`"
            >
              <ion-item>
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
              <ion-item-options side="end">
                <ion-item-option
                  color="destructive"
                  @click="removeItem(index)"
                >
                  Retirer
                </ion-item-option>
              </ion-item-options>
            </ion-item-sliding>
          </ion-list>
          <p class="group-hint">
            {{ items.length ? 'Ce sont des estimations : balayez un aliment vers la gauche pour le retirer.' : 'Tous les aliments ont été retirés.' }}
          </p>

          <section
            v-if="showFigures && items.length"
            class="card totals"
            aria-label="Total du repas"
          >
            <div class="total">
              <span>Total</span>
              <strong>{{ formatKcal(totals.kcal) }} kcal</strong>
            </div>
            <div class="macros">
              <span>Protéines {{ formatGrams(totals.protein_g) }}</span>
              <span>Glucides {{ formatGrams(totals.carbs_g) }}</span>
              <span>Lipides {{ formatGrams(totals.fat_g) }}</span>
            </div>
          </section>
        </template>
      </div>
    </ion-content>
  </ion-modal>
</template>

<style scoped>
.body {
  padding-top: 16px;
}

.photo {
  display: block;
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 16px;
  transition: opacity 0.2s ease;
}

.photo.dimmed {
  opacity: 0.6;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 16px;
  text-align: center;
  color: var(--kp-text-muted);
}

.state ion-icon {
  font-size: 40px;
  color: var(--kp-text-subtle);
}

.state h2 {
  margin: 4px 0 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--kp-text);
}

.state p {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
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

.totals {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.total {
  display: flex;
  justify-content: space-between;
  font-size: 17px;
}

.total strong {
  font-weight: 600;
}

.macros {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 13px;
  color: var(--kp-text-muted);
}
</style>
