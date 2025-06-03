<script lang="ts" setup>
const toast = useToast()

async function deleteAccount() {
  try {
    const { error } = await useFetch('/api/account/delete', {
      method: 'POST'
    })

    if (error.value) {
      const serverError = error.value.data as { statusCode?: number, message?: string } | undefined
      console.log('Delete account error:', serverError)

      toast.add({
        title: 'Erreur',
        description: serverError?.message,
        color: 'error',
        icon: 'i-lucide-alert-circle'
      })
      return
    }

    toast.add({
      title: 'Compte supprimé',
      description: 'Votre compte a été supprimé avec succès.',
      color: 'success',
      icon: 'i-lucide-check-circle'
    })

    const client = useSupabaseClient()
    await client.auth.signOut()
    navigateTo('/')
  } catch (error) {
    console.error('Unexpected error during account deletion:', error)

    toast.add({
      title: 'Erreur',
      description: 'Une erreur inattendue est survenue lors de la suppression du compte',
      color: 'error',
      icon: 'i-lucide-alert-circle'
    })
  }
}
</script>

<template>
  <UPageCard
    title="Compte"
    description="Vous ne souhaitez plus utiliser notre service ? Vous pouvez supprimer votre compte ici. Cette action est irréversible. Toutes les informations liées à ce compte seront supprimées définitivement."
    class="bg-gradient-to-tl from-error/10 from-5% to-default"
  >
    <template #footer>
      <UModal
        title="Supprimer votre compte"
        description="Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible. Toutes les informations liées à ce compte seront supprimées définitivement."
      >
        <UButton
          label="Supprimer le compte"
          color="error"
        />

        <template #body>
          <UButton
            label="Supprimer le compte"
            color="error"
            @click="deleteAccount"
          />
        </template>
      </UModal>
    </template>
  </UPageCard>
</template>
