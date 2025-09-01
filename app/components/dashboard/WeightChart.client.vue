<script setup lang="ts">
import { format, startOfDay, endOfDay } from 'date-fns'
import { fr } from 'date-fns/locale'
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import { CurveType } from '@unovis/ts'
import type { Period, Range } from '../../types/dashboard'
import { useWeightStore } from '~/stores/weight'

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')

const props = defineProps<{
  period: Period
  range: Range
}>()

type DataRecord = {
  date: Date
  amount: number
}

const { width } = useElementSize(cardRef)

const store = useWeightStore()

const data = ref<DataRecord[]>([])

async function fetchRecords() {
  if (import.meta.server) return
  try {
    store.setLoading(true)
    const records = await $fetch<ReturnType<typeof useWeightStore>['records']>('/api/weight', {
      method: 'GET',
      params: {
        action: 'list',
        startDate: startOfDay(props.range.start).toISOString(),
        endDate: endOfDay(props.range.end).toISOString()
      }
    })
    store.setRecords(records)
  } catch (e) {
    console.error('Error fetching weight records:', e)
  } finally {
    store.setLoading(false)
  }
}

watch([() => props.period, () => props.range], async () => {
  // Ensure records fetched for current range before computing
  if (!import.meta.server) {
    await fetchRecords()
  }
  // Connect only the recorded points (no zero fill), sorted by date
  data.value = store.records
    .filter(r => typeof r.weight_kg === 'number' && !Number.isNaN(r.weight_kg))
    .map(r => ({ date: new Date(r.recorded_at), amount: r.weight_kg as number }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
}, { immediate: true })

const x = (_: DataRecord, i: number) => i
const y = (d: DataRecord) => d.amount

const latest = computed(() => store.latestWeight ?? 0)
const formatNumber = (n: number) => `${n.toFixed(1)} kg`

const formatDate = (date: Date): string => {
  return ({
    daily: format(date, 'd MMM', { locale: fr }),
    weekly: format(date, 'd MMM', { locale: fr }),
    monthly: format(date, 'MMM yyyy', { locale: fr })
  })[props.period]
}

const xTicks = (i: number) => {
  if (i === 0 || i === data.value.length - 1 || !data.value[i]) return ''
  return formatDate(data.value[i].date)
}

const template = (d: DataRecord) => `${formatDate(d.date)}: ${formatNumber(d.amount)}`

// Keep y-scale tight around data to avoid auto-including 0 (which flattens small variations)
const yDomain = computed<[number, number] | undefined>(() => {
  if (!data.value.length) return undefined
  const ys = data.value.map(d => d.amount)
  const min = Math.min(...ys)
  const max = Math.max(...ys)
  if (min === max) {
    const pad = min === 0 ? 1 : Math.abs(min) * 0.05
    return [min - pad, max + pad]
  }
  const pad = (max - min) * 0.1
  return [min - pad, max + pad]
})
</script>

<template>
  <UCard
    ref="cardRef"
    :ui="{ root: 'overflow-visible', body: '!px-0 !pt-0 !pb-3' }"
  >
    <template #header>
      <div>
        <p class="text-xs text-muted uppercase mb-1.5">
          Poids
        </p>
        <p class="text-3xl text-highlighted font-semibold">
          {{ formatNumber(latest) }}
        </p>
      </div>
    </template>

    <VisXYContainer
      :data="data"
      :padding="{ top: 40 }"
      class="h-96"
      :width="width"
      :y-domain="yDomain"
    >
      <VisLine
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :curve-type="CurveType.Linear"
      />
      <VisArea
        :x="x"
        :y="y"
        color="var(--ui-primary)"
        :opacity="0.1"
        :curve-type="CurveType.Linear"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-format="xTicks"
      />

      <VisCrosshair
        color="var(--ui-primary)"
        :template="template"
      />

      <VisTooltip />
    </VisXYContainer>
  </UCard>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--ui-primary);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
