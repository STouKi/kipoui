<script setup lang="ts">
definePageMeta({
  layout: 'dashboard'
})
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Accueil"
        :ui="{ right: 'gap-3' }"
      />
    </template>

    <template #body>
      <h2 class="text-2xl font-bold">
        Bienvenue sur votre tableau de bord !
      </h2>

      <p>
        Pour le moment, seules les options de gestion des paramètres sont disponibles.
        <br><br>
        N’oubliez pas de compléter au maximum la section "Profil" avec vos informations : plus elles sont précises, plus votre chatbot pourra vous accompagner de manière attentive et personnalisée.
      </p>

      <p>
        Et ce n’est que le début ! Très bientôt, vous pourrez suivre ici votre évolution : poids, IMC, et bien d’autres indicateurs pour célébrer vos progrès pas à pas.
      </p>
    </template>
  </UDashboardPanel>
</template>
