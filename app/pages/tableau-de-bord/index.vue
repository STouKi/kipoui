<script setup lang="ts">
import { z } from 'zod'
import { sub } from 'date-fns'
import type { Period, Range } from '../../types/dashboard'
import { useWeightStore } from '~/stores/weight'
import type { WeightRecord as WeightRow } from '~/stores/weight'

definePageMeta({
  layout: 'dashboard'
})

// Stripe

const route = useRoute()

const { checkout } = route.query

const { stripe } = useClientStripe()
const supabaseUser = useSupabaseUser()
const userStore = useUserStore()

const checkoutProcessed = ref(false)
watchEffect(() => {
  if (stripe.value && checkout && !checkoutProcessed.value) {
    verifyCheckoutSession()
  }
})

async function verifyCheckoutSession() {
  checkoutProcessed.value = true
  const toast = useToast()

  try {
    const { data, error } = await useFetch('/api/stripe/verify-checkout-session', {
      query: { checkout }
    })

    if (error.value) {
      console.error('Erreur lors de la vérification du paiement:', error.value)
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la vérification de votre paiement',
        color: 'error'
      })
      return
    }

    if (data.value?.success) {
      if ('status' in data.value && data.value.status === 'completed') {
        if (supabaseUser.value) {
          await userStore.setUser(supabaseUser.value)
        }

        toast.add({
          title: 'Félicitations !',
          description: data.value.message,
          color: 'success'
        })
      } else if ('status' in data.value && data.value.status === 'cancelled') {
        toast.add({
          title: 'Information',
          description: data.value.message,
          color: 'info'
        })
      }
    } else if (data.value && 'error' in data.value) {
      toast.add({
        title: 'Erreur',
        description: data.value.error,
        color: 'error'
      })
    }

    await navigateTo({ path: route.path }, { replace: true })
  } catch (e) {
    console.error('Erreur inattendue lors de la vérification du paiement:', e)
    toast.add({
      title: 'Erreur',
      description: 'Une erreur inattendue est survenue lors de la vérification de votre paiement',
      color: 'error'
    })
  }
}

// Weight stats

const range = shallowRef<Range>({
  start: sub(new Date(), { days: 14 }),
  end: new Date()
})

const period = ref<Period>('daily')

const weightStore = useWeightStore()

const weightSchema = z.object({
  weight: z.string()
    .min(1, 'Le poids est requis')
    .refine((val) => {
      const num = parseFloat(val.replace(',', '.'))
      return !Number.isNaN(num) && num > 0
    }, 'Le poids doit être un nombre positif')
})

type WeightFormData = z.infer<typeof weightSchema>

const form = ref<WeightFormData>({ weight: '' })

const { errors, validateForm, touchField, resetValidation } = useZodValidation(weightSchema, form)
const isAdding = ref(false)
const addWeightModal = ref(false)

async function addWeightRecord() {
  if (import.meta.server) return
  const toast = useToast()

  try {
    isAdding.value = true
    if (!validateForm()) {
      touchField('weight')
      return
    }

    const input = form.value.weight
    if (input == null) return

    const record = await $fetch<WeightRow | null>('/api/weight', {
      method: 'POST',
      params: { action: 'add' },
      body: { weight_kg: input }
    })

    if (record && typeof record.weight_kg === 'number') {
      weightStore.addLocalRecord(record)
      range.value = { ...range.value }

      toast.add({
        title: 'Poids ajouté',
        description: `Nouveau poids: ${input} kg`,
        color: 'success'
      })
      addWeightModal.value = false
      form.value.weight = ''
      resetValidation()
    }
  } catch (e) {
    console.error('Erreur lors de l\'ajout du poids:', e)
    toast.add({
      title: 'Erreur',
      description: 'Impossible d\'ajouter le poids, réessayez.',
      color: 'error'
    })
  } finally {
    isAdding.value = false
  }
}
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar
        title="Tableau de bord"
        :ui="{ right: 'gap-3' }"
      >
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UModal
            v-model:open="addWeightModal"
            title="Ajoutez votre nouveau poids"
          >
            <UButton
              icon="i-lucide-plus"
              size="md"
            >
              Ajouter un nouveau poids
            </UButton>

            <template #body>
              <div class="flex items-start gap-4">
                <UFormField
                  :error="errors.weight"
                  class="w-full"
                >
                  <UInput
                    v-model="form.weight"
                    placeholder="Entrez votre poids (ex: 72,4)"
                    inputmode="decimal"
                    step="0.1"
                    class="w-full"
                    @blur="touchField('weight')"
                    @keyup.enter="addWeightRecord"
                  />
                </UFormField>

                <UButton
                  icon="i-lucide-plus"
                  size="md"
                  :loading="isAdding"
                  :disabled="isAdding"
                  @click="addWeightRecord"
                />
              </div>
            </template>
          </UModal>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <DashboardDateRangePicker
            v-model="range"
            class="-ms-1"
          />

          <DashboardPeriodSelect
            v-model="period"
            :range="range"
          />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <DashboardWeightStats
        :period="period"
        :range="range"
      />
      <DashboardWeightChart
        :period="period"
        :range="range"
      />
    </template>
  </UDashboardPanel>
</template>
