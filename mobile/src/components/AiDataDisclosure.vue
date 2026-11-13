<script setup lang="ts">
import { PRIVACY_URL } from '@/lib/config'
import { openExternal } from '@/lib/native'

// What the coach sends to which AI provider, shown wherever the user gives the consent: App Review
// asks to name the data and the recipients before asking (guidelines 5.1.1(i) and 5.1.2(i)).
// Keep it in line with the privacy policy (app/components/legal/PrivacyPolicy.vue)
const DATA = [
  'vos messages au coach, avec les photos et documents PDF que vous y joignez',
  'votre profil : âge, sexe, taille, poids, objectif, habitudes, préférences alimentaires (y compris un régime religieux) et données de santé (pathologies, allergies, traitements, troubles alimentaires)',
  'vos repas : photos et descriptions à analyser, journal des repas'
]

const RECIPIENTS = [
  { name: 'Groq', role: 'réponses du coach, analyse des images et des repas décrits' },
  { name: 'Anthropic', role: 'analyse des photos de repas et des documents PDF' },
  { name: 'OpenAI', role: 'mémoire du coach (ce qu\'il retient de vos échanges)' },
  { name: 'Exa', role: 'recherche web, qui ne reçoit que le texte de la recherche' }
]
</script>

<template>
  <div class="disclosure">
    <p class="title">
      Données transmises
    </p>
    <ul>
      <li
        v-for="item in DATA"
        :key="item"
      >
        {{ item }}
      </li>
    </ul>
    <p class="title">
      Destinataires (services d'IA tiers)
    </p>
    <ul>
      <li
        v-for="recipient in RECIPIENTS"
        :key="recipient.name"
      >
        <strong>{{ recipient.name }}</strong> : {{ recipient.role }}
      </li>
    </ul>
    <p>
      Rien ne leur est envoyé sans votre accord.
    </p>
    <button
      type="button"
      class="more"
      @click="openExternal(PRIVACY_URL)"
    >
      Politique de confidentialité
    </button>
  </div>
</template>

<style scoped>
.disclosure {
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
  font-size: 15px;
  line-height: 21px;
  color: var(--kp-text-muted);
}

.disclosure p {
  margin: 0;
}

.title {
  margin-top: 6px !important;
  font-weight: 600;
  color: var(--kp-text);
}

ul {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding-left: 20px;
}

strong {
  color: var(--kp-text);
}

.more {
  align-self: flex-start;
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--kp-accent);
  font-family: inherit;
  font-size: 15px;
}
</style>
