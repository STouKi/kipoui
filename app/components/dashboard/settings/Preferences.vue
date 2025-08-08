<script setup lang="ts">
import type { Database } from '../../../../server/types/public'

type Preferences = Database['public']['Tables']['preferences']['Row']

const props = defineProps<{
  preferences: Preferences | null
  loading?: boolean
}>()

const form = ref({
  dislikes: props.preferences?.dislikes || [] as string[]
})

watch(() => props.preferences, (newData) => {
  if (newData) {
    form.value = {
      dislikes: newData.dislikes || []
    }
  }
}, { deep: true })

const newDislike = ref('')

const addDislike = () => {
  if (newDislike.value.trim() && !form.value.dislikes.includes(newDislike.value.trim())) {
    form.value.dislikes.push(newDislike.value.trim())
    newDislike.value = ''
  }
}

const removeDislike = (index: number) => {
  form.value.dislikes.splice(index, 1)
}

const userStore = useUserStore()

const submitData = async () => {
  try {
    const preferences = {
      dislikes: form.value.dislikes
    }

    await $fetch('/api/profile/update', {
      method: 'POST',
      body: {
        preferences
      }
    })

    await userStore.updatePreferences(preferences)
  } catch (error) {
    console.error('Error updating preferences:', error)
    throw error
  }
}

defineExpose({ submitData })
</script>

<template>
  <UPageCard
    variant="subtle"
    title="Préférences"
  >
    <UFormField
      label="Aliments que vous n'aimez pas"
      name="dislikes"
      class="flex max-sm:flex-col justify-between items-start sm:items-center gap-4"
    >
      <div class="flex flex-col gap-2">
        <div class="flex items-center gap-2">
          <UInput
            v-model="newDislike"
            placeholder="Ajouter un aliment"
            :disabled="loading"
            @keyup.enter="addDislike"
          />
          <UButton
            icon="i-lucide-plus"
            color="primary"
            :disabled="loading || !newDislike.trim()"
            aria-label="Ajouter un aliment"
            @click="addDislike"
          />
        </div>

        <UBadge
          v-for="(dislike, index) in form.dislikes"
          :key="index"
          color="neutral"
          variant="soft"
          class="px-2 py-1 flex justify-between"
        >
          {{ dislike }}
          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            class="ml-1"
            :disabled="loading"
            aria-label="Supprimer l'aliment"
            @click="removeDislike(index)"
          />
        </UBadge>
      </div>
    </UFormField>
  </UPageCard>
</template>
