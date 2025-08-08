<script setup lang="ts">
useSeoMeta({
  titleTemplate: 'Kipoui - Paramètres',
  title: 'Paramètres',
  description: 'Gérez votre profil'
})

const toast = useToast()
const userStore = useUserStore()

const {
  profile,
  physicalData,
  habits,
  medicalData,
  goals,
  preferences
} = storeToRefs(userStore)

interface ComponentWithSubmit {
  submitData: () => Promise<void>
}
const basicInfoRef = ref<ComponentWithSubmit | null>(null)
const physicalDataRef = ref<ComponentWithSubmit | null>(null)
const preferencesRef = ref<ComponentWithSubmit | null>(null)
const habitsRef = ref<ComponentWithSubmit | null>(null)
const medicalDataRef = ref<ComponentWithSubmit | null>(null)
const goalsRef = ref<ComponentWithSubmit | null>(null)

const dummyState = reactive({})

const onSubmit = async () => {
  try {
    await Promise.all([
      basicInfoRef.value?.submitData(),
      physicalDataRef.value?.submitData(),
      preferencesRef.value?.submitData(),
      habitsRef.value?.submitData(),
      medicalDataRef.value?.submitData(),
      goalsRef.value?.submitData()
    ])

    toast.add({
      title: 'Modifications enregistrées',
      description: 'Toutes vos modifications ont été enregistrées avec succès',
      color: 'success'
    })
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Une erreur est survenue lors de l\'enregistrement des modifications',
      color: 'error'
    })
  }
}
</script>

<template>
  <UForm
    id="settings"
    class="w-full"
    :state="dummyState"
    @submit="onSubmit"
  >
    <div class="flex flex-col gap-4">
      <UPageCard
        title="Profil"
        variant="naked"
      />

      <DashboardSettingsBasicInfo
        ref="basicInfoRef"
        :profile="profile"
      />

      <DashboardSettingsPhysicalData
        ref="physicalDataRef"
        :physical-data="physicalData"
      />

      <DashboardSettingsGoals
        ref="goalsRef"
        :goals="goals"
      />

      <DashboardSettingsHabits
        ref="habitsRef"
        :habits="habits"
      />

      <DashboardSettingsMedicalData
        ref="medicalDataRef"
        :medical-data="medicalData"
      />

      <DashboardSettingsPreferences
        ref="preferencesRef"
        :preferences="preferences"
      />

      <UPageCard variant="naked">
        <UButton
          form="settings"
          label="Enregistrer les modifications"
          color="neutral"
          type="submit"
          class="w-full sm:w-fit sm:ms-auto"
        />
      </UPageCard>
    </div>
  </UForm>
</template>
