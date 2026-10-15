<script setup lang="ts">
import { computed } from 'vue'
import { formatWeight } from '@/lib/format'

const props = defineProps<{
  // Oldest first
  points: { date: Date, kg: number }[]
  from: Date
  to: Date
}>()

const WIDTH = 340
const HEIGHT = 186
const LEFT = 30
const RIGHT = 8
const TOP = 10
const BOTTOM = 150

const range = computed(() => {
  const values = props.points.map(point => point.kg)
  let min = Math.floor(Math.min(...values))
  let max = Math.ceil(Math.max(...values))
  // An almost flat curve keeps some room above and below
  if (max - min < 2) {
    min -= 1
    max += 1
  }
  return { min, max }
})

function x(date: Date) {
  const span = props.to.getTime() - props.from.getTime()
  return LEFT + ((date.getTime() - props.from.getTime()) / span) * (WIDTH - LEFT - RIGHT)
}

function y(kg: number) {
  const { min, max } = range.value
  return TOP + ((max - kg) / (max - min)) * (BOTTOM - TOP)
}

const coordinates = computed(() => props.points.map(point => `${x(point.date).toFixed(1)},${y(point.kg).toFixed(1)}`))
const line = computed(() => coordinates.value.join(' '))
const area = computed(() => {
  const first = props.points[0]
  const last = props.points.at(-1)
  if (!first || !last || props.points.length < 2) return ''
  return `M${x(first.date).toFixed(1)},${BOTTOM} L${coordinates.value.join(' L')} L${x(last.date).toFixed(1)},${BOTTOM} Z`
})
const last = computed(() => props.points.at(-1))

const gridValues = computed(() => {
  const { min, max } = range.value
  return [max, (min + max) / 2, min]
})

// Over a year, the axis shows months
const axisFormat = computed(() => props.to.getTime() - props.from.getTime() > 180 * 24 * 60 * 60 * 1000
  ? new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' })
  : new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }))

const axisLabels = computed(() => {
  const middle = new Date((props.from.getTime() + props.to.getTime()) / 2)
  return [
    { date: props.from, x: LEFT, anchor: 'start' },
    { date: middle, x: (LEFT + WIDTH - RIGHT) / 2, anchor: 'middle' },
    { date: props.to, x: WIDTH - RIGHT, anchor: 'end' }
  ].map(label => ({ ...label, text: axisFormat.value.format(label.date) }))
})

const description = computed(() => {
  const first = props.points[0]
  const end = last.value
  if (!first || !end) return ''
  return `Courbe du poids, de ${formatWeight(first.kg)} kg à ${formatWeight(end.kg)} kg`
})

function formatGridValue(kg: number) {
  return Number.isInteger(kg) ? String(kg) : formatWeight(kg)
}
</script>

<template>
  <svg
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    role="img"
    :aria-label="description"
    class="chart"
  >
    <g
      v-for="value in gridValues"
      :key="value"
    >
      <line
        :x1="LEFT"
        :x2="WIDTH - RIGHT"
        :y1="y(value)"
        :y2="y(value)"
        class="grid"
      />
      <text
        x="0"
        :y="y(value) + 4"
        class="label"
      >{{ formatGridValue(value) }}</text>
    </g>
    <path
      v-if="area"
      :d="area"
      class="area"
    />
    <polyline
      v-if="points.length > 1"
      :points="line"
      class="line"
    />
    <circle
      v-if="last"
      :cx="x(last.date)"
      :cy="y(last.kg)"
      r="5.5"
      class="dot"
    />
    <text
      v-for="label in axisLabels"
      :key="label.anchor"
      :x="label.x"
      :y="HEIGHT - 8"
      :text-anchor="label.anchor"
      class="label"
    >{{ label.text }}</text>
  </svg>
</template>

<style scoped>
.chart {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}

.grid {
  stroke: var(--kp-slate-200);
  stroke-width: 1;
}

.label {
  font-size: 12px;
  fill: var(--kp-slate-500);
}

.area {
  fill: var(--kp-green-100);
}

.line {
  fill: none;
  stroke: var(--kp-green-600);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.dot {
  fill: var(--kp-green-700);
  stroke: #ffffff;
  stroke-width: 2.5;
}
</style>
