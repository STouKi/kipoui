<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonContent, IonIcon, IonModal, IonSpinner } from '@ionic/vue'
import { shieldCheckmarkOutline } from 'ionicons/icons'
import { useAiConsent } from '@/composables/useAiConsent'
import { showAlert } from '@/lib/feedback'
import { successFeedback } from '@/lib/native'

defineProps<{ isOpen: boolean }>()
const emit = defineEmits<{ decline: [] }>()

const { setConsent } = useAiConsent()
const saving = ref(false)

// Accepting closes the modal: the parent opens it only while consent is missing
async function accept() {
  saving.value = true
  try {
    await setConsent(true)
    successFeedback()
  } catch {
    await showAlert('Enregistrement impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ion-modal :is-open="isOpen">
    <ion-content>
      <div class="consent">
        <ion-icon
          :icon="shieldCheckmarkOutline"
          class="icon"
          aria-hidden="true"
        />
        <h1>Votre accord avant de commencer</h1>
        <p>
          Pour personnaliser ses conseils, le coach transmet vos données de profil, y compris
          sensibles (santé, régime alimentaire), et vos messages à des services d'intelligence
          artificielle tiers.
        </p>
        <p>Vous pourrez retirer votre accord à tout moment dans Profil, Traitement par l'IA.</p>

        <div class="actions">
          <ion-button
            expand="block"
            color="brand"
            class="main-action"
            :disabled="saving"
            @click="accept"
          >
            <ion-spinner
              v-if="saving"
              name="crescent"
            />
            <span v-else>J'accepte</span>
          </ion-button>
          <ion-button
            expand="block"
            fill="clear"
            @click="emit('decline')"
          >
            Pas maintenant
          </ion-button>
        </div>
      </div>
    </ion-content>
  </ion-modal>
</template>

<style scoped>
.consent {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 14px;
  min-height: 100%;
  padding: calc(var(--ion-safe-area-top, 0px) + 32px) 24px calc(var(--ion-safe-area-bottom, 0px) + 24px);
  text-align: center;
}

.icon {
  align-self: center;
  font-size: 56px;
  color: var(--kp-green-700);
}

h1 {
  margin: 0;
  font-size: 26px;
  line-height: 32px;
  font-weight: 600;
}

p {
  margin: 0;
  font-size: 17px;
  line-height: 24px;
  color: var(--kp-slate-600);
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 12px;
}
</style>
