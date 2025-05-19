<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const toast = useToast()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Nouveau mot de passe',
  description: 'Mettez à jour votre mot de passe'
})

const fields = [{
  name: 'password',
  label: 'Mot de passe',
  type: 'password' as const,
  placeholder: 'Entrez votre mot de passe'
}]

const schema = z.object({
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères')
})

type Schema = z.output<typeof schema>

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  const { password } = payload.data

  const { error } = await supabase.auth.updateUser({
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

  toast.add({
    title: 'Succès',
    description: 'Votre mot de passe a été mis à jour',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })

  navigateTo('/connexion')
}
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    title="Nouveau mot de passe"
    icon="i-lucide-lock"
    separator="ou"
    :submit="{ label: 'Mettre à jour' }"
    @submit="onSubmit"
  />
</template>
