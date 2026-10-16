<script setup lang="ts">
import { ref } from 'vue'
import { IonButton, IonInput, IonItem, IonLabel, IonList, IonNote, IonSpinner, IonTextarea } from '@ionic/vue'
import ProfileSubPage from '@/components/ProfileSubPage.vue'
import UserAvatar from '@/components/UserAvatar.vue'
import { useProfile } from '@/composables/useProfile'
import { AttachmentError } from '@/lib/files'
import { showAlert, showSaveError } from '@/lib/feedback'
import { successFeedback } from '@/lib/native'
import { user } from '@/lib/session'
import type { FullProfile } from '@/lib/types'

type Profile = NonNullable<FullProfile['profile']>

const { profile, loadProfile, saveSection, uploadAvatar } = useProfile()

const fullName = ref('')
const username = ref('')
const about = ref('')
const uploading = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)

// Filled once: refilling the fields after each save would erase what is being typed in another one
function fill(data: FullProfile | null) {
  fullName.value = data?.profile?.full_name ?? ''
  username.value = data?.profile?.username ?? ''
  about.value = data?.profile?.profile_detail ?? ''
}

if (profile.value) {
  fill(profile.value)
} else {
  loadProfile().then(() => fill(profile.value)).catch(() => {})
}

async function save(data: Partial<Profile>, revert: () => void) {
  try {
    await saveSection('profile', data)
  } catch {
    revert()
    await showSaveError()
  }
}

// Same rules as the website's settings
async function saveFullName() {
  const previous = profile.value?.profile?.full_name ?? ''
  const value = fullName.value.trim()
  if (value === previous) return
  if (value.length < 2 || value.length > 50) {
    fullName.value = previous
    await showAlert('Nom invalide', 'Votre nom doit contenir entre 2 et 50 caractères.')
    return
  }
  await save({ full_name: value }, () => fullName.value = previous)
}

async function saveUsername() {
  const previous = profile.value?.profile?.username ?? ''
  const value = username.value.trim()
  if (value === previous) return
  if (value.length < 2) {
    username.value = previous
    await showAlert('Nom d\'utilisateur invalide', 'Votre nom d\'utilisateur doit contenir au moins 2 caractères.')
    return
  }
  await save({ username: value }, () => username.value = previous)
}

async function saveAbout() {
  const previous = profile.value?.profile?.profile_detail ?? ''
  const value = about.value.trim()
  if (value === previous) return
  await save({ profile_detail: value }, () => about.value = previous)
}

async function onPhotoPicked(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  target.value = ''
  if (!file) return

  uploading.value = true
  try {
    await uploadAvatar(file)
    successFeedback()
  } catch (error) {
    await showAlert('Photo non enregistrée', error instanceof AttachmentError
      ? error.message
      : 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <ProfileSubPage title="Informations">
    <div class="photo">
      <UserAvatar :size="96" />
      <ion-button
        fill="clear"
        :disabled="uploading"
        @click="photoInput?.click()"
      >
        <ion-spinner
          v-if="uploading"
          name="crescent"
        />
        <span v-else>Modifier la photo</span>
      </ion-button>
      <input
        ref="photoInput"
        type="file"
        accept="image/*"
        hidden
        @change="onPhotoPicked"
      >
    </div>

    <ion-list inset>
      <ion-item>
        <ion-input
          v-model="fullName"
          label="Nom"
          class="value-end"
          autocapitalize="words"
          autocomplete="name"
          enterkeyhint="done"
          @ion-change="saveFullName"
        />
      </ion-item>
      <ion-item>
        <ion-input
          v-model="username"
          label="Nom d'utilisateur"
          class="value-end"
          autocapitalize="off"
          autocomplete="username"
          enterkeyhint="done"
          @ion-change="saveUsername"
        />
      </ion-item>
      <ion-item>
        <ion-label>E-mail</ion-label>
        <ion-note slot="end">
          {{ user?.email }}
        </ion-note>
      </ion-item>
    </ion-list>

    <h2 class="group-title">
      Votre parcours
    </h2>
    <ion-list inset>
      <ion-item>
        <ion-textarea
          v-model="about"
          :auto-grow="true"
          :rows="4"
          :maxlength="500"
          placeholder="Ce que vous vivez, ce que vous avez traversé, ce qui vous a donné envie de vous faire accompagner…"
          aria-label="Votre parcours"
          @ion-change="saveAbout"
        />
      </ion-item>
    </ion-list>
    <p class="group-hint">
      Tout ce que vous partagez reste confidentiel et aide votre coach à mieux vous accompagner.
    </p>
  </ProfileSubPage>
</template>

<style scoped>
.photo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

ion-note {
  font-size: 17px;
  color: var(--kp-text-muted);
}
</style>
