<script setup lang="ts">
const supabase = useSupabaseClient()
const user = useSupabaseUser()
const toast = useToast()

async function resetPassword() {
  const { error } = await supabase.auth.resetPasswordForEmail(user.value!.email!, {
    redirectTo: `${useRequestURL().origin}/nouveau-mot-de-passe`
  })

  if (error) {
    console.log('Supabase error:', error)

    toast.add({
      title: 'Erreur',
      description: error.message,
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
    return
  }

  toast.add({
    title: 'Email envoyé',
    description: 'Un email de réinitialisation de mot de passe vous a été envoyé',
    color: 'success',
    icon: 'i-lucide-check-circle'
  })
}
</script>

<template>
  <UPageCard
    title="Mot de passe"
    description="Recevez un mail de réinitialisation de votre mot de passe"
    variant="subtle"
  >
    <UButton
      label="Réinitialiser mon mot de passe"
      class="w-fit"
      @click="resetPassword"
    />
  </UPageCard>
</template>
