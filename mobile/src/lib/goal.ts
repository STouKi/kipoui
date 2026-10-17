import { formatWeight } from './format'

const WEEK = 7 * 24 * 60 * 60 * 1000

// Beyond about 1 kg a week, a weight change is no longer considered healthy and lasting
export const FAST_WEEKLY_PACE = 1

// Kilos left from the current weight to the goal: "4,4 kg à perdre"
export function remainingToGoal(current: number, target: number) {
  const difference = Math.round((current - target) * 10) / 10
  if (difference === 0) return null
  return difference > 0
    ? `${formatWeight(difference)} kg à perdre`
    : `${formatWeight(-difference)} kg à prendre`
}

// Kilos a week needed to reach the goal by the deadline (a YYYY-MM-DD date), or null once it has
// passed or when the goal is reached
export function weeklyPace(current: number, target: number, deadline: string, now = new Date()) {
  const end = new Date(`${deadline}T23:59:59`)
  const weeks = (end.getTime() - now.getTime()) / WEEK
  const difference = Math.abs(current - target)
  if (weeks <= 0 || difference < 0.1) return null
  return Math.round((difference / Math.max(weeks, 1)) * 10) / 10
}
