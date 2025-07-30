<script setup lang="ts">
import { z } from 'zod'
import type { Database } from '../../../../server/types/public'

type Profile = Database['public']['Tables']['profiles']['Row']

const props = defineProps<{
  profile: Profile | null
}>()

const fileRef = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const toast = useToast()

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement

  if (!input.files?.length) {
    return
  }

  const file = input.files[0]!

  const tempUrl = URL.createObjectURL(file)
  form.value.avatar_url = tempUrl

  isUploading.value = true

  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await $fetch('/api/profile/upload/avatar', {
      method: 'POST',
      body: formData
    })

    if (response.success) {
      form.value.avatar_url = response.avatarUrl
      toast.add({
        title: 'Avatar mis à jour',
        description: 'Votre avatar a été téléchargé avec succès',
        color: 'success'
      })
    }
  } catch (error) {
    console.error('Error uploading avatar:', error)
    toast.add({
      title: 'Erreur',
      description: error.message || 'Impossible de télécharger l\'avatar',
      color: 'error'
    })
  } finally {
    isUploading.value = false
  }
}

function onFileClick() {
  fileRef.value?.click()
}

const basicInfoSchema = z.object({
  username: z.string().min(2, 'Le nom d\'utilisateur doit contenir au moins 2 caractères'),
  full_name: z.string()
    .min(2, 'Le nom complet doit contenir au moins 2 caractères')
    .max(50, 'Le nom complet ne peut pas dépasser 50 caractères'),
  profile_detail: z.string().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
  avatar_url: z.string().optional()
})

type BasicInfoFormData = z.infer<typeof basicInfoSchema>

const form = ref<BasicInfoFormData>({
  username: props.profile?.username || '',
  full_name: props.profile?.full_name || '',
  profile_detail: props.profile?.profile_detail || '',
  avatar_url: props.profile?.avatar_url || ''
})

const { errors, validateForm, touchField } = useZodValidation(basicInfoSchema, form)

watch(() => props.profile, (newData) => {
  if (newData) {
    form.value = {
      username: newData.username || '',
      full_name: newData.full_name || '',
      profile_detail: newData.profile_detail || '',
      avatar_url: newData.avatar_url || ''
    }
  }
}, { deep: true })

const submitData = async () => {
  if (!validateForm()) {
    return Promise.reject(new Error('Validation failed'))
  }

  try {
    await $fetch('/api/profile/post', {
      method: 'POST',
      body: {
        profile: {
          username: form.value.username,
          full_name: form.value.full_name,
          profile_detail: form.value.profile_detail,
          // L'avatar_url est déjà mis à jour lors du téléchargement
          // Ne pas inclure l'URL temporaire si elle n'a pas été téléchargée
          ...(form.value.avatar_url && !form.value.avatar_url.startsWith('blob:') && {
            avatar_url: form.value.avatar_url
          })
        }
      }
    })
  } catch (error) {
    console.error('Error updating profile:', error)
  }
}

defineExpose({ submitData })
</script>

<template>
  <UPageCard variant="subtle">
    <UFormField
      name="full_name"
      label="Nom complet"
      description="Apparaîtra sur les reçus, les factures et autres communications."
      required
      class="flex flex-col gap-4"
      :error="errors.full_name"
    >
      <UInput
        v-model="form.full_name"
        autocomplete="off"
        :color="errors.full_name ? 'error' : undefined"
        class="w-56"
        @focus="touchField('full_name')"
      />
    </UFormField>
    <USeparator />
    <UFormField
      name="username"
      label="Nom d'utilisateur"
      description="Votre nom d'utilisateur unique pour vous connecter et votre URL de profil."
      required
      class="flex flex-col gap-4"
      :error="errors.username"
    >
      <UInput
        v-model="form.username"
        autocomplete="off"
        :color="errors.username ? 'error' : undefined"
        class="w-56"
        @focus="touchField('username')"
      />
    </UFormField>
    <USeparator />
    <UFormField
      name="avatar"
      label="Avatar"
      description="JPG, GIF ou PNG. 1MB Max."
      class="flex max-sm:flex-col justify-between sm:items-center gap-4"
    >
      <div class="flex flex-wrap items-center gap-3">
        <UAvatar
          :src="form.avatar_url || ''"
          :alt="form.full_name || 'Avatar'"
          size="lg"
        />
        <UButton
          :label="isUploading ? 'Téléchargement...' : 'Choisir'"
          color="neutral"
          :loading="isUploading"
          :disabled="isUploading"
          @click="onFileClick"
        />
        <input
          ref="fileRef"
          type="file"
          class="hidden"
          accept=".jpg, .jpeg, .png, .gif"
          @change="onFileChange"
        >
      </div>
    </UFormField>
    <USeparator />
    <UFormField
      name="profile_detail"
      label="Raconte-nous ton parcours"
      description="C'est ici que tu peux nous dire ce que tu vis, ce que tu as traversé, ou ce qui t'a motivé(e) à demander de l'aide. Tout ce que tu partageras restera confidentiel et nous servira uniquement à mieux t'accompagner."
      class="flex flex-col gap-4"
      :ui="{ container: 'w-full' }"
      :error="errors.profile_detail"
    >
      <UTextarea
        v-model="form.profile_detail"
        :rows="5"
        autoresize
        class="w-full"
        :color="errors.profile_detail ? 'error' : undefined"
        @focus="touchField('profile_detail')"
      />
    </UFormField>
  </UPageCard>
</template>
