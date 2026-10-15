<script setup lang="ts">
import { ref } from 'vue'
import {
  IonButton,
  IonCheckbox,
  IonContent,
  IonIcon,
  IonInput,
  IonInputPasswordToggle,
  IonItem,
  IonList,
  IonPage,
  IonSpinner,
  useIonRouter
} from '@ionic/vue'
import { mailOpenOutline } from 'ionicons/icons'
import type { AuthError } from '@supabase/supabase-js'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import { ACCOUNT_CONFIRMED_URL, PRIVACY_URL, TERMS_URL } from '@/lib/config'
import { showAlert } from '@/lib/feedback'
import { openExternal, successFeedback, warningFeedback } from '@/lib/native'
import { session } from '@/lib/session'
import { supabase } from '@/lib/supabase'

const ionRouter = useIonRouter()

const email = ref('')
const password = ref('')
const aiConsent = ref(false)
const loading = ref(false)
// Where the confirmation email went, once the account is created
const sentTo = ref<string | null>(null)

// Supabase answers in English
function describeError(error: AuthError) {
  switch (error.code) {
    case 'user_already_exists':
    case 'email_exists':
      return 'Un compte existe déjà avec cette adresse. Connectez-vous, ou choisissez « Mot de passe oublié ? ».'
    case 'weak_password':
      return 'Ce mot de passe est trop facile à deviner. Choisissez-en un plus long ou plus varié.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Cette adresse e-mail n\'est pas valide.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Trop de tentatives. Réessayez dans quelques minutes.'
    default:
      return 'Vérifiez votre connexion internet et réessayez.'
  }
}

async function signUp() {
  const address = email.value.trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
    await showAlert('Adresse invalide', 'Saisissez une adresse e-mail valide.')
    return
  }
  if (password.value.length < 8) {
    await showAlert('Mot de passe trop court', 'Votre mot de passe doit contenir au moins 8 caractères.')
    return
  }
  if (!aiConsent.value) {
    await showAlert('Votre accord est nécessaire', 'Sans votre accord pour le traitement par l\'IA, le coach ne peut pas vous répondre.')
    return
  }

  loading.value = true
  // Same signup as the website: the AI consent is recorded with the account
  const { data, error } = await supabase.auth.signUp({
    email: address,
    password: password.value,
    options: {
      // The confirmation link opens a website page that sends the user back to the app
      emailRedirectTo: ACCOUNT_CONFIRMED_URL,
      data: { ai_consent_at: new Date().toISOString() }
    }
  })
  loading.value = false

  if (error) {
    warningFeedback()
    await showAlert('Inscription impossible', describeError(error))
    return
  }

  successFeedback()
  // Without email confirmation, Supabase signs the user in right away
  if (data.session) {
    session.value = data.session
    ionRouter.navigate('/tabs/coach', 'root', 'replace')
    return
  }
  sentTo.value = address
}
</script>

<template>
  <ion-page class="grouped-page">
    <ion-content>
      <main class="signup">
        <div
          v-if="sentTo"
          class="intro"
        >
          <ion-icon
            :icon="mailOpenOutline"
            class="sent-icon"
            aria-hidden="true"
          />
          <h1>Vérifiez vos e-mails</h1>
          <p>
            Nous avons envoyé un lien de confirmation à <strong>{{ sentTo }}</strong>.
            Une fois votre adresse confirmée, revenez ici pour vous connecter.
          </p>
          <ion-button
            expand="block"
            color="brand"
            class="main-action confirm"
            router-link="/connexion"
            router-direction="back"
          >
            Se connecter
          </ion-button>
        </div>

        <template v-else>
          <div class="intro">
            <KiwiAvatar :size="72" />
            <h1>Créer votre compte</h1>
            <p>Quelques secondes pour faire connaissance avec votre coach.</p>
          </div>

          <form
            class="form"
            @submit.prevent="signUp"
          >
            <div>
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
                    autocomplete="new-password"
                    enterkeyhint="done"
                    placeholder="Mot de passe"
                    aria-label="Mot de passe"
                  >
                    <ion-input-password-toggle slot="end" />
                  </ion-input>
                </ion-item>
              </ion-list>
              <p class="group-hint hint">
                8 caractères minimum.
              </p>
            </div>

            <div class="consent">
              <ion-checkbox
                v-model="aiConsent"
                label-placement="end"
                justify="start"
                alignment="start"
              >
                J'accepte que mes données de profil, y compris sensibles (santé, régime alimentaire),
                et mes messages soient traités par des services d'intelligence artificielle tiers pour
                personnaliser mon accompagnement.
              </ion-checkbox>
              <button
                type="button"
                class="text-link more"
                @click="openExternal(PRIVACY_URL)"
              >
                En savoir plus
              </button>
            </div>

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
              <span v-else>Créer mon compte</span>
            </ion-button>

            <p class="legal-note">
              En créant un compte, vous acceptez nos
              <button
                type="button"
                class="text-link"
                @click="openExternal(TERMS_URL)"
              >
                conditions d'utilisation
              </button>.
            </p>
          </form>

          <ion-button
            fill="clear"
            class="switch"
            router-link="/connexion"
            router-direction="back"
          >
            Déjà un compte ? Se connecter
          </ion-button>
        </template>
      </main>
    </ion-content>
  </ion-page>
</template>

<style scoped>
.signup {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
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
  line-height: 24px;
  color: var(--kp-slate-600);
}

.sent-icon {
  font-size: 64px;
  color: var(--kp-green-700);
}

.confirm {
  width: 100%;
  margin-top: 16px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form ion-list.list-inset {
  margin: 0;
}

.hint {
  margin-top: 8px;
}

.consent {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 16px;
  background: #ffffff;
}

.consent ion-checkbox {
  font-size: 15px;
  line-height: 21px;
}

.consent ion-checkbox::part(label) {
  white-space: normal;
}

.more {
  margin-left: 34px;
  font-size: 15px;
}

.switch {
  align-self: center;
  font-size: 16px;
}
</style>
