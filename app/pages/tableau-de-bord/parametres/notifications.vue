<script setup lang="ts">
const state = reactive<{ [key: string]: boolean }>({
  email: true,
  desktop: false,
  product_updates: true,
  weekly_digest: false,
  important_updates: true
})

const sections = [{
  title: 'Canaux de notification',
  description: 'Où pouvons-nous vous informer ?',
  fields: [{
    name: 'email',
    label: 'Email',
    description: 'Recevoir un résumé quotidien par email.'
  }, {
    name: 'desktop',
    label: 'Desktop',
    description: 'Recevoir des notifications sur votre ordinateur.'
  }]
}, {
  title: 'Mises à jour du compte',
  description: 'Recevoir des mises à jour sur votre compte.',
  fields: [{
    name: 'weekly_digest',
    label: 'Résumé hebdomadaire',
    description: 'Recevoir un résumé hebdomadaire par email.'
  }, {
    name: 'product_updates',
    label: 'Mises à jour du produit',
    description: 'Recevoir un email mensuel avec toutes les nouvelles fonctionnalités et mises à jour.'
  }, {
    name: 'important_updates',
    label: 'Mises à jour importantes',
    description: 'Recevoir des emails sur les mises à jour importantes comme les corrections de sécurité, les maintenance, etc.'
  }]
}]

async function onChange() {
  // Do something with data
  console.log(state)
}
</script>

<template>
  <div class="flex flex-col gap-8">
    <div
      v-for="(section, index) in sections"
      :key="index"
    >
      <UPageCard
        :title="section.title"
        :description="section.description"
        variant="naked"
        class="mb-4"
      />

      <UPageCard
        variant="subtle"
        :ui="{ container: 'divide-y divide-default' }"
      >
        <UFormField
          v-for="field in section.fields"
          :key="field.name"
          :name="field.name"
          :label="field.label"
          :description="field.description"
          class="flex items-center justify-between not-last:pb-4 gap-2"
        >
          <USwitch
            v-model="state[field.name]"
            @update:model-value="onChange"
          />
        </UFormField>
      </UPageCard>
    </div>
  </div>
</template>
