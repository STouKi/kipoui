<script setup lang="ts">
useSeoMeta({
  titleTemplate: 'Kipoui - Paramètres',
  title: 'Paramètres',
  description: 'Gérez votre profil'
})

const toast = useToast()

interface ComponentWithSubmit {
  submitData: () => Promise<void>
}
const basicInfoRef = ref<ComponentWithSubmit | null>(null)
const physicalDataRef = ref<ComponentWithSubmit | null>(null)
const preferencesRef = ref<ComponentWithSubmit | null>(null)
const habitsRef = ref<ComponentWithSubmit | null>(null)
const medicalDataRef = ref<ComponentWithSubmit | null>(null)
const goalsRef = ref<ComponentWithSubmit | null>(null)

const { data: profileData, refresh } = await useFetch('/api/profile')

const profile = ref(profileData.value?.profile || null)
const physicalData = ref(profileData.value?.physicalData || null)
const habits = ref(profileData.value?.habits || null)
const medicalData = ref(profileData.value?.medicalData || null)
const goals = ref(profileData.value?.goals || null)
const preferences = ref(profileData.value?.preferences || null)

const dummyState = reactive({})

watch(() => profileData.value, (newData) => {
  if (newData) {
    profile.value = newData.profile || null
    physicalData.value = newData.physicalData || null
    habits.value = newData.habits || null
    medicalData.value = newData.medicalData || null
    goals.value = newData.goals || null
    preferences.value = newData.preferences || null
  }
}, { deep: true })

async function onSubmit() {
  try {
    await basicInfoRef.value?.submitData()
    await physicalDataRef.value?.submitData()
    await preferencesRef.value?.submitData()
    await habitsRef.value?.submitData()
    await medicalDataRef.value?.submitData()
    await goalsRef.value?.submitData()

    toast.add({
      title: 'Modifications enregistrées',
      description: 'Toutes vos modifications ont été enregistrées avec succès',
      color: 'success'
    })

    refresh()
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
        orientation="horizontal"
      >
        <UButton
          form="settings"
          label="Enregistrer les modifications"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
        />
      </UPageCard>

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
    </div>
  </UForm>
</template>
