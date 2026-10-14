<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Inscription'
})
useSeoMeta({
  description: 'Créer un compte pour commencer',
  robots: 'noindex, nofollow'
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Entrez votre email'
}, {
  name: 'password',
  label: 'Mot de passe',
  type: 'password' as const,
  placeholder: 'Entrez votre mot de passe'
}, {
  name: 'aiConsent',
  type: 'checkbox' as const
}]

const aiConsentMessage = 'Votre accord est nécessaire pour utiliser le coach'

const schema = z.object({
  email: z.string({ message: 'Le champ email est obligatoire' }).email('Email invalide'),
  password: z.string({ message: 'Le mot de passe est obligatoire' }).min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  aiConsent: z.boolean({ message: aiConsentMessage }).refine(value => value, { message: aiConsentMessage })
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { priceId } = useRoute().query

  const supabase = useSupabaseClient()
  const toast = useToast()
  const { getRedirectUrl } = useAppUrl()

  const { email, password } = payload.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: priceId
        ? getRedirectUrl(`/paiement?priceId=${priceId}`)
        : getRedirectUrl('/tableau-de-bord'),
      data: { ai_consent_at: new Date().toISOString() }
    }
  })

  if (error) {
    toast.add({
      title: 'Erreur',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })

    return
  }

  toast.add({
    title: 'Succès',
    description: 'Un mail de confirmation vous a été envoyé',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Inscription"
    icon="i-lucide-lock"
    separator="ou"
    :submit="{ label: 'Créer mon compte' }"
    @submit="onSubmit"
  >
    <template #description>
      Déjà inscrit ? <ULink
        to="/connexion"
        class="font-medium text-primary"
      >Se connecter</ULink>.
    </template>

    <template #aiConsent-field="{ state }">
      <UCheckbox v-model="state.aiConsent">
        <template #label>
          J'accepte que mes données de profil, y compris sensibles (santé, régime alimentaire), et mes messages soient traités par des services d'intelligence artificielle tiers pour personnaliser mon accompagnement.
          <ULink
            to="/confidentialite"
            class="font-medium text-primary"
          >En savoir plus</ULink>
        </template>
      </UCheckbox>
    </template>

    <template #footer>
      En vous inscrivant, vous acceptez nos <ULink
        to="/conditions-utilisation"
        class="font-medium text-primary"
      >Conditions Générales d'Utilisation</ULink>.
    </template>
  </UAuthForm>
</template>
