# AGENTS.md

This file provides guidance to AI coding agents (Codex, Claude Code...) when working with code in this repository.

This is the single context file: `CLAUDE.md` only imports it for Claude Code. Edit this file, never `CLAUDE.md`.

## Commands

```bash
bun run dev          # Start dev server
bun run build        # Build for production
bun run generate     # Static site generation
bun run preview      # Preview production build
bun run lint         # ESLint
bun run typecheck    # TypeScript type checking (vue-tsc)
```

Package manager: **bun** (not npm/pnpm).

Stripe webhooks in local dev: log the Stripe CLI into the test environment of the local key (never the live account), then run

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook --events customer.subscription.created,customer.subscription.updated,customer.subscription.deleted,customer.subscription.paused,customer.subscription.resumed,invoice.payment_failed
```

Recent CLI versions require `--events`. Give the dev server the `whsec_...` secret it prints as `STRIPE_WEBHOOK_SECRET` (it stays the same from one session to the next on a machine).

## Architecture

**Kipoui** is a French-language AI nutrition coaching SaaS built with **Nuxt 4** (compatibility version 4, `app/` directory structure).

### Stack
- **Frontend**: Nuxt 4, Vue 3, @nuxt/ui (Tailwind-based), Pinia, VueUse
- **Backend**: Nitro server routes (in `server/api/`)
- **Database**: Supabase (Postgres + auth). Two schemas: `public` (main data) and `vecs` (embeddings/RAG)
- **AI**: Vercel AI SDK v6 (`ai` package). Primary model: Groq `openai/gpt-oss-120b` (via `@ai-sdk/groq`). Falls back to Anthropic `claude-sonnet-5` for PDF analysis. Embeddings via OpenAI `text-embedding-3-small`
- **Analytics**: Vercel Analytics via `@vercel/analytics` Nuxt module (in `nuxt.config.ts` modules array)
- **Payments**: Stripe (via `@unlok-co/nuxt-stripe`)
- **Deployment**: Vercel (via GitHub integration). Domain: `kipoui.com` — DNS at OVH (not Vercel nameservers). OVH email configured (MX + SPF + DKIM) — ne jamais migrer vers les NS Vercel, ne pas toucher ces records DNS.

### Key architectural patterns

**Server repositories** (`server/repositories/`): All DB access goes through typed repository files — `chatRepository`, `profileRepository`, `messageRepository`, `weightRepository`, etc. Server routes call repositories, not Supabase directly.

**Auth**: `requireAuth(event)` from `server/repositories/supabaseRepository.ts` gates all protected API routes. It accepts either the Supabase SSR cookies (web) or an `Authorization: Bearer <access token>` header (native app): with a Bearer token, `getPublicSupabaseClient`/`getVecsSupabaseClient` return a client carrying it, so queries still run under RLS. Client-side auth state lives in `app/stores/user.ts` (Pinia), initialized by `app/plugins/user.client.ts` and `app/plugins/user.server.ts`. The server plugin wraps `useSupabaseUser()` in try/catch to avoid prerender 500 errors when Supabase env vars are missing at build time.

**User store** (`app/stores/user.ts`): Central store holding the full user profile tree — `profile`, `physicalData`, `habits`, `medicalData`, `goals`, `preferences`, `customer`. Populated by `/api/profile/get` on init.

**AI chat flow** (`server/api/chats/[id].post.ts`):
1. Auth + AI consent check (403 without `user_metadata.ai_consent_at`) + full profile fetch + subscription check (403 without an active subscription: the website's overlay alone doesn't stop direct API calls) → system prompt generation. The last user message is saved from its text part (UI messages have no `content` since AI SDK 5), with its data URL attachments uploaded like `/api/chats/post` does; a regenerate doesn't save it again
2. Title auto-generation via Groq `openai/gpt-oss-20b` (first message only, `reasoningEffort: 'low'`). A failure falls back to the start of the message and never blocks the chat
3. Image attachments analyzed via Groq vision model `qwen/qwen3.8-27b` using `generateText` before being passed as text
4. PDF attachments → switches to Anthropic `claude-sonnet-5` (`maxOutputTokens: 8192`)
5. Default path: `openai/gpt-oss-120b` via `createGroq({ apiKey })`. `maxOutputTokens: 4096`. Groq has native tool calling — no middleware needed. Tools: `exaSearch`, `addResource`, `getInformation`, `logWeight`
6. Live-info keywords in message trigger forced `exaSearch` tool on first step via `prepareStep`. Otherwise `prepareStep` returns `{}` (auto tool choice).

Note: `convertToModelMessages()` is async in AI SDK v6 — always `await` it.

Attachments arrive as data URLs, which AI SDK v6 tries to download and refuses (it only downloads http(s)): pass their base64 content (`toInlineData()` in the route). Attachments of earlier messages are replaced by a text mention before `convertToModelMessages()`. Groq retires models regularly (`llama-3.1-8b-instant` and `llama-4-scout` were shut down in 2026): when a model call fails with "does not exist", check https://console.groq.com/docs/deprecations.

**RAG tools** (`server/lib/ai/tools/`): `addResource` saves content + embeddings to Supabase `vecs` schema; `getInformation` queries via `match_documents` RPC with similarity threshold **0.3** (lowered from 0.5 to catch semantically distant but relevant entries).

**logWeight tool** (`server/lib/ai/tools/logWeight.ts`): Records user weight after explicit confirmation. Updates both `weight_records` table (historical graph) and `physical_data.weight_kg` (used in system prompt) via `Promise.all`. Never called without explicit user confirmation. Weigh-ins added from the dashboard or the app (`/api/weight?action=add`) update both the same way.

**AI consent**: explicit consent to send profile data (including health and religious diet data) and messages to the AI providers, required by the GDPR (art. 9) and App Store guideline 5.1.2(i). Stored in Supabase Auth `user_metadata.ai_consent_at` (no DB column), read and written through `useAiConsent()`. Given at signup (`inscription.vue` checkbox) or through `AiConsentOverlay` in the chat layout, withdrawn in Paramètres > Sécurité. Legal pages: `/conditions-utilisation`, `/confidentialite` and `/contact` (the App Store support URL).

**Subscriptions** (Stripe): access means `subscription_status` is `'active'` or `'trialing'` (`hasActiveSubscription` in the user store). Statuses come from Stripe through `toSubscriptionStatus()` (`stripeRepository.ts`): written right after checkout by `verify-checkout-session` and kept up to date by `webhook.ts`. The webhook has no user session, so RLS would hide every customer: after checking the Stripe signature it calls `actAsServiceRole(event)` and the repositories use the service role for that request. A trial ending without a payment method pauses the subscription (`'paused'` → `'waiting_payment'`). Beta testers are activated by hand (`'active'` without a Stripe subscription): no Stripe event touches them. Customers manage their subscription (payment method, invoices, cancellation, resuming a trial paused without payment method) in the Stripe customer portal: `create-portal-session.post.ts` + `useBillingPortal()`, opened from Paramètres > Abonnement and from the subscription overlay, website only. Webhook events to enable in Stripe: `customer.subscription.created`, `.updated`, `.deleted`, `.paused`, `.resumed` and `invoice.payment_failed`.

**Account deletion** (`server/api/account/delete.ts`): deletes the Stripe customer first (cancels its subscription right away; if Stripe fails, the account is kept), then the user's avatars in Storage (`avatars/<user id>-<uuid>.<ext>`), then the auth user. Database rows follow through `ON DELETE CASCADE`: any new table linked to a user needs it too.

**Client chat** (`app/pages/chat/[id].vue`): Uses `@ai-sdk/vue` `Chat` class with `DefaultChatTransport`. Messages rendered with `@nuxtjs/mdc` for markdown streaming.

### Routing
Pages are in French: `/connexion`, `/inscription`, `/tableau-de-bord`, `/tarifs`, etc. Supabase redirects unauthenticated users to `/connexion`, except on the paths of `supabase.redirectOptions.exclude` in `nuxt.config.ts`: they match exactly unless they end with `*`, and a public page missing there is prerendered as a redirection to `/connexion` (blog posts were, until `/blog/*` was added).

Pages for the iOS app live under `/app/` (`layout: false`, noindex, prerendered explicitly since nothing links to them): the legal pages without the site's navigation, which leads to the offers, and `/app/compte-confirme`, where the confirmation link of an account created in the app leads. The legal texts are components (`components/legal/`) shared with `/confidentialite` and `/conditions-utilisation`.

### Mobile app (Capacitor iOS)
- `bun run build:mobile` builds a static SPA into `.output/public` (`CAPACITOR_BUILD=true`: no SSR, no prerender, Supabase session in localStorage). `bun run cap:sync` builds and copies it into `ios/`, `bun run cap:run` launches it.
- `runtimeConfig.public.isNative` (set at build time) is the native flag: use it rather than `import.meta.env`.
- The app runs on `capacitor://localhost` and calls the API at `APP_URL`, baked in at build time (`build:mobile` pins it to `https://kipoui.com` so the local `.env` value never ships in the app). `app/plugins/capacitor.client.ts` sends `/api/` requests from the global `$fetch` (hence `useFetch`) there, with the Bearer token from `useApiAuthHeaders()`. The chat transport uses the native fetch, so it sets both explicitly. `server/middleware/cors.ts` allows that origin on `/api/`.
- The iOS shell uses the UIScene lifecycle (`ios/App/App/SceneDelegate.swift` + `UIApplicationSceneManifest` in `Info.plist`): iOS 27 refuses to launch apps without it and Capacitor 8.3's template didn't provide it (8.5's does), so keep both if `ios/` is ever regenerated.
- App Store settings: iPhone only (`TARGETED_DEVICE_FAMILY = 1`), portrait only, `ITSAppUsesNonExemptEncryption = false` (HTTPS only). The icon is `AppIcon-1024.png`, 1024x1024 without alpha (the App Store rejects transparency), generated from `public/images/logo/logo-whithout-text.png` on a white background.
- The iOS app is a companion app: subscriptions are only sold on the website. In native, `SubscriptionRequiredOverlay` shows no call to action to purchase (App Store guideline 3.1.3(f)): never make `/tarifs`, `/paiement` or a purchase link reachable in the app.
- In native, the default layout (only used there by the legal pages) is a minimal shell with a back button instead of the site header and footer.
- The WebView covers the whole screen (`contentInset: 'never'`, `viewport-fit=cover` in the native build): full-screen containers must use the `safe-area-*` classes from `main.css` (env() is 0 on the web, so they are safe there).
- `app/middleware/native-guard.global.ts` restricts the app to its own screens (auth, chat, dashboard, legal pages) and sends `/` to the dashboard or the login page depending on the session. `useAppUrl().getRedirectUrl()` keeps Supabase auth email links on the web domain.

### Mobile app, Ionic Vue (`mobile/`, in progress)
Decided on 2026-10-14 to replace the Nuxt mobile build above, which is the web dashboard in a WebView (hamburger menu, long desktop forms with a single save button, a delete button that only shows on hover, 32-36 px controls) and doesn't feel native. Until it ships, the Nuxt build stays the iOS app; afterwards, remove the native code from the website (`isNative`, `native-guard`, the `safe-area-*` classes, the native layouts, `build:mobile`, `ios/`).
- Separate project with its own `package.json` and `bun.lock`: run its commands from `mobile/` (`bun run dev`, `build`, `typecheck`, `lint`, `cap:sync`, `cap:run`). Vite, Vue 3, Ionic Vue 9 (iOS mode everywhere, even in the browser), Vue Router 5, Capacitor 8.5. Its `bunfig.toml` only installs versions published at least a week ago.
- Client only: it calls the website's API with the Bearer token (`src/lib/api.ts`). In the browser, Vite forwards `/api` to `VITE_API_URL` (default https://kipoui.com) because the API only accepts the native origin; the native build calls it directly. Supabase only handles auth (public URL and anon key in `src/lib/config.ts`), with the session stored by `@capacitor/preferences`.
- Database types come from `../server/types/public.ts` through the `@server/*` alias (type imports only, never bundled). `ai` and `@ai-sdk/vue` are pinned to the server's versions: the UI message stream protocol changes between majors.
- `src/views` (pages), `src/components`, `src/composables` (state shared between screens: chats, profile, weights, consent, reset on sign out), `src/lib` (config, API, session, formatting, attachments, haptics and in-app browser).
- Routes: `/tabs/coach`, `/tabs/suivi`, `/tabs/profil` and its sub-screens, `/connexion`, and `/conversation/:id` above the tabs (`nouvelle` creates the conversation with its first message through `/api/chats/post`, like the website). Ionic keeps pages alive under the next ones: read route params once at setup, refresh data in `onIonViewWillEnter`.
- Profil sub-screens (`src/views/profil/`, wrapped in `ProfileSubPage`) save each value as soon as it is committed (input blur, select, toggle, checkbox) through `useProfile().saveSection()` and `/api/profile/update`, like iOS Settings: no save button. Quick successive changes go through `debounce()` (`src/lib/debounce.ts`) and are flushed when leaving the screen. Fields are filled once from the profile and never refilled after a save, which would erase what is being typed in another field. Enum labels live in `src/lib/profileOptions.ts`, typed by the database enums.
- Ionic gotchas: `slot="..."` is the native web component attribute (`vue/no-deprecated-slot-attribute` is off: its autofix breaks Ionic); Ionic moves `aria-label` and props like `tab` or `value` off the host element (never select on them); a solid button in a toolbar takes the toolbar's colors unless it has a `color`; set `text-align` on `ion-input` itself (its native input inherits it, a rule on the inner input loses to Ionic's).
- Auth emails sent from the app (signup confirmation, resend, password reset) open the website, which can't use a PKCE verifier kept in the app: the app's Supabase client uses the implicit flow, so the session travels in the link's fragment. `/nouveau-mot-de-passe` sets that session itself (the site's PKCE client refuses it), and `/app/compte-confirme` only tells the user to go back to the app. Supabase's redirect URLs must allow both. Signup records the AI consent like the website; a login with an unconfirmed address offers to resend the email. Legal pages open in the in-app browser (`PRIVACY_URL`, `TERMS_URL`).
- Attachments: photos resized to 1600 px JPEG, PDFs capped at 3 MB (Vercel refuses request bodies over 4.5 MB, and base64 adds a third); attachments of earlier messages aren't resent.
- Native patterns: large titles, push navigation with swipe back, swipe actions, card modals, pull to refresh, haptics, 44 pt touch targets, 17 px text (at least 16 px in inputs, or iOS zooms on focus).
- Theme (`src/theme/variables.css`): Ionic's `primary` is the dark green (`#5D7B1E`, readable on white: tints, back buttons, active tab); green buttons use the custom `brand` color (`#9ACD32` with dark text `#1A2306`: white on it is 1.9:1 where WCAG asks 4.5:1, a mistake the website's solid buttons still make in light mode). Fredoka bundled with `@fontsource/fredoka`, slate neutrals. Light theme only for now.
- iOS project (`mobile/ios`): Capacitor 8.5's template, which includes the UIScene lifecycle. Same App Store settings as the Nuxt app (iPhone only, portrait, `ITSAppUsesNonExemptEncryption = false`, camera and photo library descriptions, same icon) plus French as the development region (system pickers and menus in French), iOS 16.4 minimum (Vite's default build target) and a kiwi launch screen. Same bundle ID `com.kipoui.app`: installing one app replaces the other.
- The subscription only appears as a status (Profil, notices without call to action): companion app rule above.
- Mockups of the 4 key screens: design canvas "Kipoui iOS", https://claude.ai/artifact/UR1CAGWEtEnsHV1G18gCZT (private to the owner).
- Status (2026-10-15): login, signup, password reset, tabs, conversation list and chat (streaming, tool status, photos and PDFs, consent, subscription notice), weight tracking (chart, add, delete), Profil (every profile section, photo, AI consent, account deletion, sign out) and the legal pages work. To do: notifications (placeholder screen, needs push notifications), dark mode, last message preview in the conversation list (needs an API change), then retiring the Nuxt mobile build.

### Form validation
`app/composables/useZodValidation.ts` — composable wrapping Zod schemas for reactive per-field validation with touch tracking. Import Zod as `from 'zod/v3'`.

### Styling
- `app/assets/css/main.css` for global styles
- `app/app.config.ts`: primary color `yellowgreen`, neutral `slate`
- ESLint stylistic: no trailing commas (`commaDangle: 'never'`), `1tbs` brace style

### Environment variables
Required: `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `EXASEARCH_API_KEY`, `TAVILY_API_KEY`, `GROQ_API_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`, Stripe price IDs.

Managed in **Vercel** only (Settings → Environment Variables). No GitHub Actions → no GitHub secrets needed. `DATABASE_URL` is not used in the codebase.

Local dev (as of October 2026): the local `.env` points at the **production** Supabase project with Stripe **test** keys, so test signups and payments land in the real database. Delete test accounts when done (Paramètres > Sécurité, which also deletes their Stripe customer).

## Git workflow
- Work on `preview`: each push gets a Vercel preview deployment. Merging `preview` into `main` on GitHub deploys production (kipoui.com).
- Check the current branch before committing: after a merge, the local checkout may still be on `main`.
- Commit messages: gitmoji + Conventional Commits, in English (`:sparkles: feat(billing): ...`, `:bug: fix: ...`, `:memo: docs: ...`).

## Security
- **Never read `.env` or any secrets file** (`.env.local`, `.env.production`, etc.) — ask the user to share only what's needed.
