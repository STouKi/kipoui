<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Connexion',
  description: 'Se connecter pour continuer'
})

const toast = useToast()

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

const providers = [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: 'Se connecter avec Google' })
  }
}]

const schema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})

type Schema = z.output<typeof schema>

function onSubmit(payload: FormSubmitEvent<Schema>) {
  console.log('Submitted', payload)
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    title="Bon retour parmi nous"
    icon="i-lucide-user"
    separator="ou"
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
        to="/"
        class="text-primary font-medium"
        tabindex="-1"
      >Mot de passe oublié ?</ULink>
    </template>

    <template #footer>
      En vous connectant, vous acceptez nos <ULink
        to="/"
        class="text-primary font-medium"
      >Conditions d'utilisation</ULink>.
    </template>
  </UAuthForm>
</template>
