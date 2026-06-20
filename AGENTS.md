# AGENTS.md

Agent instructions for autonomous work in **d-id-api-demo**. Read this file before changing code.

## Project overview

Next.js 16 (App Router) demo app that integrates the **D-ID API** for talking-head video generation. Users sign in with Firebase Google auth, store D-ID and ElevenLabs API keys in their profile, manage avatars (talking photos), compose videos (simple generate flow or Fabric.js canvas editor), pay for credits via Stripe, and poll D-ID until videos are stored in Firebase Storage.

Production deployment target: **Vercel** (`didapidemo.vercel.app`). Local development often requires **ngrok** so D-ID can reach proxied image URLs.

## Product purpose

Demonstrate a full-stack D-ID integration pattern: avatar management, TTS via ElevenLabs, Firebase-backed persistence, image proxying for D-ID compatibility, polling-based video completion, optional webhooks, and Stripe credits — not a generic SaaS template.

## Current tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js `^16.2.4`, React `^19.2.5`, TypeScript `^6.0.3` (strict) |
| Styling | Tailwind CSS `^4.2.4`, Styled Components `^6.4.1`, Framer Motion `^12.38.0`, Lucide |
| State | Zustand `^5.0.12` (`useAuthStore`, `useProfileStore`, `usePaymentsStore`) |
| Auth | Firebase Auth (client) + Firebase Admin session cookie (`__session`) |
| Database / storage | Firestore + Firebase Storage |
| External APIs | D-ID, ElevenLabs (`@elevenlabs/elevenlabs-js` `^2.44.0`), Stripe `^22.0.2` |
| Canvas editor | Fabric.js `^7.3.1` (`CreateVideo` component) |
| Forms | React Hook Form `^7.73.1` + Yup `^1.7.1` |
| Package manager | **Yarn 1** (`packageManager` in `package.json`; use `yarn`, not npm) |

## Repository structure

```
src/
  app/              # App Router pages and API routes
  actions/          # Server actions ("use server") — D-ID, Firebase, Stripe
  components/       # UI (client-heavy); create-video/, video-show/ subdirs
  firebase/         # firebaseClient.ts, firebaseAdmin.ts
  hooks/            # e.g. useAudio
  libs/             # constants, utils, auth-constants, audio-list.json
  types/            # did.d.ts and shared types
  utils/            # resizeImage, Languages, helpers
  zustand/          # Global client stores + useInitializeStores
  proxy.ts          # Edge route protection (Next.js 16 proxy, not middleware.ts)
firestore.rules     # Firestore security rules
storage.rules       # Storage security rules
spec.md             # Authoritative product spec and roadmap
```

## Core architecture overview

```
Browser (Firebase Auth + Zustand)
    ↓ idToken
POST /api/auth → Firebase Admin session cookie (__session)
    ↓
src/proxy.ts (edge) — cookie presence on protected paths only
    ↓
Pages (mostly thin Server Components → client components)
    ↓
Server actions (protect() / getCurrentUser()) → D-ID / Firestore / Storage / Stripe
    ↓
Image proxy API routes — public URLs for D-ID to fetch Firebase images
```

**Dual auth model:** Firebase client session drives UI and Firestore client reads; server actions verify the httpOnly `__session` cookie via `protect()` in `src/actions/auth.ts`.

**Video pipeline (inferred):** Create Firestore doc → upload thumbnail → build proxied image URL → `generateDIDVideo` POST to D-ID `/talks` → poll via `retrieveDIDVideo` / `getVideo` → download result → Firebase Storage → update `generated-videos` + notification.

**Webhook path:** `getWebhookUrl` builds app webhook URLs on public HTTPS; `/api/video-generated/[id]` handles callbacks. Localhost uses polling only.

## Key app features (today)

