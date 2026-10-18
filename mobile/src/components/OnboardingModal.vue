<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonCheckbox,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonToggle,
  IonToolbar
} from '@ionic/vue'
import { add, chevronBack, remove } from 'ionicons/icons'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import { useOnboarding } from '@/composables/useOnboarding'
import { useProfile } from '@/composables/useProfile'
import { useWeights } from '@/composables/useWeights'
import { showAlert, showErrorToast } from '@/lib/feedback'
import { formatWeight, parseWeight } from '@/lib/format'
import { remainingToGoal } from '@/lib/goal'
import { successFeedback, tapFeedback, warningFeedback } from '@/lib/native'
import {
  ALLERGY_LABELS,
  DIET_LABELS,
  EATING_DISORDER_LABELS,
  GENDER_LABELS,
  MEDICAL_REGIMEN_LABELS,
  RELIGIOUS_REGIME_LABELS,
  options
} from '@/lib/profileOptions'
import type { FullProfile } from '@/lib/types'

type PhysicalData = NonNullable<FullProfile['physicalData']>
type Habits = NonNullable<FullProfile['habits']>
type MedicalData = NonNullable<FullProfile['medicalData']>
type ListField = 'allergies' | 'eating_disorders' | 'medical_regimen'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ close: [] }>()

const { profile, loadProfile, saveSection, mergeSection } = useProfile()
const { addWeight } = useWeights()
const { complete } = useOnboarding()

// The questions, between a welcome screen and a closing one
const STEPS = ['welcome', 'about', 'body', 'goal', 'habits', 'health', 'done'] as const
const QUESTIONS = STEPS.length - 2
// The selects can't hold null: "none" stands for no diet
const NONE = 'none'

const stepIndex = ref(0)
const step = computed(() => STEPS[stepIndex.value])
const isQuestion = computed(() => stepIndex.value > 0 && stepIndex.value <= QUESTIONS)
const saving = ref(false)
const content = ref<{ $el: HTMLIonContentElement } | null>(null)
const today = new Date().toISOString().slice(0, 10)

const draft = reactive({
  name: '',
  gender: null as PhysicalData['gender'],
  birthDate: '',
  height: '',
  weight: '',
  target: '',
  deadline: '',
  diet: null as Habits['diet'],
  religiousRegime: null as Habits['religious_regime'],
  sportDays: 0,
  compulsive: false,
  lists: { allergies: [], eating_disorders: [], medical_regimen: [] } as Record<ListField, string[]>
})

// What the user already filled in, on the website for instance
function fill() {
  const data = profile.value
  draft.name = data?.profile?.full_name ?? ''
  draft.gender = data?.physicalData?.gender ?? null
  draft.birthDate = data?.physicalData?.birth_date ?? ''
  draft.height = data?.physicalData?.height_cm ? String(data.physicalData.height_cm) : ''
  draft.weight = data?.physicalData?.weight_kg ? formatWeight(data.physicalData.weight_kg) : ''
  draft.target = data?.goals?.target_weight ? formatWeight(data.goals.target_weight) : ''
  draft.deadline = data?.goals?.deadline ?? ''
  draft.diet = data?.habits?.diet ?? null
  draft.religiousRegime = data?.habits?.religious_regime ?? null
  draft.sportDays = data?.habits?.sport_week_frequency ?? 0
  draft.compulsive = data?.habits?.compulsive_habits ?? false
  draft.lists = {
    allergies: data?.medicalData?.allergies ?? [],
    eating_disorders: data?.medicalData?.eating_disorders ?? [],
    medical_regimen: data?.medicalData?.medical_regimen ?? []
  }
  stepIndex.value = 0
}

const firstName = computed(() => draft.name.trim().split(/\s+/)[0] ?? '')

const goalHint = computed(() => {
  const current = parseWeight(draft.weight)
  const target = parseWeight(draft.target)
  if (current === null || target === null) return null
  const remaining = remainingToGoal(current, target)
  return remaining ? `Soit ${remaining}.` : 'C\'est votre poids actuel : l\'objectif sera de le garder.'
})

class InvalidValue extends Error {
  title: string

  constructor(title: string, message: string) {
    super(message)
    this.title = title
  }
}

// Each step saves what changed when the user moves on: leaving halfway keeps the first answers
async function saveAbout() {
  const physical: Partial<PhysicalData> = {}
  const name = draft.name.trim()
  if (name && name !== (profile.value?.profile?.full_name ?? '')) {
    if (name.length < 2 || name.length > 50) throw new InvalidValue('Nom invalide', 'Votre nom doit contenir entre 2 et 50 caractères.')
  }
  if (draft.gender !== (profile.value?.physicalData?.gender ?? null)) physical.gender = draft.gender
  if (draft.birthDate && draft.birthDate !== profile.value?.physicalData?.birth_date) {
    if (draft.birthDate > today || draft.birthDate < '1900-01-01') throw new InvalidValue('Date invalide', 'Vérifiez votre date de naissance.')
    physical.birth_date = draft.birthDate
  }
  await Promise.all([
    name && name !== (profile.value?.profile?.full_name ?? '') && saveSection('profile', { full_name: name }),
    Object.keys(physical).length && saveSection('physicalData', physical)
  ])
}

