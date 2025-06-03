<script setup lang="ts">
import type { Database } from '../../../../server/types/supabase'
import { Constants } from '../../../../server/types/supabase'

type Habits = Database['public']['Tables']['habits']['Row']
type Diet = Database['public']['Enums']['diet']
type ReligiousRegime = Database['public']['Enums']['religious_regime']

const props = defineProps<{
  habits: Habits | null
  loading?: boolean
}>()

const isUpdating = ref(false)

const form = ref({
  diet: props.habits?.diet || undefined as Diet | undefined,
  religious_regime: props.habits?.religious_regime || undefined as ReligiousRegime | undefined,
  sport_week_frequency: props.habits?.sport_week_frequency || 0,
  compulsive_habits: props.habits?.compulsive_habits || false
})

watch(() => props.habits, (newData) => {
  if (newData) {
    form.value = {
      diet: newData.diet || undefined,
      religious_regime: newData.religious_regime || undefined,
      sport_week_frequency: newData.sport_week_frequency || 0,
      compulsive_habits: newData.compulsive_habits || false
    }
  }
}, { deep: true })

const dietOptions = Constants.public.Enums.diet.map((diet) => {
  const labels: Record<Diet, string> = {
    vegan: 'Végétalien',
    vegetarian: 'Végétarien',
    pescatarian: 'Pescatarian'
  }
  return { label: labels[diet], value: diet }
})

const religiousRegimeOptions = Constants.public.Enums.religious_regime.map((regime) => {
  const labels: Record<ReligiousRegime, string> = {
    halal: 'Halal',
    kasher: 'Kasher',
    buddhist: 'Bouddhiste',
    religious_fasting: 'Jeûne religieux'
  }
  return { label: labels[regime], value: regime }
})

const submitData = async () => {
  try {
    await $fetch('/api/profile', {
      method: 'POST',
      body: {
        habits: {
          diet: form.value.diet,
          religious_regime: form.value.religious_regime,
          sport_week_frequency: form.value.sport_week_frequency,
          compulsive_habits: form.value.compulsive_habits
        }
      }
    })
  } catch (error) {
    console.error('Error updating habits:', error)
  }
}

defineExpose({ submitData })
</script>

<template>
  <UPageCard
    variant="subtle"
    title="Habitudes"
  >
    <UFormField
      label="Régime alimentaire"
      name="diet"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.diet"
        :items="dietOptions"
        placeholder="Sélectionnez votre régime alimentaire"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>
    <UFormField
      label="Régime religieux"
      name="religious_regime"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.religious_regime"
        :items="religiousRegimeOptions"
        placeholder="Sélectionnez votre régime religieux"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>

    <UFormField
      label="Fréquence de sport"
      description="jour(s) par semaine"
      name="sport_week_frequency"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UInputNumber
        v-model="form.sport_week_frequency"
        :min="0"
        :max="7"
        :step="1"
        :disabled="loading || isUpdating"
        class="w-56"
      />
    </UFormField>

    <UFormField
      label="Habitudes compulsives"
      description="Grignotage, fringales, sucre..."
      name="compulsive_habits"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USwitch
        v-model="form.compulsive_habits"
        :disabled="loading || isUpdating"
      />
    </UFormField>
  </UPageCard>
</template>
