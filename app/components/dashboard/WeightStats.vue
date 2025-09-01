<script setup lang="ts">
import type { Period, Range } from '../../types/dashboard'
import { useWeightStore } from '~/stores/weight'
import type { WeightStats } from '~/stores/weight'
import { computed } from 'vue'
import { useUserStore } from '~/stores/user'

const props = defineProps<{
  period: Period
  range: Range
}>()

const store = useWeightStore()
const userStore = useUserStore()

async function fetchStats() {
  if (import.meta.server) return
  try {
    const stats = await $fetch<WeightStats>('/api/weight', {
      method: 'GET',
      params: { action: 'stats' }
    })
    store.setStats(stats)
  } catch (e) {
    console.error('Error fetching weight stats:', e)
  }
}

watch([() => props.period, () => props.range], () => {
  void fetchStats()
}, { immediate: true })

function fmt(value?: number) {
  if (value === undefined) return '-'
  return `${value.toFixed(1)} kg`
}

const bmi = computed(() => {
  const heightCm = userStore.userHeight
  const latest = store.stats?.latest ?? store.latestWeight
  if (!heightCm || !latest) return null
  const h = heightCm / 100
  return Math.round((latest / (h * h)) * 10) / 10
})

function fmtBmi(value: number | null) {
  if (value == null) return '-'
  return value.toFixed(1)
}

const bmiLabel = computed(() => {
  const v = bmi.value
  if (v == null) return '-'
  if (v < 16.5) return 'Dénutrition ou anorexie'
  if (v < 18.5) return 'Maigreur'
  if (v < 25) return 'Poids idéal'
  if (v < 30) return 'Surpoids'
  if (v < 35) return 'Obésité modérée'
  if (v < 40) return 'Obésité sévère'
  return 'Obésité morbide'
})

const bmiClass = computed(() => {
  const v = bmi.value
  if (v == null) return 'text-muted'
  if (v < 16.5) return 'text-gray-600 dark:text-gray-400'
  if (v < 18.5) return 'text-blue-600 dark:text-blue-400'
  if (v < 25) return 'text-green-600 dark:text-green-400'
  if (v < 30) return 'text-yellow-600 dark:text-yellow-400'
  if (v < 35) return 'text-orange-600 dark:text-orange-400'
  if (v < 40) return 'text-red-600 dark:text-red-400'
  return 'text-violet-600 dark:text-violet-400' // noir
})

const bmiBadgeClass = computed(() => {
  const v = bmi.value
  if (v == null) return 'bg-gray-600 dark:bg-gray-400'
  if (v < 16.5) return 'bg-gray-600 dark:bg-gray-400'
  if (v < 18.5) return 'bg-blue-600 dark:bg-blue-400'
  if (v < 25) return 'bg-green-600 dark:bg-green-400'
  if (v < 30) return 'bg-yellow-600 dark:bg-yellow-400'
  if (v < 35) return 'bg-orange-600 dark:bg-orange-400'
  if (v < 40) return 'bg-red-600 dark:bg-red-400'
  return 'bg-violet-600 dark:bg-violet-400'
})
</script>

<template>
  <UPageGrid class="lg:grid-cols-5 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      icon="i-lucide-gauge"
      title="Actuel"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ fmt(store.stats?.latest) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-trending-down"
      title="Minimum"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ fmt(store.stats?.min) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-trending-up"
      title="Maximum"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ fmt(store.stats?.max) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-sigma"
      title="Moyenne"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ fmt(store.stats?.average) }}
        </span>
      </div>
    </UPageCard>

    <UPageCard
      icon="i-lucide-activity"
      title="IMC"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase'
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1 relative"
    >
      <UPopover>
        <UButton
          icon="i-lucide-info"
          color="neutral"
          variant="subtle"
          class="absolute top-2 right-2"
        />
        <template #content>
          <div class="p-4 text-sm">
            <ul class="space-y-2">
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-gray-600 dark:bg-gray-400" />
                <span>Dénutrition ou anorexie: IMC &lt; 16,5</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                <span>Maigreur: 16,5 ≤ IMC &lt; 18,5</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-green-600 dark:bg-green-400" />
                <span>Poids idéal: 18,5 ≤ IMC &lt; 25</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-yellow-600 dark:bg-yellow-400" />
                <span>Surpoids: 25 ≤ IMC &lt; 30</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-orange-600 dark:bg-orange-400" />
                <span>Obésité modérée: 30 ≤ IMC &lt; 35</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-red-600 dark:bg-red-400" />
                <span>Obésité sévère: 35 ≤ IMC &lt; 40</span>
              </li>
              <li class="flex items-center gap-2">
                <span class="size-2 rounded-full bg-violet-600 dark:bg-violet-400" />
                <span>Obésité morbide: IMC ≥ 40</span>
              </li>
            </ul>
          </div>
        </template>
      </UPopover>
      <div class="flex gap-2">
        <div class="flex items-center gap-2">
          <span
            class="text-2xl font-semibold"
            :class="bmiClass"
          >
            {{ fmtBmi(bmi) }}
          </span>
        </div>
        <UBadge
          size="xl"
          :class="bmiBadgeClass"
        >
          {{ bmiLabel }}
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>