async function saveBody() {
  const height = draft.height.trim() ? Number.parseInt(draft.height, 10) : null
  if (height !== null && (!Number.isInteger(height) || height < 100 || height > 250)) {
    throw new InvalidValue('Taille invalide', 'Saisissez votre taille en centimètres, par exemple 168.')
  }
  const weight = parseWeight(draft.weight)
  if (draft.weight.trim() && (weight === null || weight < 20 || weight > 400)) {
    throw new InvalidValue('Poids invalide', 'Saisissez votre poids en kilos, par exemple 72,4.')
  }
  const kg = weight === null ? null : Math.round(weight * 10) / 10
  // One after the other: for a new profile, both would create its physical data row
  if (height !== null && height !== profile.value?.physicalData?.height_cm) {
    await saveSection('physicalData', { height_cm: height })
  }
  // A weigh-in, like in the Suivi tab: the chart starts from it, and the API updates the profile
  if (kg !== null && kg !== profile.value?.physicalData?.weight_kg) {
    await addWeight(kg)
    mergeSection('physicalData', { weight_kg: kg })
  }
}

async function saveGoal() {
  const goals: Partial<NonNullable<FullProfile['goals']>> = {}
  const target = parseWeight(draft.target)
  if (draft.target.trim()) {
    if (target === null || target < 20 || target > 400) {
      throw new InvalidValue('Poids invalide', 'Saisissez votre poids cible en kilos, par exemple 68.')
    }
    const rounded = Math.round(target * 10) / 10
    if (rounded !== profile.value?.goals?.target_weight) goals.target_weight = rounded
  }
  if (draft.deadline !== (profile.value?.goals?.deadline ?? '')) {
    if (draft.deadline && draft.deadline < today) throw new InvalidValue('Date invalide', 'Choisissez une échéance à venir.')
    goals.deadline = draft.deadline || null
  }
  if (Object.keys(goals).length) await saveSection('goals', goals)
}

async function saveHabits() {
  const habits = profile.value?.habits
  const changed = draft.diet !== (habits?.diet ?? null)
    || draft.religiousRegime !== (habits?.religious_regime ?? null)
    || draft.sportDays !== (habits?.sport_week_frequency ?? null)
    || draft.compulsive !== (habits?.compulsive_habits ?? false)
  if (!changed) return
  await saveSection('habits', {
    diet: draft.diet,
    religious_regime: draft.religiousRegime,
    sport_week_frequency: draft.sportDays,
    compulsive_habits: draft.compulsive
  })
}

async function saveHealth() {
  const medical = profile.value?.medicalData
  const same = (field: ListField) => [...draft.lists[field]].sort().join() === [...(medical?.[field] ?? [])].sort().join()
  if (same('allergies') && same('eating_disorders') && same('medical_regimen')) return
  await saveSection('medicalData', { ...draft.lists } as Partial<MedicalData>)
}

const SAVES: Partial<Record<typeof STEPS[number], () => Promise<void>>> = {
  about: saveAbout,
  body: saveBody,
  goal: saveGoal,
  habits: saveHabits,
  health: saveHealth
}

function goTo(index: number) {
  stepIndex.value = index
  void content.value?.$el.scrollToTop(0)
}

async function next() {
  const save = SAVES[step.value]
  if (save) {
    saving.value = true
    try {
      await save()
    } catch (error) {
      warningFeedback()
      if (error instanceof InvalidValue) {
        await showAlert(error.title, error.message)
      } else {
        await showErrorToast('Réponses non enregistrées. Vérifiez votre connexion internet.')
      }
      return
    } finally {
      saving.value = false
    }
  }
  tapFeedback()
  goTo(stepIndex.value + 1)
  if (step.value === 'done') {
    successFeedback()
    void finish()
  }
}

// Without saving the step's answers
function skip() {
  goTo(stepIndex.value + 1)
  if (step.value === 'done') void finish()
}

// Not offered again: the answers can still be changed in Profil
async function finish() {
  try {
    await complete()
  } catch {
    // Offered again at the next launch if the profile is still missing the essentials
  }
}

function later() {
  void finish()
  emit('close')
}

function close() {
  emit('close')
  // The coach's tabs show the answers
  void loadProfile().catch(() => {})
}

function changeSportDays(change: number) {
  draft.sportDays = Math.min(7, Math.max(0, draft.sportDays + change))
  tapFeedback()
}

