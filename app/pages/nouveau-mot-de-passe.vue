<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'

const supabase = useSupabaseClient()
const toast = useToast()

// Links requested from the iOS app use the implicit flow (the app keeps no PKCE verifier the site
// could use): their session arrives in the URL fragment, which the site's PKCE client refuses
onMounted(async () => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  if (!params.has('access_token') && !params.has('error')) return
  // Keep the tokens out of the browser history
  window.history.replaceState(window.history.state, '', window.location.pathname)

  const accessToken = params.get('access_token')
  const refreshToken = params.get('refresh_token')
  const { error } = accessToken && refreshToken
    ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    : { error: new Error(params.get('error_description') ?? 'Invalid link') }

  if (error) {
    toast.add({
      title: 'Lien expiré',
      description: 'Ce lien n\'est plus valide. Demandez-en un nouveau avec « Mot de passe oublié ? ».',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
})

definePageMeta({
  layout: 'auth'
})

useHead({
  title: 'Nouveau mot de passe'
})
useSeoMeta({
  description: 'Mettez à jour votre mot de passe',
  robots: 'noindex, nofollow'
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
