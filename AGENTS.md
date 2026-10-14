# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

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
1. Auth + AI consent check (403 without `user_metadata.ai_consent_at`) + full profile fetch → system prompt generation
2. Title auto-generation via Groq `openai/gpt-oss-20b` (first message only, `reasoningEffort: 'low'`). A failure falls back to the start of the message and never blocks the chat
3. Image attachments analyzed via Groq vision model `qwen/qwen3.8-27b` using `generateText` before being passed as text
4. PDF attachments → switches to Anthropic `claude-sonnet-5` (`maxOutputTokens: 8192`)
5. Default path: `openai/gpt-oss-120b` via `createGroq({ apiKey })`. `maxOutputTokens: 4096`. Groq has native tool calling — no middleware needed. Tools: `exaSearch`, `addResource`, `getInformation`, `logWeight`
6. Live-info keywords in message trigger forced `exaSearch` tool on first step via `prepareStep`. Otherwise `prepareStep` returns `{}` (auto tool choice).

Note: `convertToModelMessages()` is async in AI SDK v6 — always `await` it.

Attachments arrive as data URLs, which AI SDK v6 tries to download and refuses (it only downloads http(s)): pass their base64 content (`toInlineData()` in the route). Attachments of earlier messages are replaced by a text mention before `convertToModelMessages()`. Groq retires models regularly (`llama-3.1-8b-instant` and `llama-4-scout` were shut down in 2026): when a model call fails with "does not exist", check https://console.groq.com/docs/deprecations.

**RAG tools** (`server/lib/ai/tools/`): `addResource` saves content + embeddings to Supabase `vecs` schema; `getInformation` queries via `match_documents` RPC with similarity threshold **0.3** (lowered from 0.5 to catch semantically distant but relevant entries).

**logWeight tool** (`server/lib/ai/tools/logWeight.ts`): Records user weight after explicit confirmation. Updates both `weight_records` table (historical graph) and `physical_data.weight_kg` (used in system prompt) via `Promise.all`. Never called without explicit user confirmation.

**AI consent**: explicit consent to send profile data (including health and religious diet data) and messages to the AI providers, required by the GDPR (art. 9) and App Store guideline 5.1.2(i). Stored in Supabase Auth `user_metadata.ai_consent_at` (no DB column), read and written through `useAiConsent()`. Given at signup (`inscription.vue` checkbox) or through `AiConsentOverlay` in the chat layout, withdrawn in Paramètres > Sécurité. Legal pages: `/conditions-utilisation` and `/confidentialite`.

**Subscriptions** (Stripe): access means `subscription_status` is `'active'` or `'trialing'` (`hasActiveSubscription` in the user store). Statuses come from Stripe through `toSubscriptionStatus()` (`stripeRepository.ts`): written right after checkout by `verify-checkout-session` and kept up to date by `webhook.ts`. The webhook has no user session, so RLS would hide every customer: after checking the Stripe signature it calls `actAsServiceRole(event)` and the repositories use the service role for that request. A trial ending without a payment method pauses the subscription (`'paused'` → `'waiting_payment'`). Beta testers are activated by hand (`'active'` without a Stripe subscription): no Stripe event touches them.

**Account deletion** (`server/api/account/delete.ts`): deletes the Stripe customer first (cancels its subscription right away; if Stripe fails, the account is kept), then the user's avatars in Storage (`avatars/<user id>-<uuid>.<ext>`), then the auth user. Database rows follow through `ON DELETE CASCADE`: any new table linked to a user needs it too.

**Client chat** (`app/pages/chat/[id].vue`): Uses `@ai-sdk/vue` `Chat` class with `DefaultChatTransport`. Messages rendered with `@nuxtjs/mdc` for markdown streaming.

### Routing
Pages are in French: `/connexion`, `/inscription`, `/tableau-de-bord`, `/tarifs`, etc. Supabase redirects unauthenticated users to `/connexion`.

### Mobile app (Capacitor iOS)
- `bun run build:mobile` builds a static SPA into `.output/public` (`CAPACITOR_BUILD=true`: no SSR, no prerender, Supabase session in localStorage). `bun run cap:sync` builds and copies it into `ios/`, `bun run cap:run` launches it.
- `runtimeConfig.public.isNative` (set at build time) is the native flag: use it rather than `import.meta.env`.
- The app runs on `capacitor://localhost` and calls the API at `APP_URL`, baked in at build time (`build:mobile` pins it to `https://kipoui.com` so the local `.env` value never ships in the app). `app/plugins/capacitor.client.ts` sends `/api/` requests from the global `$fetch` (hence `useFetch`) there, with the Bearer token from `useApiAuthHeaders()`. The chat transport uses the native fetch, so it sets both explicitly. `server/middleware/cors.ts` allows that origin on `/api/`.
- The iOS shell uses the UIScene lifecycle (`ios/App/App/SceneDelegate.swift` + `UIApplicationSceneManifest` in `Info.plist`): iOS 27 refuses to launch apps without it and Capacitor 8's template doesn't provide it, so keep both if `ios/` is ever regenerated.
- The iOS app is a companion app: subscriptions are only sold on the website. In native, `SubscriptionRequiredOverlay` shows no call to action to purchase (App Store guideline 3.1.3(f)): never make `/tarifs`, `/paiement` or a purchase link reachable in the app.
- In native, the default layout (only used there by the legal pages) is a minimal shell with a back button instead of the site header and footer.
- The WebView covers the whole screen (`contentInset: 'never'`, `viewport-fit=cover` in the native build): full-screen containers must use the `safe-area-*` classes from `main.css` (env() is 0 on the web, so they are safe there).
- `app/middleware/native-guard.global.ts` restricts the app to its own screens (auth, chat, dashboard, legal pages) and sends `/` to the dashboard or the login page depending on the session. `useAppUrl().getRedirectUrl()` keeps Supabase auth email links on the web domain.

### Form validation
`app/composables/useZodValidation.ts` — composable wrapping Zod schemas for reactive per-field validation with touch tracking. Import Zod as `from 'zod/v3'`.

### Styling
- `app/assets/css/main.css` for global styles
- `app/app.config.ts`: primary color `yellowgreen`, neutral `slate`
- ESLint stylistic: no trailing commas (`commaDangle: 'never'`), `1tbs` brace style

### Environment variables
Required: `SUPABASE_URL`, `SUPABASE_KEY` (anon), `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `EXASEARCH_API_KEY`, `TAVILY_API_KEY`, `GROQ_API_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`, Stripe price IDs.

Managed in **Vercel** only (Settings → Environment Variables). No GitHub Actions → no GitHub secrets needed. `DATABASE_URL` is not used in the codebase.

## Security
- **Never read `.env` or any secrets file** (`.env.local`, `.env.production`, etc.) — ask the user to share only what's needed.
