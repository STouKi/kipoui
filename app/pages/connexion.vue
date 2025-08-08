<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const toast = useToast()
const userStore = useUserStore()

definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Connexion'
})
useSeoMeta({
  description: 'Se connecter pour continuer',
  robots: 'noindex, nofollow'
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Entrez votre email',
  required: true
}, {
  name: 'password',
  label: 'Mot de passe',
  type: 'password' as const,
  placeholder: 'Entrez votre mot de passe'
}, {
  name: 'remember',
  label: 'Se souvenir de moi',
  type: 'checkbox' as const
}]

const schema = z.object({
  email: z.string({ message: 'Le champ email est obligatoire' }).email('Email invalide'),
  password: z.string({ message: 'Le mot de passe est obligatoire' }).min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { email, password } = payload.data

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
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

  await userStore.setUser(data.user)

  toast.add({
    title: 'Succès',
    description: 'Connexion effectuée avec succès',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })

  navigateTo('/tableau-de-bord')
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Bon retour parmi nous"
    icon="i-lucide-user"
    separator="ou"
    :submit="{ label: 'Se connecter' }"
    @submit="onSubmit"
  >
    <template #description>
      Vous n'avez pas de compte ? <ULink
        to="/inscription"
        class="text-primary font-medium"
      >S'inscrire</ULink>.
    </template>

    <template #password-hint>
      <ULink
        to="/mot-de-passe-oublie"
        class="text-primary font-medium"
        tabindex="-1"
      >Mot de passe oublié ?</ULink>
    </template>

    <template #footer>
      En vous connectant, vous acceptez nos <ULink
        to="/conditions-utilisation"
        class="text-primary font-medium"
      >Conditions Générales d'Utilisation</ULink>.
    </template>
  </UAuthForm>
</template>
