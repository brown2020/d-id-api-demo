# Product specification — D-ID API Demo

Single source of truth for product behavior, current state, and roadmap. Inferred conclusions are labeled **(inferred)**.

---

## 1. Product overview

### Product promise

A working reference application that shows developers and evaluators how to build a D-ID-powered talking-head video workflow in Next.js: sign in, configure API keys, create avatars, generate videos with text or voice, pay for credits, and retrieve finished videos from Firebase — including workarounds for D-ID’s Firebase Storage URL limitations.

### Target users

- **Developers** integrating D-ID, ElevenLabs, Firebase, and Stripe into Next.js App Router apps.
- **Technical evaluators** testing D-ID talking-photo and `/talks` API flows before building a product.
- **Demo operators** running the app on Vercel or locally via ngrok.

Not positioned as a consumer-facing video editor; it is a demo with real integrations and known rough edges.

### Core workflows

1. **Onboard:** Sign in with Google → open Profile → enter D-ID and ElevenLabs API keys (and optional Basic auth for Vercel) → receive starter credits **(inferred:** 1000 credits on first profile load).
2. **Manage avatars:** Create/upload talking photos → store in Firestore `didTalkingPhotos` → favorite templates → select avatar for generation.
3. **Generate video (simple):** `/generate` → pick avatar → script/TTS/custom audio → submit → poll status → view in library.
4. **Generate video (advanced):** `/videos/create` → Fabric.js canvas with scenes, emotions, movements → submit → redirect to video list on success **(inferred:** redirect TODOs remain in error paths).
5. **Monitor & playback:** `/videos` list → `/videos/[id]/show` for status and playback → notifications in header when complete.
6. **Purchase credits:** Profile → payment flow → Stripe checkout → `/payment-success` validates intent and adds credits.

### Product goals

- Prove end-to-end D-ID integration with realistic persistence and billing hooks.
- Make local and production behavior consistent for image URLs (proxy + public base URL).
- Provide diagnostics for common setup failures (keys, ngrok, image reachability).
- Stay deployable on Vercel with minimal ops.

---

## 2. Current application state

### What the app currently does

Full-stack demo: Firebase-authenticated users manage API keys and credits, create and browse avatars, generate D-ID videos through two UIs (simple generate + canvas composer), poll for completion, store results in Firebase Storage, and optionally buy credits via Stripe.

### Current feature inventory

| Feature | Status | Notes |
|---------|--------|-------|
| Google Firebase auth | **Working** | Session cookie via `POST /api/auth` |
| Profile & API keys | **Working** | Stored in `users/{uid}/profile/userData` |
| Avatar management | **Working** | Personal + template types, favorites |
| Simple video generation (`/generate`) | **Working** | Key validation; redirects to show page after submit |
| Canvas video composer | **Working** | Redirects and actionable errors on submit/load failures |
| Video library & detail | **Working** | Firestore real-time + polling |
| Image proxy for D-ID | **Working** | Required for Firebase Storage URLs |
| ElevenLabs voice list / TTS | **Working** | Keys from profile; forwarded to D-ID |
| Stripe payments | **Working** | Demo $99.99; client credit grant |
| Notifications | **Working** | On video complete/fail |
| D-ID webhooks | **Partial** | Route exists; generation uses polling + dummy webhook URL |
| Route protection | **Improved** | `/videos*` protected; prefix boundary matching |
| Video ownership | **Fixed** | `generateVideo` sets `owner` to authenticated uid |
| Automated tests | **Partial** | Vitest for auth route helpers |
| Credit enforcement | **Partial** | `useCredits` exists; generation path unclear **(inferred)** |

### Current user flows

```
Sign in (/) → Profile (/profile) → Avatars (/avatars) → Generate (/generate OR /videos/create)
    → D-ID processing (poll) → Videos (/videos) → Show (/videos/[id]/show)
Optional: Payment (/payment-attempt → /payment-success)
Dev: Diagnostic (/diagnostic), API diagnostics (/api-diagnostics), ngrok pages
```

