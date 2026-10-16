<script setup lang="ts">
import { ref } from 'vue'
import { IonItem, IonList, IonToggle, alertController } from '@ionic/vue'
import type { ToggleCustomEvent } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { useAiConsent } from '@/composables/useAiConsent'
import { showAlert } from '@/lib/feedback'
import { tapFeedback } from '@/lib/native'

const { hasConsent, setConsent } = useAiConsent()
const saving = ref(false)

async function confirmWithdrawal() {
  const alert = await alertController.create({
    header: 'Retirer votre accord ?',
    message: 'Le coach ne pourra plus vous répondre tant que vous ne l\'aurez pas redonné.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Retirer', role: 'destructive' }
    ]
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'destructive'
}

async function onToggle(event: ToggleCustomEvent) {
  const toggle = event.target
  const given = event.detail.checked
  if (!given && !await confirmWithdrawal()) {
    toggle.checked = true
    return
  }

  saving.value = true
  try {
    await setConsent(given)
    tapFeedback()
  } catch {
    toggle.checked = !given
    await showAlert('Enregistrement impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <ProfileSubPage title="Traitement par l'IA">
    <ion-list inset>
      <ion-item>
        <ion-toggle
          :checked="hasConsent"
          :disabled="saving"
          justify="space-between"
          @ion-change="onToggle"
        >
          Autoriser le traitement par l'IA
        </ion-toggle>
      </ion-item>
    </ion-list>

    <div class="explanation">
      <p>
        Pour personnaliser ses conseils, le coach transmet vos données de profil, y compris
        sensibles (santé, régime alimentaire), et vos messages à des services d'intelligence
        artificielle tiers.
      </p>
      <p>Sans votre accord, le coach ne peut pas vous répondre. Vous pouvez le retirer ou le redonner à tout moment.</p>
    </div>
  </ProfileSubPage>
</template>

<style scoped>
.explanation {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 16px;
}

.explanation p {
  margin: 0;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}
</style>
