<script setup lang="ts">
// Where the confirmation link of an account created in the iOS app leads. Supabase has confirmed the
// address before redirecting here: the user only has to go back to the app and sign in
definePageMeta({
  layout: false
})

useHead({
  title: 'Adresse confirmée'
})
useSeoMeta({
  description: 'Confirmation de votre adresse e-mail Kipoui',
  robots: 'noindex'
})

// An expired or already used link comes back with an error instead
const expired = ref(false)

onMounted(() => {
  const params = new URLSearchParams(window.location.hash.slice(1))
  expired.value = params.has('error')
  // The link also carries a session (implicit flow), useless here: keep it out of the history
  if (window.location.hash) {
    window.history.replaceState(window.history.state, '', window.location.pathname)
  }
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen max-w-md gap-4 px-6 mx-auto text-center">
    <NuxtImg
      src="/images/logo/logo-whithout-text.png"
      alt=""
      width="88"
      height="88"
      format="auto"
    />
    <template v-if="expired">
      <h1 class="text-3xl font-bold text-highlighted">
        Lien expiré
      </h1>
      <p class="text-lg text-muted">
        Ce lien de confirmation n'est plus valide. Connectez-vous dans l'application Kipoui :
        elle vous proposera de renvoyer l'e-mail.
      </p>
    </template>
    <template v-else>
      <h1 class="text-3xl font-bold text-highlighted">
        Adresse e-mail confirmée
      </h1>
      <p class="text-lg text-muted">
        Votre compte Kipoui est prêt. Retournez dans l'application pour vous connecter.
      </p>
    </template>
  </div>
</template>
