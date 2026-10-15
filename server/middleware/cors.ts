// The iOS app (mobile/) is served from capacitor://localhost and calls the API on APP_URL,
// so its requests are cross-origin. Requests from any other origin are left untouched.
const NATIVE_APP_ORIGIN = 'capacitor://localhost'

export default defineEventHandler((event) => {
  if (!event.path.startsWith('/api/') || getHeader(event, 'origin') !== NATIVE_APP_ORIGIN) {
    return
  }

  // h3 ignores its maxAge option: without this header, WebKit only caches a preflight
  // for 5 seconds and repeats the OPTIONS round trip before nearly every API call
  if (isPreflightRequest(event)) {
    setResponseHeader(event, 'access-control-max-age', '600')
  }

  // No allowHeaders: h3 then allows the headers the preflight asks for. Besides Authorization and
  // Content-Type, the AI SDK chat transport sends a User-Agent header that a fixed list would block
  handleCors(event, {
    origin: [NATIVE_APP_ORIGIN],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  })
})
