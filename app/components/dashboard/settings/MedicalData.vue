<script setup lang="ts">
import type { Database } from '../../../../server/types/supabase'
import { Constants } from '../../../../server/types/supabase'

type MedicalData = Database['public']['Tables']['medical_data']['Row']
type Allergy = Database['public']['Enums']['allergy']
type EatingDisorder = Database['public']['Enums']['eating_disorders']
type MedicalRegimen = Database['public']['Enums']['medical_regimen']

const props = defineProps<{
  medicalData: MedicalData | null
  loading?: boolean
}>()

const isUpdating = ref(false)

const form = ref({
  allergies: props.medicalData?.allergies || [] as Allergy[],
  eating_disorders: props.medicalData?.eating_disorders || [] as EatingDisorder[],
  medical_regimen: props.medicalData?.medical_regimen || undefined as MedicalRegimen | undefined
})

watch(() => props.medicalData, (newData) => {
  if (newData) {
    form.value = {
      allergies: newData.allergies || [],
      eating_disorders: newData.eating_disorders || [],
      medical_regimen: newData.medical_regimen || undefined
    }
  }
}, { deep: true })

const allergyOptions = Constants.public.Enums.allergy.map((allergy) => {
  const labels: Record<Allergy, string> = {
    celery: 'Céleri',
    cereals_containing_gluten: 'Céréales contenant du gluten',
    crustaceans: 'Crustacés',
    eggs: 'Œufs',
    fish: 'Poisson',
    lupin: 'Lupin',
    milk: 'Lait',
    molluscs: 'Mollusques',
    mustard: 'Moutarde',
    peanuts: 'Arachides',
    sesame_seeds: 'Graines de sésame',
    soybeans: 'Soja',
    sulphur_dioxide_and_sulphites: 'Dioxyde de soufre et sulfites',
    tree_nuts: 'Fruits à coque'
  }
  return { label: labels[allergy], value: allergy }
})

const eatingDisorderOptions = Constants.public.Enums.eating_disorders.map((disorder) => {
  const labels: Record<EatingDisorder, string> = {
    anorexia: 'Anorexie',
    bulimia: 'Boulimie'
  }
  return { label: labels[disorder], value: disorder }
})

const medicalRegimenOptions = Constants.public.Enums.medical_regimen.map((regimen) => {
  const labels: Record<MedicalRegimen, string> = {
    diabetes: 'Diabète',
    cholesterol: 'Cholestérol',
    hypertension: 'Hypertension',
    crohn: 'Maladie de Crohn'
  }
  return { label: labels[regimen], value: regimen }
})

const submitData = async () => {
  try {
    await $fetch('/api/profile', {
      method: 'POST',
      body: {
        medicalData: {
          allergies: form.value.allergies,
          eating_disorders: form.value.eating_disorders,
          medical_regimen: form.value.medical_regimen
        }
      }
    })
  } catch (error) {
    console.error('Error updating medical data:', error)
  }
}

defineExpose({ submitData })
</script>

<template>
  <UPageCard
    variant="subtle"
    title="Données médicale"
  >
    <UFormField
      label="Allergies"
      name="allergies"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.allergies"
        :items="allergyOptions"
        multiple
        placeholder="Sélectionnez vos allergies"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>

    <UFormField
      label="Troubles alimentaires"
      name="eating_disorders"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.eating_disorders"
        :items="eatingDisorderOptions"
        multiple
        placeholder="Sélectionnez vos troubles alimentaires"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>

    <UFormField
      label="Régime médical"
      name="medical_regimen"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.medical_regimen"
        :items="medicalRegimenOptions"
        placeholder="Sélectionnez votre régime médical"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>
  </UPageCard>
</template>
