// The iOS app on the App Store (its Apple ID in App Store Connect), linked from the website
export const APP_STORE_ID = '6824597005'
export const APP_STORE_URL = `https://apps.apple.com/fr/app/kipoui/id${APP_STORE_ID}`
// Our App Store Connect provider token: campaign links carry it so that App Store Connect
// (Analyses > Acquisition > Campagnes) counts the views and downloads of each campaign
const APP_STORE_PROVIDER_TOKEN = '129642123'

// Campaign names: lowercase letters, digits and dashes, 30 characters at most (App Store limit)
export const isCampaignName = (name: string) => /^[a-z0-9-]{1,30}$/.test(name)

// The App Store link of a campaign (`site`, `tiktok`, a creator's name...), in Apple's format
export const appStoreCampaignUrl = (campaign: string) =>
  `https://apps.apple.com/app/apple-store/id${APP_STORE_ID}?pt=${APP_STORE_PROVIDER_TOKEN}&ct=${campaign}&mt=8`
