import { defineStore } from 'pinia'

export interface WeightRecord {
  id: string
  profile_id: string
  weight_kg: number
  recorded_at: string
}

export interface WeightStats {
  latest?: number
  min?: number
  max?: number
  average?: number
  count: number
}

interface WeightState {
  records: WeightRecord[]
  stats: WeightStats | null
  loading: boolean
  submitting: boolean
  deletingId: string | null
  initialized: boolean
}

export const useWeightStore = defineStore('weight', {
  state: (): WeightState => ({
    records: [],
    stats: null,
    loading: false,
    submitting: false,
    deletingId: null,
    initialized: false
  }),

  getters: {
    hasData: state => state.records.length > 0,
    sortedRecords: state => [...state.records].sort((a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()),
    latestWeight: state => state.records.length ? state.records[state.records.length - 1]?.weight_kg : undefined
  },

  actions: {
    reset() {
      this.records = []
      this.stats = null
      this.loading = false
      this.submitting = false
      this.deletingId = null
      this.initialized = false
    },

    setInitialized(v: boolean) {
      this.initialized = v
    },

    setLoading(v: boolean) {
      this.loading = v
    },

    setSubmitting(v: boolean) {
      this.submitting = v
    },

    setDeleting(id: string | null) {
      this.deletingId = id
    },

    setRecords(list: WeightRecord[]) {
      this.records = list
    },

    addLocalRecord(rec: WeightRecord) {
      this.records.push(rec)
    },

    removeLocalRecord(id: string) {
      this.records = this.records.filter(r => r.id !== id)
    },

    setStats(stats: WeightStats | null) {
      this.stats = stats
    }
  }
})
