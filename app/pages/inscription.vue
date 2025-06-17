<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  titleTemplate: 'Kipoui - %s',
  title: 'Inscription',
  description: 'Créer un compte pour commencer'
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
}]

const schema = z.object({
  email: z.string({ message: 'Le champ email est obligatoire' }).email('Email invalide'),
  password: z.string({ message: 'Le mot de passe est obligatoire' }).min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { priceId } = useRoute().query

  const supabase = useSupabaseClient()
  const toast = useToast()

  const { email, password } = payload.data

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: priceId ? `${useRequestURL().origin}/paiement?priceId=${priceId}` : `${useRequestURL().origin}/tableau-de-bord`
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
        class="text-primary font-medium"
      >Se connecter</ULink>.
    </template>

    <template #footer>
      En vous inscrivant, vous acceptez nos <ULink
        to="/conditions-utilisation"
        class="text-primary font-medium"
      >Conditions Générales d'Utilisation</ULink>.
    </template>
  </UAuthForm>
</template>
