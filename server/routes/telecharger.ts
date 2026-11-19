// The link for social media bios (kipoui.com/telecharger): iPhones open the app's App Store page,
// other devices the website, since the app only exists on iOS. Never link it from a page: the
// prerender crawler would turn it into a static redirection
export default defineEventHandler((event) => {
  const userAgent = getRequestHeader(event, 'user-agent') ?? ''
  // The answer depends on the device: no cache may keep it
  setResponseHeaders(event, { 'Cache-Control': 'private, no-store', 'Vary': 'User-Agent' })
  return sendRedirect(event, /iPhone|iPad|iPod/.test(userAgent) ? APP_STORE_URL : '/', 302)
})