### Existing integrations

| Service | Usage |
|---------|--------|
| **D-ID** | `POST /talks`, `GET /talks/{id}`; user API key from profile |
| **ElevenLabs** | Voice listing; TTS via D-ID external key header |
| **Firebase Auth** | Google sign-in |
| **Firestore** | Users, profiles, avatars, videos, notifications, webhooks log, errors |
| **Firebase Storage** | Avatar images, video files, thumbnails |
| **Stripe** | Payment intents for credit purchase |

### Current architecture summary

- **Next.js 16 App Router** with Server Components for pages and **server actions** for privileged operations.
- **Edge proxy** (`src/proxy.ts`) for cookie-presence checks on a subset of routes.
- **Zustand** for client profile/auth/payment state synced with Firestore.
- **Polling-first** video completion; webhook handler at `/api/video-generated/[id]` ready but not wired from `generateDIDVideo`.
- **Image proxy API routes** expose publicly reachable URLs for D-ID.

### Existing technical constraints

- D-ID must fetch avatar/thumbnail URLs over the public internet — drives proxy routes and ngrok for local dev.
- User-supplied D-ID/ElevenLabs keys (not server-only env) are required for core flows.
- Server Actions 3MB body limit for canvas/thumbnail payloads.
- AGPL-3.0 license.

### Known limitations

1. ~~**Video ownership:**~~ **Fixed (dev):** New videos use authenticated uid; existing docs with `owner: "user"` may need migration.
2. ~~**Split auth coverage:**~~ **Fixed (dev):** `/videos*` added to protected prefixes.
3. **Session desync:** Sign-out paths now clear session cookie via shared `signOutUser()`.
4. **Edge proxy:** Still checks cookie presence only, not cryptographic validity at edge.
5. **Polling vs webhooks:** Polling is active; webhooks deliberately disabled via dummy URL in `getWebhookUrl`.
6. **Client-side credits:** Profile subcollection allows client writes to credits; payment success adds credits from client.
7. **Open diagnostic APIs:** ID enumeration and URL fetch endpoints without auth.
8. **No automated tests.**
9. **README drift:** Some docs reference removed middleware and wrong proxy path names — use this file and `AGENTS.md` as authority.
10. **Dual lockfiles:** `yarn.lock` and `package-lock.json` both present; Yarn is canonical per `packageManager`.

### Abandoned or partial systems **(inferred)**

- **Real webhook delivery:** Infrastructure present; generation path forces webhook.site dummy URL.
- **Clerk auth:** Removed; comments reference Firebase replacement.
- **Ngrok URL persistence:** `saveNgrokUrl` deprecated; pages still exist for documentation.
- **Edit existing video via `video_id`:** TODOs in `generateVideo` for validation and owner checks.
- **`createDIDAvatarProfile`:** Builds avatar object locally without D-ID validation or Firestore save.

---

## 3. Product roadmap

Ordered by product impact and dependency. Each item is sized for one clean commit sequence on `dev`.

### Milestone 1 — Fix video ownership and library trust

**Status:** Largely complete on `dev` (ownership, `/videos*` protection, `getVideo` auth ordering). Remaining: migrate legacy docs with `owner: "user"`.

---

### Milestone 2 — Reliable sign-in/sign-out and post-login redirect

**Status:** Partially complete on `dev` (`signOutUser`, `callbackUrl` handling). Remaining: explicit `sameSite` verified in all environments.

---

### Milestone 3 — Complete video generation UX (composer + simple flow)

**Status:** ✅ Complete (dev)

**Implementation note:** Redirects to `/videos` or `/videos/[id]/show` on composer errors/success; shared `formatVideoGenerationError` / `isVideoProcessing` helpers; Generate flow validates keys/script and redirects to show page; VideoDetail shows accessible processing/error/playback states with live Firestore updates.

---

