<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonModal,
  IonSpinner,
  IonToolbar
} from '@ionic/vue'
import { bulbOutline, cameraOutline, chatbubblesOutline, checkmarkCircle, trendingDownOutline } from 'ionicons/icons'
import KiwiAvatar from '@/components/KiwiAvatar.vue'
import { usePaywall } from '@/composables/usePaywall'
import { useProfile } from '@/composables/useProfile'
import { api } from '@/lib/api'
import { PRIVACY_URL, TERMS_URL } from '@/lib/config'
import { showAlert } from '@/lib/feedback'
import { openExternal, successFeedback, tapFeedback, warningFeedback } from '@/lib/native'
import { loadPlans, purchase, purchasesAvailable, restorePurchases } from '@/lib/purchases'
import type { Plan } from '@/lib/purchases'

// The in-app subscription screen (App Store, through RevenueCat). Apple asks to show the billed
// price most visibly, the length, the trial and the renewal terms, with the terms of use, the
// privacy policy and a way to restore purchases (guideline 3.1.2)
const { paywallOpen, closePaywall } = usePaywall()
const { loadProfile, hasActiveSubscription } = useProfile()

const BENEFITS = [
  { icon: chatbubblesOutline, text: 'Un coach qui vous connaît, disponible jour et nuit' },
  { icon: cameraOutline, text: 'Vos repas analysés en une photo' },
  { icon: bulbOutline, text: 'Des idées de repas selon votre journée' },
  { icon: trendingDownOutline, text: 'Votre poids et votre objectif suivis' }
]

const plans = ref<Plan[]>([])
const selectedKind = ref<Plan['kind'] | null>(null)
const loading = ref(false)
const failed = ref(false)
const busy = ref(false)

const selected = computed(() => plans.value.find(plan => plan.kind === selectedKind.value) ?? null)

const buttonLabel = computed(() => selected.value?.trialDays
  ? `Essayer gratuitement ${selected.value.trialDays} jours`
  : 'S\'abonner')

const termsText = computed(() => {
  const plan = selected.value
  const trial = plan?.trialDays
    ? `Essai gratuit de ${plan.trialDays} jours, puis ${plan.price} ${plan.period}. Annulez au moins 24 h avant la fin de l'essai pour ne rien payer. `
    : ''
  return `${trial}Abonnement renouvelé automatiquement, sauf résiliation au moins 24 h avant la fin de la période en cours. Le paiement est débité de votre compte Apple. Gérez ou résiliez votre abonnement dans les réglages de votre compte Apple.`
})

async function load() {
  if (!purchasesAvailable) return
  loading.value = true
  failed.value = false
  try {
    plans.value = await loadPlans()
    // The trial first, as on the website, else the quarterly plan
    selectedKind.value = (plans.value.find(plan => plan.trialDays)
      ?? plans.value.find(plan => plan.kind === 'quarterly')
      ?? plans.value[0])?.kind ?? null
    failed.value = plans.value.length === 0
  } catch {
    failed.value = true
  } finally {
    loading.value = false
  }
}

// The server reads the purchase from RevenueCat right away, rather than waiting for its notification
async function unlock() {
  await api('/api/revenuecat/sync', { method: 'POST' }).catch(() => {})
  await loadProfile().catch(() => {})
}

async function buy() {
  const plan = selected.value
  if (!plan || busy.value) return
  tapFeedback()
  busy.value = true
  try {
    if (!await purchase(plan)) return
    await unlock()
    successFeedback()
    closePaywall()
    await showAlert(
      hasActiveSubscription.value ? 'Bienvenue !' : 'Achat confirmé',
      hasActiveSubscription.value
        ? 'Votre coach est à vous. Posez-lui votre première question !'
        : 'Votre accès s\'active dans quelques instants.'
    )
  } catch {
    warningFeedback()
    await showAlert('Achat impossible', 'L\'App Store n\'a pas pu finaliser l\'achat. Vérifiez votre connexion internet et réessayez.')
  } finally {
    busy.value = false
  }
}

async function restore() {
  if (busy.value) return
  busy.value = true
  try {
    if (await restorePurchases()) {
      await unlock()
      successFeedback()
      closePaywall()
      await showAlert('Abonnement restauré', 'Votre coach est de nouveau disponible.')
    } else {
      await showAlert('Aucun abonnement trouvé', 'Ce compte Apple n\'a pas d\'abonnement Kipoui en cours.')
    }
  } catch {
    warningFeedback()
    await showAlert('Restauration impossible', 'Vérifiez votre connexion internet et réessayez.')
  } finally {
    busy.value = false
  }
}

function choose(plan: Plan) {
  if (selectedKind.value === plan.kind) return
  selectedKind.value = plan.kind
  tapFeedback()
}
</script>

