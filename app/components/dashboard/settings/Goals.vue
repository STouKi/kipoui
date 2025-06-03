<script setup lang="ts">
import { z } from 'zod'

import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { Database } from '../../../../server/types/supabase'

type Goals = Database['public']['Tables']['goals']['Row']

const props = defineProps<{
  goals: Goals | null
}>()

const df = new DateFormatter('fr-FR', {
  dateStyle: 'medium'
})

const deadlineModel = computed({
  get: () => {
    if (!form.value.deadline) return undefined

    const date = new Date(form.value.deadline)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set: (value) => {
    if (!value) {
      form.value.deadline = undefined
      return
    }

    const localDate = value.toDate(getLocalTimeZone())
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    form.value.deadline = `${year}-${month}-${day}`
  }
})

const goalsSchema = z.object({
  target_weight: z.number().positive('Le poids cible doit être positif'),
  deadline: z.string().optional()
})

type GoalsFormData = z.infer<typeof goalsSchema>

const form = ref<GoalsFormData>({
  target_weight: props.goals?.target_weight || 0,
  deadline: props.goals?.deadline || undefined
})

const { errors, validateForm, touchField } = useZodValidation(goalsSchema, form)

watch(() => props.goals, (newData) => {
  if (newData) {
    form.value = {
      target_weight: newData.target_weight || 0,
      deadline: newData.deadline || undefined
    }
  }
}, { deep: true })

const submitData = async () => {
  if (!validateForm()) {
    return Promise.reject(new Error('Validation failed'))
  }

  try {
    await $fetch('/api/profile', {
      method: 'POST',
      body: {
        goals: {
          target_weight: form.value.target_weight,
          deadline: form.value.deadline
        }
      }
    })
  } catch (error) {
    console.error('Error updating goals:', error)
  }
}

defineExpose({ submitData })
</script>

<template>
  <UPageCard
    variant="subtle"
    title="Objectif"
  >
    <UFormField
      required
      name="target_weight"
      label="Poids cible (kg)"
      :error="errors.target_weight"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UInput
        v-model.number="form.target_weight"
        type="number"
        placeholder="Votre poids cible en kg"
        class="w-56"
        @focus="touchField('target_weight')"
      />
    </UFormField>
    <UFormField
      name="deadline"
      label="Date limite"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UPopover>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-calendar"
          class="w-56"
        >
          {{ deadlineModel ? df.format(deadlineModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
        </UButton>

        <template #content>
          <UCalendar
            v-model="deadlineModel"
            class="p-2"
            @focus="touchField('deadline')"
          />
        </template>
      </UPopover>
    </UFormField>
  </UPageCard>
</template>