- Google sign-in via Firebase; session cookie for server actions
- Profile: D-ID key, ElevenLabs key, optional `did_basic_auth`, credits display
- Avatar CRUD: personal + template talking photos in `didTalkingPhotos`
- `/generate`: quick single-avatar video from script/TTS/audio
- `/videos/create` and `/videos/[id]/edit`: multi-scene Fabric.js composer
- `/videos`, `/videos/[id]/show`: library and playback with D-ID status polling
- Stripe checkout ($99.99 demo) and client-side credit grant on success
- Image proxies: `/api/imageproxy/[id]`, `/api/video-image-proxy/[id]`
- Dev/diagnostic pages: ngrok setup, API key diagnostics, proxy tests
- Header notifications from Firestore `notifications` collection

## Important commands

```bash
yarn install          # Install dependencies
yarn dev              # Dev server (localhost:3000)
yarn build            # Production build + TypeScript check
yarn start            # Run production build locally
yarn lint             # ESLint (flat config via eslint.config.mjs)
yarn typecheck        # tsc --noEmit
yarn test             # Vitest unit tests
yarn validate         # lint + typecheck + test + build (canonical gate)
```

## Canonical validation / check command

Run before committing:

```bash
yarn validate
```

Or individually: `yarn lint`, `yarn typecheck`, `yarn test`, `yarn build`.

## Non-interactive testing rules

- Never wait for user input or manual login in automated runs.
- Never use watch mode (`--watch`, `jest --watch`, etc.).
- Never open a headed browser or Playwright UI mode.
- Do not rely on live D-ID, ElevenLabs, Firebase, or Stripe credentials unless the task explicitly requires integration testing.
- Diagnostic routes (`/diagnostic`, `/api/debug`) expose environment info — do not treat them as test harnesses in CI.

## Development conventions

- Use **Yarn 1**; do not switch to npm/pnpm or regenerate the other lockfile.
- Path alias: `@/*` → `./src/*`.
- Server actions live in `src/actions/` with `"use server"` at file top (some legacy helpers lack it — do not add new ones without it).
- Firestore collection names: see `src/libs/constants.ts`.
- Public base URL: `getApiBaseUrl()` in `src/libs/utils.ts` (browser uses `window.location.origin`; production falls back to `NEXT_PUBLIC_API_BASE_URL` or `https://didapidemo.vercel.app`).
- `saveNgrokUrl()` is deprecated; ngrok pages remain for docs but origin is auto-detected.
- Match existing patterns: functional components, Zustand for client global state, server actions for privileged API calls.
- Keep changes **PR-sized** (one focused concern per commit sequence on `dev`).

## TypeScript and lint expectations

- `strict: true` in root `tsconfig.json`.
- ESLint: `next/core-web-vitals` + `next/typescript` (`.eslintrc.json`).
- Fix new lint/type errors you introduce; do not drive large lint-only refactors unless the roadmap item requires it.
- Shared D-ID types: `src/types/did.d.ts`.

## Server / client boundary guidance

- Default to **Server Components** for `page.tsx`; add `"use client"` only where hooks, Firebase client SDK, Fabric, or browser APIs are needed.
- **Never** import `firebaseAdmin` or use `protect()` in client components.
- API keys for D-ID/ElevenLabs are stored in user profile (Firestore) and passed from client into server actions — env vars `D_ID_API_KEY` / `ELEVENLABS_API_KEY` in `.env.example` are optional fallbacks/diagnostics, not the primary user flow.
- Server Actions body limit: 3MB (`next.config.mjs` `experimental.serverActions.bodySizeLimit`).

## Route-protection guidance

Protected path prefixes (`src/libs/auth-constants.ts`): `/avatars`, `/generate`, `/payment-attempt`, `/payment-success`, `/profile`, `/videos`.

Matching uses exact prefix or `prefix/` boundary (e.g. `/profile-settings` is **not** protected).

Enforcement layers:

1. **`src/proxy.ts`** — redirects to `/` if `__session` cookie missing (presence only, not verified).
2. **`FirebaseAuthProvider`** — client redirect if Firebase user null on protected path.
3. **Server actions** — `protect()` verifies session cookie with revocation check.