### Milestone 4 — Enable D-ID webhooks for faster completion

**User value:** Videos appear ready sooner; less polling load.

**Acceptance criteria:**
- `generateDIDVideo` sends real webhook URL from `getWebhookUrl` when `baseUrl` is public.
- Webhook handler validates secret token and updates Firestore + notification (existing route).
- Polling remains fallback if webhook not received within timeout.

**Implementation intent:** Replace dummy webhook.site URL in `src/libs/utils.ts`; pass webhook in D-ID payload; document env requirement for public `NEXT_PUBLIC_API_BASE_URL`.

---

### Milestone 5 — Server-side credit and payment fulfillment

**User value:** Credits cannot be self-granted; payments reliably add credits once.

**Acceptance criteria:**
- Credit increment runs in server action or Stripe webhook after verified payment — not only client `addCredits`.
- Firestore rules restrict client writes to credits on profile (server/admin only).
- Duplicate payment intents cannot double-grant credits.

**Implementation intent:** Move fulfillment to `paymentActions.ts` or new webhook route; tighten `firestore.rules` for `users/{uid}/profile`; keep UI reading credits from profile store.

---

### Milestone 6 — Credit gating on generation

**User value:** Demo billing model is visible — users understand cost per video.

**Acceptance criteria:**
- Before D-ID submit, server action checks credits and decrements atomically (or rejects).
- UI shows insufficient-credit message with link to payment.
- Profile credits stay in sync after generation.

**Implementation intent:** Call `protect()` + read profile server-side (Admin SDK); decrement in same transaction as video doc creation; surface errors to `/generate` and `CreateVideo`.

---

### Milestone 7 — Onboarding activation checklist

**User value:** New users reach first successful video faster.

**Acceptance criteria:**
- Profile page shows checklist: signed in, D-ID key set, ElevenLabs key set, at least one avatar, optional “test image access” link.
- Block or warn on generate pages when keys missing (client + server).
- Link to `/api-diagnostics` from checklist when keys invalid.

**Implementation intent:** Small component on Profile or banner in Header driven by `useProfileStore` fields; server-side validation in `generateVideo` already partially exists — unify messages.

---

### Milestone 8 — Lock down or gate diagnostic endpoints

**User value:** Production demo is safer without exposing enumeration and SSRF helpers.

**Acceptance criteria:**
- `/api/avatar-ids`, `/api/video-ids`, `/api/debug`, `/api/test-image-access` require auth or are disabled when `VERCEL_ENV=production`.
- Dev-only pages (`/test-proxy`, etc.) show warning or require sign-in in production.

**Implementation intent:** Add `protect()` or env guard to API routes; keep local dev behavior via `IS_LOCAL` or `NODE_ENV`.

---

### Milestone 9 — Canvas editor polish (emotions, movements, preview)

**User value:** Advanced composer feels intentional, not experimental.

**Acceptance criteria:**
- Emotion/movement selections persist on draft save and reload on edit.
- Canvas preview reflects selected avatar image via proxy URL.
- Draft save (`addDraftVideo`) loads correctly on `/videos/[id]/edit`.

**Implementation intent:** Wire `addDraftVideo` + edit path through `CreateVideo` state hydration; verify Fabric v7 serialization.

---

### Milestone 10 — First automated smoke test

**User value:** Regressions in auth constants and server action exports caught in CI.

**Acceptance criteria:**
- Add minimal test runner (e.g. Vitest) with tests for `isProtectedPathname`, `getApiBaseUrl` edge cases, and one server action mock.
- CI script documented in `AGENTS.md` as optional third check.

**Implementation intent:** Product-unlock for safer iteration on Milestones 1–2; not a lint backlog.

---

## Document maintenance

- Update this file when shipping milestones or changing integrations.
- `AGENTS.md` holds agent/workflow instructions; do not duplicate roadmap there.
- `README.md` holds setup/install steps; link here for product and roadmap detail.
