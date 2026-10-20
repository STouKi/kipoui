import { Capacitor } from '@capacitor/core'
import { INTRO_ELIGIBILITY_STATUS, PACKAGE_TYPE, PURCHASES_ERROR_CODE, Purchases } from '@revenuecat/purchases-capacitor'
import type { PurchasesError, PurchasesPackage } from '@revenuecat/purchases-capacitor'
import { REVENUECAT_API_KEY } from './config'

// In-app subscriptions (App Store) through RevenueCat. The server learns about them from
// RevenueCat (server/lib/revenuecat.ts): the app never decides access itself

// The entitlement that opens the coach, set up in the RevenueCat dashboard
const ENTITLEMENT = 'coach'

// Apple's page of the user's subscriptions, which opens the App Store
export const MANAGE_SUBSCRIPTIONS_URL = 'https://apps.apple.com/account/subscriptions'

// The paywall can be previewed in the browser with fake offers (VITE_PURCHASES_MOCK=1, dev only)
const mock = import.meta.env.DEV && import.meta.env.VITE_PURCHASES_MOCK === '1'

// Purchases only exist in the iOS app, once RevenueCat is set up
export const purchasesAvailable = mock || (Capacitor.isNativePlatform() && !!REVENUECAT_API_KEY)

export interface Plan {
  package: PurchasesPackage | null
  kind: 'annual' | 'quarterly' | 'monthly'
  title: string
  // The billed amount, which Apple wants most visible: "166,99 €"
  price: string
  // "par an"
  period: string
  // "13,92 € par mois", for the longer periods
  perMonth: string | null
  // A free trial the user is still eligible to
  trialDays: number | null
  // Saving of the longer periods against the monthly price
  saving: number | null
}

let configured = false
let identifiedUser: string | null = null

// The RevenueCat customer is the Kipoui account: the Supabase user id, which the server receives
// in RevenueCat's notifications
export async function identifyPurchaser(userId: string | null) {
  if (mock || !purchasesAvailable) return
  if (!configured) {
    if (!userId) return
    await Purchases.configure({ apiKey: REVENUECAT_API_KEY, appUserID: userId })
    configured = true
    identifiedUser = userId
  } else if (userId && userId !== identifiedUser) {
    await Purchases.logIn({ appUserID: userId })
    identifiedUser = userId
  } else if (!userId && identifiedUser) {
    await Purchases.logOut()
    identifiedUser = null
  }
}

const KINDS = [
  { type: PACKAGE_TYPE.ANNUAL, kind: 'annual', title: 'Annuel', period: 'par an', months: 12 },
  { type: PACKAGE_TYPE.THREE_MONTH, kind: 'quarterly', title: 'Trimestriel', period: 'par trimestre', months: 3 },
  { type: PACKAGE_TYPE.MONTHLY, kind: 'monthly', title: 'Mensuel', period: 'par mois', months: 1 }
] as const

const DAYS_BY_UNIT: Record<string, number> = { DAY: 1, WEEK: 7, MONTH: 30, YEAR: 365 }

// The current offering's subscriptions, longest first, with the prices of the user's App Store
export async function loadPlans(): Promise<Plan[]> {
  if (mock) return mockPlans()

  const { current } = await Purchases.getOfferings()
  const packages = KINDS.flatMap((kind) => {
    const found = current?.availablePackages.find(item => item.packageType === kind.type)
    return found ? [{ kind, package: found }] : []
  })

  // Apple only grants a free trial once per subscription group
  const withTrial = packages.filter(item => item.package.product.introPrice?.price === 0)
  const eligibility = withTrial.length
    ? await Purchases.checkTrialOrIntroductoryPriceEligibility({ productIdentifiers: withTrial.map(item => item.package.product.identifier) })
    : {}

  const monthly = packages.find(item => item.kind.kind === 'monthly')?.package.product.price ?? null
  return packages.map(({ kind, package: item }) => {
    const { product } = item
    const intro = product.introPrice
    const eligible = eligibility[product.identifier]?.status
    const trial = intro?.price === 0
      && eligible !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_INELIGIBLE
      && eligible !== INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS
    return {
      package: item,
      kind: kind.kind,
      title: kind.title,
      price: product.priceString,
      period: kind.period,
      perMonth: kind.months > 1 && product.pricePerMonthString ? `${product.pricePerMonthString} par mois` : null,
      trialDays: trial && intro ? intro.periodNumberOfUnits * (DAYS_BY_UNIT[intro.periodUnit] ?? 1) : null,
      saving: kind.months > 1 && monthly ? Math.round((1 - product.price / kind.months / monthly) * 100) : null
    }
  })
}

// False when the user cancelled Apple's payment sheet
export async function purchase(plan: Plan) {
  if (mock) {
    await new Promise(resolve => setTimeout(resolve, 1200))
    return true
  }
  if (!plan.package) return false
  try {
    await Purchases.purchasePackage({ aPackage: plan.package })
    return true
  } catch (error) {
    const purchasesError = error as Partial<PurchasesError>
    if (purchasesError.userCancelled || purchasesError.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return false
    }
    throw error
  }
}

// After reinstalling the app or changing phone. True when a subscription was found
export async function restorePurchases() {
  if (mock) return false
  const { customerInfo } = await Purchases.restorePurchases()
  return !!customerInfo.entitlements.active[ENTITLEMENT]
}

function mockPlans(): Plan[] {
  return [
    { package: null, kind: 'annual', title: 'Annuel', price: '166,99 €', period: 'par an', perMonth: '13,92 € par mois', trialDays: null, saving: 54 },
    { package: null, kind: 'quarterly', title: 'Trimestriel', price: '53,99 €', period: 'par trimestre', perMonth: '18,00 € par mois', trialDays: null, saving: 40 },
    { package: null, kind: 'monthly', title: 'Mensuel', price: '29,99 €', period: 'par mois', perMonth: null, trialDays: 7, saving: null }
  ]
}
