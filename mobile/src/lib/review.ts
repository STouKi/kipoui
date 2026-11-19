import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'
import { AppReview } from '@capawesome/capacitor-app-review'

// Apple's rating prompt, asked at a happy moment: once the coach has commented the 3rd, 10th and
// 30th meal saved on this device. iOS shows it 3 times a year at most, decides whether it appears,
// and never shows it in TestFlight builds
const MILESTONES = [3, 10, 30]
const COUNT_KEY = 'review.savedMeals'
// Leaves the user time to read the coach's comment first
const DELAY_MS = 2500

// Counts a saved meal; true when it reaches a milestone
export async function countSavedMeal() {
  const { value } = await Preferences.get({ key: COUNT_KEY })
  const count = (Number(value) || 0) + 1
  await Preferences.set({ key: COUNT_KEY, value: String(count) })
  return MILESTONES.includes(count)
}

export function requestReviewSoon() {
  if (!Capacitor.isNativePlatform()) return
  setTimeout(() => {
    AppReview.requestReview().catch(() => {})
  }, DELAY_MS)
}