function toggle(field: ListField, value: string, checked: boolean) {
  const current = draft.lists[field].filter(item => item !== value)
  draft.lists[field] = checked ? [...current, value] : current
}

const healthGroups = [
  { field: 'allergies', title: 'Allergies', options: options(ALLERGY_LABELS) },
  { field: 'medical_regimen', title: 'Régime médical', options: options(MEDICAL_REGIMEN_LABELS) },
  { field: 'eating_disorders', title: 'Troubles alimentaires', options: options(EATING_DISORDER_LABELS) }
] as const

const primaryLabel = computed(() => {
  if (step.value === 'welcome') return 'Commencer'
  if (step.value === 'health') return 'Terminer'
  if (step.value === 'done') return 'C\'est parti'
  return 'Continuer'
})

function primary() {
  if (step.value === 'done') close()
  else void next()
}
</script>

<template>
  <ion-modal
    :is-open="isOpen"
    class="grouped-page onboarding"
    @will-present="fill"
    @did-dismiss="emit('close')"
  >
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons
          v-if="isQuestion"
          slot="start"
        >
          <ion-button
            :disabled="saving"
            @click="goTo(stepIndex - 1)"
          >
            <ion-icon
              slot="start"
              :icon="chevronBack"
              aria-hidden="true"
            />
            Retour
          </ion-button>
        </ion-buttons>
        <div
          v-if="isQuestion"
          class="progress"
          role="progressbar"
          :aria-label="`Question ${stepIndex} sur ${QUESTIONS}`"
          aria-valuemin="0"
          :aria-valuemax="QUESTIONS"
          :aria-valuenow="stepIndex"
        >
          <div :style="{ width: `${(stepIndex / QUESTIONS) * 100}%` }" />
        </div>
        <ion-buttons
          v-if="isQuestion"
          slot="end"
        >
          <ion-button
            :disabled="saving"
            @click="skip"
          >
            Passer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content ref="content">
      <Transition
        name="step"
        mode="out-in"
      >
        <div
          :key="step"
          class="step"
          :class="{ centered: !isQuestion }"
        >
          <template v-if="step === 'welcome'">
            <KiwiAvatar :size="96" />
            <h1>Faisons connaissance</h1>
            <p class="lead">
              Quelques questions pour que votre coach adapte ses conseils à votre situation.
              Comptez une minute, et tout reste modifiable dans Profil.
            </p>
          </template>

          <template v-else-if="step === 'about'">
            <div class="heading">
              <h1>Parlons de vous</h1>
              <p class="lead">
                Pour que votre coach sache à qui il parle.
              </p>
            </div>
            <ion-list inset>
              <ion-item>
                <ion-input
                  v-model="draft.name"
                  label="Nom"
                  class="value-end"
                  placeholder="Camille"
                  autocomplete="given-name"
                  autocapitalize="words"
                  enterkeyhint="done"
                />
              </ion-item>
              <ion-item>
                <ion-select
                  v-model="draft.gender"
                  label="Sexe"
                  interface="action-sheet"
                  :interface-options="{ header: 'Sexe' }"
                  cancel-text="Annuler"
                  placeholder="Choisir"
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
                  v-model="draft.birthDate"
                  label="Date de naissance"
                  type="date"
                  class="value-end"
                  min="1900-01-01"
                  :max="today"
                >
                  <span
                    v-if="!draft.birthDate"
                    slot="end"
                    class="input-placeholder"
                  >Choisir</span>
                </ion-input>
              </ion-item>
            </ion-list>
          </template>

          <template v-else-if="step === 'body'">
            <div class="heading">
              <h1>Vos mensurations</h1>
              <p class="lead">
                Pour estimer vos besoins au plus juste.
              </p>
            </div>
            <ion-list inset>
              <ion-item>
                <ion-input
                  v-model="draft.height"
                  label="Taille"
                  inputmode="numeric"
                  class="value-end"
                  placeholder="168"
                  enterkeyhint="next"
                >
                  <span
                    slot="end"
                    class="input-unit"
                  >cm</span>
                </ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  v-model="draft.weight"
                  label="Poids actuel"
                  inputmode="decimal"
                  class="value-end"
                  placeholder="72,4"
                  enterkeyhint="done"
                >
                  <span
                    slot="end"
                    class="input-unit"
                  >kg</span>
                </ion-input>
              </ion-item>
            </ion-list>
            <p class="group-hint">
              Votre poids devient la première pesée de votre suivi.
            </p>
          </template>

          <template v-else-if="step === 'goal'">
            <div class="heading">
              <h1>Votre objectif</h1>
              <p class="lead">
                Laissez vide si vous ne visez pas un poids précis.
              </p>
            </div>
            <ion-list inset>
              <ion-item>
                <ion-input
                  v-model="draft.target"
                  label="Poids cible"
                  inputmode="decimal"
                  class="value-end"
                  placeholder="68"
                  enterkeyhint="done"
                >
                  <span
                    slot="end"
                    class="input-unit"
                  >kg</span>
                </ion-input>
              </ion-item>
              <ion-item>
                <ion-input
                  v-model="draft.deadline"
                  label="Échéance"
                  type="date"
                  class="value-end"
                  :min="today"
                >
                  <span
                    v-if="!draft.deadline"
                    slot="end"
                    class="input-placeholder"
                  >Choisir</span>
                </ion-input>
              </ion-item>
            </ion-list>
            <p class="group-hint">
              {{ goalHint ?? 'L\'échéance est facultative : votre coach vous aidera à avancer à un rythme sain.' }}
            </p>
          </template>

          <template v-else-if="step === 'habits'">
            <div class="heading">
              <h1>Vos habitudes</h1>
              <p class="lead">
                Pour des idées de repas qui vous ressemblent.
              </p>
            </div>
            <ion-list inset>
              <ion-item>
                <ion-select
                  label="Régime alimentaire"
                  interface="action-sheet"
                  :interface-options="{ header: 'Régime alimentaire' }"
                  cancel-text="Annuler"
                  :value="draft.diet ?? NONE"
                  @ion-change="draft.diet = $event.detail.value === NONE ? null : $event.detail.value"
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
                  :value="draft.religiousRegime ?? NONE"
                  @ion-change="draft.religiousRegime = $event.detail.value === NONE ? null : $event.detail.value"
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
                    :disabled="draft.sportDays <= 0"
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
                  >{{ draft.sportDays }}</span>
                  <ion-button
                    fill="clear"
                    aria-label="Un jour de plus"
                    :disabled="draft.sportDays >= 7"
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
                  v-model="draft.compulsive"
                  justify="space-between"
                >
                  Habitudes compulsives
                </ion-toggle>
              </ion-item>
            </ion-list>
            <p class="group-hint">
              Grignotage, fringales, envies de sucre…
            </p>
          </template>

          <template v-else-if="step === 'health'">
            <div class="heading">
              <h1>Votre santé</h1>
              <p class="lead">
                Cochez ce qui vous concerne, pour des conseils sans risque pour vous. Ces
                informations ne sont transmises au coach qu'avec votre accord pour le traitement
                par l'IA.
              </p>
            </div>
            <template
              v-for="group in healthGroups"
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
                    :checked="draft.lists[group.field].includes(option.value)"
                    justify="space-between"
                    @ion-change="toggle(group.field, option.value, $event.detail.checked)"
                  >
                    {{ option.label }}
                  </ion-checkbox>
                </ion-item>
              </ion-list>
            </template>
          </template>

          <template v-else>
            <KiwiAvatar :size="96" />
            <h1>{{ firstName ? `Tout est prêt, ${firstName} !` : 'Tout est prêt !' }}</h1>
            <p class="lead">
              Votre coach connaît maintenant l'essentiel. Vous pourrez compléter ou modifier vos
              réponses à tout moment dans Profil.
            </p>
          </template>
        </div>
      </Transition>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <div class="actions">
          <ion-button
            expand="block"
            color="brand"
            class="main-action"
            :disabled="saving"
            @click="primary"
          >
            <ion-spinner
              v-if="saving"
              name="crescent"
            />
            <span v-else>{{ primaryLabel }}</span>
          </ion-button>
          <ion-button
            v-if="step === 'welcome'"
            fill="clear"
            class="secondary"
            @click="later"
          >
            Plus tard
          </ion-button>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 16px 24px;
}

/* Welcome and closing screens */
.step.centered {
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 24px 32px;
  text-align: center;
}

.heading {
  padding: 0 4px 6px;
}

h1 {
  margin: 0;
  font-size: 28px;
  line-height: 34px;
  font-weight: 600;
}

.centered h1 {
  margin-top: 12px;
}

.lead {
  margin: 6px 0 0;
  font-size: 17px;
  line-height: 23px;
  color: var(--kp-text-muted);
}

.progress {
  height: 6px;
  margin: 0 auto;
  max-width: 160px;
  overflow: hidden;
  border-radius: 3px;
  background: var(--kp-fill-strong);
}

.progress div {
  height: 100%;
  border-radius: 3px;
  background: var(--kp-green);
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 16px;
}

.secondary {
  font-size: 16px;
}

ion-label h3 {
  font-size: 17px;
}

ion-label p {
  font-size: 13px;
  color: var(--kp-text-muted);
}

.stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  border-radius: 10px;
  background: var(--kp-fill);
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

.step-enter-active,
.step-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.step-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.step-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .step-enter-active,
  .step-leave-active {
    transition: none;
  }
}
</style>
