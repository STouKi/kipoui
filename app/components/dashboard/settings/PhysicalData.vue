<script setup lang="ts">
import { z } from 'zod'
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date'
import type { Database } from '../../../../server/types/public'
import { Constants } from '../../../../server/types/public'

type PhysicalData = Database['public']['Tables']['physical_data']['Row']
type Gender = Database['public']['Enums']['gender']

const props = defineProps<{
  physicalData: PhysicalData | null
}>()

const df = new DateFormatter('fr-FR', {
  dateStyle: 'medium'
})

const birthDateModel = computed({
  get: () => {
    if (!form.value.birth_date) return null

    const date = new Date(form.value.birth_date)
    return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate())
  },
  set: (value) => {
    if (!value) {
      const today = new Date()
      form.value.birth_date = today.toISOString().split('T')[0]!
      return
    }

    const localDate = value.toDate(getLocalTimeZone())
    const year = localDate.getFullYear()
    const month = String(localDate.getMonth() + 1).padStart(2, '0')
    const day = String(localDate.getDate()).padStart(2, '0')
    form.value.birth_date = `${year}-${month}-${day}`
  }
})

const physicalDataSchema = z.object({
  gender: z.enum(['male', 'female'], { errorMap: () => ({ message: 'Veuillez sélectionner un genre' }) }),
  birth_date: z.string(),
  height_cm: z.number().positive('La taille doit être positive'),
  weight_kg: z.number().positive('Le poids doit être positif')
})

type PhysicalDataFormData = z.infer<typeof physicalDataSchema>

const form = ref<PhysicalDataFormData>({
  gender: props.physicalData?.gender as Gender,
  birth_date: props.physicalData?.birth_date || new Date().toISOString().split('T')[0]!,
  height_cm: props.physicalData?.height_cm || 0,
  weight_kg: props.physicalData?.weight_kg || 0
})

const { errors, validateForm, touchField } = useZodValidation(physicalDataSchema, form)

watch(() => props.physicalData, (newData) => {
  if (newData) {
    form.value = {
      gender: newData.gender as Gender,
      birth_date: newData.birth_date || new Date().toISOString().split('T')[0]!,
      height_cm: newData.height_cm || 0,
      weight_kg: newData.weight_kg || 0
    }
  }
}, { deep: true })

const genderOptions = Constants.public.Enums.gender.map((gender) => {
  const labels: Record<Gender, string> = {
    male: 'Homme',
    female: 'Femme'
  }
  return { label: labels[gender], value: gender }
})

const submitData = async () => {
  if (!validateForm()) {
    return Promise.reject(new Error('Validation failed'))
  }

  try {
    await $fetch('/api/profile/post', {
      method: 'POST',
      body: {
        physicalData: {
          gender: form.value.gender,
          birth_date: form.value.birth_date,
          height_cm: form.value.height_cm,
          weight_kg: form.value.weight_kg
        }
      }
    })
  } catch (error) {
    console.error('Error updating physical data:', error)
  }
}
defineExpose({ submitData })
</script>

<template>
  <UPageCard
    variant="subtle"
    title="Données physiques"
  >
    <UFormField
      required
      name="gender"
      label="Genre"
      :error="errors.gender"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <USelect
        v-model="form.gender"
        placeholder="Sélectionner un genre"
        :items="genderOptions"
        class="w-56"
        @focus="touchField('gender')"
      />
    </UFormField>
    <UFormField
      required
      name="birth_date"
      label="Date de naissance"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UPopover>
        <UButton
          color="neutral"
          variant="subtle"
          icon="i-lucide-calendar"
          class="w-56"
        >
          {{ birthDateModel ? df.format(birthDateModel.toDate(getLocalTimeZone())) : 'Sélectionner une date' }}
        </UButton>

        <template #content>
          <UCalendar
            v-model="birthDateModel"
            class="p-2"
          />
        </template>
      </UPopover>
    </UFormField>

    <UFormField
      required
      name="height_cm"
      label="Taille (cm)"
      :error="errors.height_cm"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UInput
        v-model.number="form.height_cm"
        type="number"
        placeholder="Votre taille en cm"
        class="w-56"
        @focus="touchField('height_cm')"
      />
    </UFormField>

    <UFormField
      required
      name="weight_kg"
      label="Poids (kg)"
      :error="errors.weight_kg"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <UInput
        v-model.number="form.weight_kg"
        type="number"
        placeholder="Votre poids en kg"
        class="w-56"
        @focus="touchField('weight_kg')"
      />
    </UFormField>
  </UPageCard>
</template>