**Not protected at edge:** Diagnostic/dev pages (`/diagnostic`, `/test-*`, etc.) remain public. Image proxy API routes stay public for D-ID.

**Caution:** `UserProfile` sign-out may not call `DELETE /api/auth`; `FirebaseAuth.tsx` does. Prefer clearing both Firebase and session cookie when fixing auth flows.

## State-management guidance

| Store | Responsibility |
|-------|----------------|
| `useAuthStore` | Firebase uid and auth metadata; syncs safe fields to `users/{uid}` |
| `useProfileStore` | `users/{uid}/profile/userData` — API keys, credits, avatar selections |
| `usePaymentsStore` | `users/{uid}/payments` — Stripe payment records |
| `useInitializeStores` | Loads profile when `uid` available (from `Header`) |

Use Zustand for cross-page client state; use Firestore listeners in components for real-time lists (videos, notifications). Do not introduce Redux or Context for global state unless explicitly requested.

## Testing expectations

- Vitest unit tests in `src/**/*.test.ts` (route protection, webhook URL, video status, and payment credit helpers).
- Canonical gate: `yarn validate`.

## Files and systems requiring extra caution

| Area | Risk |
|------|------|
| `src/actions/generateVideo.ts` | Owner validation enforced; uses authenticated uid |
| `src/actions/auth.ts` | Single source for `protect()` and `getCurrentUser()` |
| `firestore.rules` / `storage.rules` | Client credit/payment writes allowed on profile subcollections |
| `/api/avatar-ids`, `/api/video-ids`, `/api/debug`, `/api/test-image-access` | Unauthenticated; SSRF/enumeration risk |
| `getWebhookUrl` | Returns null on localhost; real URL on public HTTPS — polling remains fallback |
| `CreateVideo.tsx` | Large Fabric.js surface; incomplete error/redirect TODOs |
| `.env.local` / Firebase service account | Secrets — never commit |
| `package-lock.json` | Coexists with `yarn.lock`; use Yarn only |

## Git workflow expectations

| Branch | Role |
|--------|------|
| `main` | Stable production — **never push directly** |
| `dev` | Autonomous working branch — commit and push here |

- Do **not** create feature branches unless explicitly instructed.
- Do **not** open PRs or merge to `main` unless explicitly instructed.
- Before work: `git fetch origin`, checkout `dev`, `git pull origin dev`.
- One focused, PR-sized change per autonomous task, even when committing directly to `dev`.
- Commit message style: concise imperative (e.g. `fix:`, `docs:`, `feat:`).

## Definition of done

1. Change matches task scope; no unrelated refactors.
2. `yarn validate` passes.
3. Auth, Firestore rules, and server/client boundaries respected.
4. No secrets committed; no lockfile manager switches.
5. `spec.md` updated if product behavior or roadmap materially changes.
6. Committed to `dev` and pushed to `origin/dev` when task requires it.

## Rules for autonomous Codex runs

1. Read `AGENTS.md` and `spec.md` first.
2. Inspect code before editing; do not trust stale README sections (e.g. "middleware", `/api/proxy-image`).
3. Prefer extending existing server actions and stores over new abstractions.
4. Use Yarn for all package operations.
5. Make one focused change set per run.
6. Update docs when behavior or roadmap changes.
7. Never push to `main`.

## Stop conditions

Stop and report (do not guess) when:

- Uncommitted changes exist that are not yours and may conflict — document and ask.
- `yarn build` fails for reasons outside your change scope.
- Task requires production credentials or manual Vercel/Firebase console steps you cannot perform.
- Task would require merging to `main` or force-pushing.
- Firestore rules changes need coordinated Firebase deploy and task did not authorize it.
- Ambiguity between two product directions — cite `spec.md` and ask.

## Product reference

Authoritative product state and roadmap: **`spec.md`**.
