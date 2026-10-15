import { ref, watch } from 'vue'
import { api } from '@/lib/api'
import { session } from '@/lib/session'
import type { WeightRecord } from '@/lib/types'

// Oldest first, as the API returns them
const records = ref<WeightRecord[]>([])
const loaded = ref(false)

watch(session, (value) => {
  if (!value) {
    records.value = []
    loaded.value = false
  }
})

export function useWeights() {
  async function loadWeights() {
    records.value = await api<WeightRecord[]>('/api/weight', { query: { action: 'list' } })
    loaded.value = true
  }

  async function addWeight(kg: number) {
    const record = await api<WeightRecord>('/api/weight', {
      method: 'POST',
      query: { action: 'add' },
      body: { weight_kg: kg }
    })
    records.value = [...records.value, record]
  }

  async function deleteWeight(id: string) {
    await api(`/api/weight/${id}`, { method: 'DELETE' })
    records.value = records.value.filter(record => record.id !== id)
  }

  return { records, loaded, loadWeights, addWeight, deleteWeight }
}
