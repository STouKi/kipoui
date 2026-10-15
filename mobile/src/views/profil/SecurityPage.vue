<script setup lang="ts">
import { ref } from 'vue'
import { IonItem, IonLabel, IonList, IonSpinner, alertController } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import { api } from '@/lib/api'
import { showAlert } from '@/lib/feedback'
import { warningFeedback } from '@/lib/native'
import { supabase } from '@/lib/supabase'

const deleting = ref(false)

// Required by the App Store (guideline 5.1.1(v)). The API deletes the Stripe customer, which
// cancels the subscription right away, then the data and the account
async function deleteAccount() {
  const alert = await alertController.create({
    header: 'Supprimer votre compte ?',
    message: 'Votre profil, vos conversations et vos pesées seront supprimés définitivement. Un abonnement en cours est résilié immédiatement.',
    buttons: [
      { text: 'Annuler', role: 'cancel' },
      { text: 'Supprimer', role: 'destructive' }
    ]
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  if (role !== 'destructive') return

  warningFeedback()
  deleting.value = true
  try {
    await api('/api/account/delete', { method: 'POST' })
  } catch {
    deleting.value = false
    await showAlert('Suppression impossible', 'Votre compte n\'a pas été supprimé. Vérifiez votre connexion internet et réessayez.')
    return
  }

  // The session belongs to a deleted user: only forget it on this device. App.vue then goes back
  // to the login screen
  await supabase.auth.signOut({ scope: 'local' })
  await showAlert('Compte supprimé', 'Votre compte et vos données ont été supprimés.')
}
</script>

<template>
  <ProfileSubPage title="Sécurité du compte">
    <ion-list inset>
      <ion-item
        button
        :detail="false"
        :disabled="deleting"
        @click="deleteAccount"
      >
        <ion-label color="danger">
          Supprimer mon compte
        </ion-label>
        <ion-spinner
          v-if="deleting"
          slot="end"
          name="crescent"
        />
      </ion-item>
    </ion-list>
    <p class="group-hint">
      Supprime définitivement votre compte, vos données et votre abonnement.
    </p>
  </ProfileSubPage>
</template>
