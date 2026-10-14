<script setup lang="ts">
useHead({
  title: 'Contact et assistance'
})
useSeoMeta({
  description: 'Contacter l\'équipe Kipoui pour une question sur votre compte, votre abonnement ou vos données'
})
</script>

<template>
  <div class="container max-w-4xl px-4 py-8 mx-auto">
    <h1 class="mb-8 text-3xl font-bold text-center">
      Contact et assistance
    </h1>
    <div class="p-6 rounded-lg shadow-md bg-default">
      <div class="space-y-8">
        <section>
          <h2 class="mb-4 text-xl font-semibold">
            Nous écrire
          </h2>
          <p>
            Une question, un problème avec votre compte, votre abonnement ou vos données ? Écrivez-nous à
            <ULink
              to="mailto:contact@kipoui.com"
              class="font-medium text-primary"
            >contact@kipoui.com</ULink>, nous vous répondons dès que possible.
          </p>
        </section>

        <section>
          <h2 class="mb-4 text-xl font-semibold">
            Gérer votre compte vous-même
          </h2>
          <ul class="pl-6 list-disc space-y-2">
            <li><strong>Modifier vos informations</strong> : Paramètres > Profil.</li>
            <li><strong>Retirer votre accord au traitement par l'IA</strong> ou <strong>supprimer votre compte</strong> : Paramètres > Sécurité.</li>
            <li><strong>Gérer votre abonnement</strong> : depuis le site kipoui.com.</li>
          </ul>
        </section>

        <section>
          <h2 class="mb-4 text-xl font-semibold">
            Documents utiles
          </h2>
          <ul class="pl-6 list-disc space-y-2">
            <li>
              <ULink
                to="/confidentialite"
                class="font-medium text-primary"
              >Politique de confidentialité</ULink>
            </li>
            <li>
              <ULink
                to="/conditions-utilisation"
                class="font-medium text-primary"
              >Conditions Générales d'Utilisation</ULink>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>
