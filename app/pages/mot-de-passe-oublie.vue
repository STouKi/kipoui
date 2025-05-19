<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const toast = useToast()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Mot de passe oublié',
  description: 'Réinitialisez votre mot de passe'
})

const fields = [{
  name: 'email',
  type: 'text' as const,
  label: 'Email',
  placeholder: 'Entrez votre email',
  required: true
}]

const schema = z.object({
  email: z.string().email('Email invalide')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { email } = payload.data

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${useRequestURL().origin}/nouveau-mot-de-passe`
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
    description: 'Un email de réinitialisation de mot de passe vous a été envoyé',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Mot de passe oublié"
    icon="i-lucide-user"
    separator="ou"
    :submit="{ label: 'Envoyer' }"
    @submit="onSubmit"
  />
</template>
