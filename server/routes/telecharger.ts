// The link for social media bios (kipoui.com/telecharger): iPhones open the app's App Store page,
// other devices the website, since the app only exists on iOS. `?c=<campaign>` names the channel
// in App Store Connect's campaigns (kipoui.com/telecharger?c=tiktok), `bio` without it. Never link
// it from a page: the prerender crawler would turn it into a static redirection
export default defineEventHandler((event) => {
  const userAgent = getRequestHeader(event, 'user-agent') ?? ''
  const query = getQuery(event).c
  const campaign = typeof query === 'string' && isCampaignName(query) ? query : 'bio'
  // The answer depends on the device: no cache may keep it
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store', 'Vary': 'User-Agent' })
  return sendRedirect(event, /iPhone|iPad|iPod/.test(userAgent) ? appStoreCampaignUrl(campaign) : '/', 302)
})