<template>
  <ion-modal
    :is-open="paywallOpen"
    class="grouped-page"
    @will-present="load"
    @did-dismiss="closePaywall"
  >
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="end">
          <ion-button
            :disabled="busy"
            @click="closePaywall"
          >
            Fermer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="paywall">
        <div class="hero">
          <KiwiAvatar :size="72" />
          <h1>Votre coach nutrition, sans limite</h1>
        </div>

        <ul class="benefits">
          <li
            v-for="benefit in BENEFITS"
            :key="benefit.text"
          >
            <span
              class="row-icon"
              aria-hidden="true"
            >
              <ion-icon :icon="benefit.icon" />
            </span>
            {{ benefit.text }}
          </li>
        </ul>

        <p
          v-if="!purchasesAvailable"
          class="state"
        >
          L'abonnement se souscrit depuis l'application iPhone.
        </p>
        <div
          v-else-if="loading"
          class="state"
        >
          <ion-spinner name="crescent" />
        </div>
        <div
          v-else-if="failed"
          class="state"
        >
          <p>Les offres n'ont pas pu être chargées. Vérifiez votre connexion internet.</p>
          <ion-button
            fill="clear"
            @click="load"
          >
            Réessayer
          </ion-button>
        </div>
        <div
          v-else
          class="plans"
          role="radiogroup"
          aria-label="Formules"
        >
          <button
            v-for="plan in plans"
            :key="plan.kind"
            type="button"
            role="radio"
            class="plan"
            :class="{ selected: plan.kind === selectedKind }"
            :aria-checked="plan.kind === selectedKind"
            @click="choose(plan)"
          >
            <span class="plan-text">
              <span class="plan-title">
                {{ plan.title }}
                <span
                  v-if="plan.trialDays"
                  class="badge"
                >{{ plan.trialDays }} jours gratuits</span>
                <span
                  v-else-if="plan.saving && plan.saving > 0"
                  class="badge"
                >−{{ plan.saving }} %</span>
              </span>
              <span class="plan-price"><strong>{{ plan.price }}</strong> {{ plan.period }}</span>
              <span
                v-if="plan.perMonth"
                class="plan-sub"
              >soit {{ plan.perMonth }}</span>
            </span>
            <ion-icon
              v-if="plan.kind === selectedKind"
              :icon="checkmarkCircle"
              class="check"
              aria-hidden="true"
            />
            <span
              v-else
              class="circle"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </ion-content>

    <ion-footer class="ion-no-border">
      <ion-toolbar>
        <div class="actions">
          <ion-button
            v-if="purchasesAvailable"
            expand="block"
            color="brand"
            class="main-action"
            :disabled="!selected || busy"
            @click="buy"
          >
            <ion-spinner
              v-if="busy"
              name="crescent"
            />
            <span v-else>{{ buttonLabel }}</span>
          </ion-button>
          <p
            v-if="purchasesAvailable && selected"
            class="terms"
          >
            {{ termsText }}
          </p>
          <div class="links">
            <button
              v-if="purchasesAvailable"
              type="button"
              :disabled="busy"
              @click="restore"
            >
              Restaurer mes achats
            </button>
            <button
              type="button"
              @click="openExternal(TERMS_URL)"
            >
              Conditions d'utilisation
            </button>
            <button
              type="button"
              @click="openExternal(PRIVACY_URL)"
            >
              Confidentialité
            </button>
          </div>
        </div>
      </ion-toolbar>
    </ion-footer>
  </ion-modal>
</template>

<style scoped>
.paywall {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 0 16px 24px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.hero h1 {
  margin: 0;
  font-size: 28px;
  line-height: 34px;
  font-weight: 600;
}

.benefits {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0 4px;
  list-style: none;
}

.benefits li {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  line-height: 22px;
}

.benefits .row-icon {
  flex-shrink: 0;
}

.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}

.state p {
  margin: 0;
}

.plans {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.plan {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 72px;
  padding: 12px 16px;
  border: 2px solid var(--kp-border);
  border-radius: 16px;
  background: var(--kp-surface);
  color: var(--kp-text);
  font-family: inherit;
  text-align: left;
}

.plan.selected {
  border-color: var(--kp-accent);
}

.plan-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 2px;
}

.plan-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--kp-text-muted);
}

.badge {
  padding: 2px 8px;
  border-radius: 999px;
  background: var(--kp-tint-bg);
  color: var(--kp-tint-fg);
  font-size: 12px;
  font-weight: 600;
}

.plan-price {
  font-size: 17px;
}

.plan-price strong {
  font-size: 20px;
  font-weight: 600;
}

.plan-sub {
  font-size: 13px;
  color: var(--kp-text-muted);
}

.check {
  flex-shrink: 0;
  font-size: 26px;
  color: var(--kp-accent);
}

.circle {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  margin: 2px;
  border: 2px solid var(--kp-input-border);
  border-radius: 50%;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 16px;
}

.terms {
  margin: 0;
  font-size: 11px;
  line-height: 15px;
  text-align: center;
  color: var(--kp-text-muted);
}

.links {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px 16px;
}

.links button {
  min-height: 32px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--kp-accent);
  font-family: inherit;
  font-size: 13px;
}

.links button:disabled {
  opacity: 0.5;
}
</style>
