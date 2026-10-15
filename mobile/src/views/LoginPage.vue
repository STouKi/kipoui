<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton,
  IonContent,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonPage,
  IonSpinner,
  useIonRouter
} from '@ionic/vue'
import type { AuthError } from '@supabase/supabase-js'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import { WEB_URL } from '@/lib/config'
import { showAlert } from '@/lib/feedback'
import { successFeedback, warningFeedback } from '@/lib/native'
import { session } from '@/lib/session'
import { supabase } from '@/lib/supabase'

const ionRouter = useIonRouter()

const email = ref('')
const password = ref('')
const loading = ref(false)

// Supabase answers in English
function describeError(error: AuthError) {
  switch (error.code) {
    case 'invalid_credentials':
      return 'E-mail ou mot de passe incorrect.'
    case 'email_not_confirmed':
      return 'Confirmez d\'abord votre adresse e-mail, avec le lien reçu à l\'inscription.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    default:
      return 'Vérifiez votre connexion internet et réessayez.'
  }
}

async function signIn() {
  if (!email.value.trim() || !password.value) {
    await showAlert('Champs manquants', 'Saisissez votre e-mail et votre mot de passe.')
    return
  }

  loading.value = true
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.value.trim(),
    password: password.value
  })
  loading.value = false

  if (error) {
    warningFeedback()
    await showAlert('Connexion impossible', describeError(error))
    return
  }

  successFeedback()
  // The router guard reads the session: don't wait for Supabase's auth event
  session.value = data.session
  ionRouter.navigate('/tabs/coach', 'root', 'replace')
}

async function resetPassword() {
  const address = email.value.trim()
  if (!address) {
    await showAlert('Mot de passe oublié', 'Saisissez d\'abord votre e-mail, puis appuyez de nouveau sur « Mot de passe oublié ? ».')
    return
  }

  // The link opens the website, where the new password is chosen
  const { error } = await supabase.auth.resetPasswordForEmail(address, {
    redirectTo: `${WEB_URL}/nouveau-mot-de-passe`
  })
  if (error) {
    await showAlert('Envoi impossible', describeError(error))
    return
  }
  await showAlert('E-mail envoyé', `Si un compte existe pour ${address}, vous allez recevoir un lien pour choisir un nouveau mot de passe.`)
}
</script>

<template>
  <ion-page class="grouped-page">
    <ion-content>
      <main class="login">
        <div class="intro">
          <KiwiAvatar :size="88" />
          <h1>Bon retour parmi nous</h1>
          <p>Connectez-vous pour retrouver votre coach.</p>
        </div>

        <form
          class="form"
          @submit.prevent="signIn"
        >
          <ion-list inset>
            <ion-item>
              <ion-input
                v-model="email"
                type="email"
                inputmode="email"
                autocomplete="email"
                autocapitalize="off"
                enterkeyhint="next"
                placeholder="E-mail"
                aria-label="E-mail"
              />
            </ion-item>
            <ion-item>
              <ion-input
                v-model="password"
                type="password"
                autocomplete="current-password"
                enterkeyhint="go"
                placeholder="Mot de passe"
                aria-label="Mot de passe"
                @keyup.enter="signIn"
              >
                <ion-input-password-toggle slot="end" />
              </ion-input>
            </ion-item>
          </ion-list>

          <ion-button
            type="submit"
            expand="block"
            color="brand"
            class="main-action"
            :disabled="loading"
          >
            <ion-spinner
              v-if="loading"
              name="crescent"
            />
            <span v-else>Se connecter</span>
          </ion-button>

          <ion-button
            fill="clear"
            class="forgot"
            @click="resetPassword"
          >
            Mot de passe oublié ?
          </ion-button>
        </form>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.login {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 28px;
  min-height: 100%;
  padding: calc(var(--ion-safe-area-top, 0px) + 24px) 16px calc(var(--ion-safe-area-bottom, 0px) + 24px);
}

.intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
}

.intro h1 {
  margin: 6px 0 0;
  font-size: 28px;
  font-weight: 600;
}

.intro p {
  margin: 0;
  font-size: 17px;
  color: var(--kp-slate-600);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form ion-list.list-inset {
  margin: 0;
}

.forgot {
  align-self: center;
  font-size: 16px;
}
</style>
