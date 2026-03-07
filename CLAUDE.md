# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- **AI**: Vercel AI SDK v6 (`ai` package). Primary model: Groq `llama-3.3-70b-versatile` (via `@ai-sdk/groq`). Falls back to Anthropic `claude-sonnet-4-0` for PDF analysis. Embeddings via OpenAI `text-embedding-3-small`
- **Payments**: Stripe (via `@unlok-co/nuxt-stripe`)
- **Deployment**: Vercel (via GitHub integration). Domain: `kipoui.com` — DNS at OVH (not Vercel nameservers). OVH email configured (MX + SPF + DKIM) — ne jamais migrer vers les NS Vercel, ne pas toucher ces records DNS.

### Key architectural patterns

**Server repositories** (`server/repositories/`): All DB access goes through typed repository files — `chatRepository`, `profileRepository`, `messageRepository`, `weightRepository`, etc. Server routes call repositories, not Supabase directly.

**Auth**: `requireAuth(event)` from `server/repositories/supabaseRepository.ts` gates all protected API routes. Client-side auth state lives in `app/stores/user.ts` (Pinia), initialized by `app/plugins/user.client.ts` and `app/plugins/user.server.ts`.

**User store** (`app/stores/user.ts`): Central store holding the full user profile tree — `profile`, `physicalData`, `habits`, `medicalData`, `goals`, `preferences`, `customer`. Populated by `/api/profile/get` on init.

**AI chat flow** (`server/api/chats/[id].post.ts`):
1. Auth + full profile fetch → system prompt generation
2. Title auto-generation via Groq `llama-3.1-8b-instant` (first message only)
3. Image attachments analyzed via Groq vision model `meta-llama/llama-4-scout-17b-16e-instruct` using `generateText` before being passed as text
4. PDF attachments → switches to Anthropic `claude-sonnet-4-0`
5. Default path: `llama-3.3-70b-versatile` via `createGroq({ apiKey })`. Groq has native tool calling — no middleware needed. Tools: `exaSearch`, `addResource`, `getInformation`
6. Live-info keywords in message trigger forced `exaSearch` tool on first step via `prepareStep`

Note: `convertToModelMessages()` is async in AI SDK v6 — always `await` it.

**RAG tools** (`server/lib/ai/tools/`): `addResource` saves content + embeddings to Supabase `vecs` schema; `getInformation` queries via `match_documents` RPC with similarity threshold 0.5.

**Client chat** (`app/pages/chat/[id].vue`): Uses `@ai-sdk/vue` `Chat` class with `DefaultChatTransport`. Messages rendered with `@nuxtjs/mdc` for markdown streaming.

### Routing
Pages are in French: `/connexion`, `/inscription`, `/tableau-de-bord`, `/tarifs`, etc. Supabase redirects unauthenticated users to `/connexion`.

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
