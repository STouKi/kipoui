const DAY = 24 * 60 * 60 * 1000

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Whole days between the date and today (0 for today, 1 for yesterday)
export function daysAgo(date: Date, now = new Date()) {
  return Math.round((startOfDay(now).getTime() - startOfDay(date).getTime()) / DAY)
}

const time = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' })
const weekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'long' })
const dayMonth = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })
const dayMonthYear = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

// Conversation list, like iOS Messages: 19:42, Hier, Lundi, 12 oct., 12 oct. 2025
export function formatListDate(value: string) {
  const date = new Date(value)
  const days = daysAgo(date)
  if (days <= 0) return time.format(date)
  if (days === 1) return 'Hier'
  if (days < 7) return capitalize(weekday.format(date))
  if (date.getFullYear() === new Date().getFullYear()) return dayMonth.format(date)
  return dayMonthYear.format(date)
}

// Weigh-ins: Aujourd'hui, Hier, lun. 12 oct.
export function formatDay(value: string) {
  const date = new Date(value)
  const days = daysAgo(date)
  if (days <= 0) return 'Aujourd\'hui'
  if (days === 1) return 'Hier'
  return capitalize(shortDay.format(date))
}

// Goal deadline (a YYYY-MM-DD date): 31 déc., or 31 déc. 2027 in another year
export function formatDeadline(value: string) {
  const date = new Date(`${value}T00:00:00`)
  return date.getFullYear() === new Date().getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date)
}

// Chart axis: 15 sept.
export function formatAxisDate(date: Date) {
  return dayMonth.format(date)
}

const weightFormat = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

// 72,4 or 68
export function formatWeight(kg: number) {
  return weightFormat.format(kg)
}

// −1,2 kg or +0,8 kg, with a real minus sign
export function formatWeightChange(kg: number) {
  const sign = kg < 0 ? '−' : '+'
  return `${sign}${weightFormat.format(Math.abs(kg))} kg`
}

// "72,4" or "72.4" typed by the user
export function parseWeight(input: string) {
  const value = Number.parseFloat(input.replace(',', '.').trim())
  return Number.isFinite(value) ? value : null
}
