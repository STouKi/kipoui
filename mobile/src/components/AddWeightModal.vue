<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonModal,
  IonTitle,
  IonToolbar
} from '@ionic/vue'
import { useWeights } from '@/composables/useWeights'
import { parseWeight } from '@/lib/format'
import { showAlert } from '@/lib/feedback'
import { successFeedback, warningFeedback } from '@/lib/native'

defineProps<{
  isOpen: boolean
  // The page shown behind the modal, scaled down like iOS cards
  presentingElement?: HTMLElement
}>()
const emit = defineEmits<{ close: [] }>()

const { addWeight } = useWeights()

const value = ref('')
const saving = ref(false)
const input = ref<{ $el: HTMLIonInputElement } | null>(null)

async function save() {
  const kg = parseWeight(value.value)
  if (kg === null || kg < 20 || kg > 400) {
    warningFeedback()
    await showAlert('Poids invalide', 'Saisissez votre poids en kilos, par exemple 72,4.')
    return
  }

  saving.value = true
  try {
    await addWeight(Math.round(kg * 10) / 10)
    successFeedback()
    value.value = ''
    emit('close')
  } catch {
    await showAlert('Enregistrement impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    saving.value = false
  }
}

// The decimal keypad opens with the modal
function focusInput() {
  void input.value?.$el.setFocus()
}
</script>

<template>
  <ion-modal
    :is-open="isOpen"
    :presenting-element="presentingElement"
    @did-present="focusInput"
    @did-dismiss="emit('close')"
  >
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button @click="emit('close')">
            Annuler
          </ion-button>
        </ion-buttons>
        <ion-title>Nouvelle pesée</ion-title>
        <ion-buttons slot="end">
          <ion-button
            :strong="true"
            :disabled="saving || !value.trim()"
            @click="save"
          >
            Ajouter
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <form
        class="weight-form"
        @submit.prevent="save"
      >
        <div class="field">
          <ion-input
            ref="input"
            v-model="value"
            class="weight-input"
            inputmode="decimal"
            enterkeyhint="done"
            placeholder="72,4"
            aria-label="Poids en kilos"
          />
          <span
            class="unit"
            aria-hidden="true"
          >kg</span>
        </div>
      </form>
    </ion-content>
  </ion-modal>
</template>

<style scoped>
.weight-form {
  padding: 48px 24px;
}

.field {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 8px;
}

.weight-input {
  flex: 0 1 180px;
  font-size: 56px;
  font-weight: 600;
  text-align: right;
  --padding-start: 0;
  --padding-end: 0;
}

.unit {
  font-size: 28px;
  font-weight: 500;
  color: var(--kp-text-muted);
}
</style>
