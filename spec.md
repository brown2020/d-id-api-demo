# Product specification — D-ID API Demo

Current behavior of the `dev` branch. Next steps, known bugs, and open issues are in [roadmap.md](./roadmap.md).

## Product

A comprehensive Next.js demo showcasing D-ID's 2026 platform capabilities:
- **V4 Expressive Avatars**: Create emotional videos with sentiment-aware avatars
- **Realtime Agents**: Build conversational AI with live video avatars
- **Legacy V2 Workflows**: Classic talking-photo generation and canvas composition

Features Firebase auth/storage, ElevenLabs voice synthesis, and Stripe credit payments. Designed for developers exploring D-ID integration patterns.

Deployment: Vercel or local. D-ID image/webhook callbacks require public HTTPS (production deploy or ngrok for local).

## Users and flows

### Authentication & Setup
1. Sign in with Google or email/password. The client keeps a Firebase session. `POST /api/auth` sets an httpOnly `__session` cookie. Sign-out revokes refresh tokens and clears the cookie.
2. Profile holds the D-ID key, the ElevenLabs key, and the credit balance (`users/{uid}/profile/userData`). New profiles start at 1000 credits.

### V4 Expressive Avatar Flow (Primary)
1. Navigate to `/expressive` to access V4 Expressive Avatar generation.
2. System calls `GET /expressives/avatars` to list all available V4 avatars with their sentiments.
3. User selects an avatar and a sentiment (Professional, Empathetic, Excited, Friendly, Frustrated, etc.).
4. User writes a text script for the avatar to speak.
5. Submit calls `POST /expressives` with `avatar_id`, `sentiment_id`, and script text.
6. System polls `GET /expressives/{id}` every 5 seconds until status is `done` or `error`.
7. Completed video plays inline. Video data stored in `expressive-videos` Firestore collection.
8. Missing API key or D-ID auth/credit/quota errors serve demo sample without debiting credits.

### Realtime Agent Flow (Primary)
1. Navigate to `/agents` to manage conversational AI agents.
2. Create agent: calls `POST /agents` with presenter config (default: Amber avatar + Azure voice).
3. Agent saved to `agents` Firestore collection with owner scope.
4. Generate client key: calls `POST /agents/client-key` with allowed domains (auto-includes current origin).
5. System displays embed code: `<script>` tag with agent ID, client key, and D-ID agent widget URL.
6. User copies embed code to add live conversational agent to any website.
7. Client keys are domain-restricted for security (configured in D-ID console for production domains).

### Legacy Workflows
1. Create personal talking photos or favorite templates in `didTalkingPhotos` (`/avatars`).
2. Generate from `/generate` (V2 one-avatar script/TTS) or `/videos/create` (Fabric.js multi-scene composer).
3. Live D-ID submission costs 1 credit, refunded if call fails or demo sample used.
4. System polls V2 `/talks/{id}` endpoint. Optional webhook: `/api/video-generated/{id}`.
5. `/videos` and `/videos/[id]/show` list and play videos. Header shows unread notifications.
6. `/payment-attempt` starts Stripe PaymentIntent ($99.99 pack). `/payment-success` grants 10000 credits.

Protected prefixes: `/avatars`, `/expressive`, `/agents`, `/generate`, `/payment-attempt`, `/payment-success`, `/profile`, `/videos`. Edge proxy checks session cookie presence. Server actions verify with revocation check.

## Features as built

| Feature | Behavior |
|---------|----------|
| **V4 Expressive Avatars** | List avatars via `GET /expressives/avatars`. Create videos via `POST /expressives` with avatar_id, sentiment_id, script. Poll `GET /expressives/{id}` until done. Videos stored in `expressive-videos` collection. Demo mode on missing key or D-ID errors (no credit debit). Each generation costs 1 credit, refunded on failure. |
| **Realtime Agents** | Create agents via `POST /agents` with presenter config. Generate client keys via `POST /agents/client-key` with allowed domains. Agents stored in `agents` collection. Embed code auto-generated for website integration. Domain restrictions enforced by D-ID (console config for production). |
| **Auth** | Google popup and email/password. Session cookie verified with revocation check. |
| **Profile** | Client can update allowlisted profile fields. `credits` is required and cannot be changed by the client. Stores D-ID key, ElevenLabs key, Basic Auth credentials. |
| **Avatars (Legacy)** | Personal avatars are owner-scoped. Templates are readable. A personal avatar cannot be updated into a template. With no D-ID key, Demo Avatars includes a built-in avatar that uses `/demo/sample-talking-avatar.png` and a bundled voice. Clicking a card stores `selectedTalkingPhoto` and marks that card selected. Create Avatar saves without a D-ID key and shows a demo notice. |
| **Simple generate (Legacy)** | Validates the script, base URL, and credits, then calls V2 `/talks`. A missing key, or a D-ID auth, credit, or quota error, stores the bundled sample clip and image and marks the video as demo mode. |
| **Canvas composer (Legacy)** | Multi-scene Fabric.js editor. `/generate` and `/videos/create` open the avatar in `selectedTalkingPhoto`. The demo avatar uses `/demo/sample-talking-avatar.png`. Card previews use the stored image unless a D-ID key is configured. The canvas always loads a user avatar through `/api/imageproxy`, which streams the Storage object, so a signed URL is never drawn. A missing key can still submit with no draft id. Save and submit go through the same generation action. |
| **Library** | Owner-scoped Firestore queries. Playback uses a Storage signed URL after the result is copied. Separate collections for V2 videos (`generated-videos`) and V4 expressive videos (`expressive-videos`). |
| **Image proxies** | `/api/imageproxy/[id]` and `/api/video-image-proxy/[id]` read owned bucket objects via the Admin SDK, sniff a raster type, and do not fetch arbitrary URLs. |
| **Voice** | ElevenLabs list and TTS use the profile key. Server env keys are not a fallback. If that list cannot load, the UI uses the bundled voices in `audio-list.json`. |
| **Webhooks** | Query token or HMAC of the raw body. History is a short redacted line. Result downloads stay on D-ID S3 hosts. V2 only (V4 uses polling). |
| **Credits** | Admin transaction debits 1 credit before a live D-ID call (V2 or V4) and refunds that debit if submission fails or the result is the bundled sample. A missing key does not debit. |
| **Payments** | Only the 9999-cent pack can be created. Fulfillment checks `metadata.userId` and is idempotent. |
| **Notifications** | `status: "unread"` and unix-seconds `created_at`. V2 video completion only (V4 uses inline polling). |
| **Diagnostics** | `/api/debug`, `/api/key-diagnostics`, `/api/test-image-access`, and `/api/check-did-image-access` are local-development only. ID lists require a session and return that user's ids. |
| **Tests** | Vitest covers route protection, webhook URL and auth, storage and app URL allowlists, video status, and credit math. |
| **CI** | GitHub Actions on Node 24 runs lint, typecheck, test, and a production build with no secrets. |

## Architecture

Browser (Firebase client + Zustand) sends an ID token to `POST /api/auth`. `src/proxy.ts` redirects protected pages when the cookie is missing. Pages are mostly server components that render client UI. Privileged work is in server actions (`protect` / `getCurrentUser`) and route handlers (`requireApiSession`).

Generation order: allowlist the app base URL, create the video document, then resolve credentials. Only the profile D-ID key or Basic Auth starts a live call. `DID_API_KEY` is diagnostic and does not generate video. If the profile has no D-ID key, the document is marked done with the bundled sample at `/demo/sample-talking-avatar.mp4` and `/demo/sample-talking-avatar.png`, `demo_notice` is `Demo mode: showing a sample video because no D-ID key is configured`, and no credit is debited. Otherwise the app copies an allowed thumbnail into Storage, saves `secret_token`, debits 1 credit, and calls D-ID. Auth (401/403), credit (402 or a credit phrase), and quota (429 or a quota phrase) responses refund the credit and store that same sample with a demo notice. Other D-ID failures stay errors. The webhook or the poller downloads a real result into Storage. Gallery thumbnails for stored avatars use `/api/imageproxy/{id}.png` so signed `storage.googleapis.com` URLs are not sent through `/_next/image`.

Public base URL comes from the request host, `NEXT_PUBLIC_API_BASE_URL`, or `https://didapidemo.vercel.app`. Generation image URLs must be one of those origins or the exact fallback headshot. `getWebhookUrl` returns null on localhost.

## Integrations

| Service | Use |
|---------|-----|
| **D-ID V4** | `GET /expressives/avatars` lists avatars/sentiments. `POST /expressives` creates expressive videos. `GET /expressives/{id}` polls status. `POST /agents` creates realtime agents. `POST /agents/client-key` generates embed keys. All use Basic Auth from profile. |
| **D-ID V2 (Legacy)** | `POST /talks` and `GET /talks/{id}` for classic talking-photo generation. Profile with no D-ID key plays bundled sample. |
| **ElevenLabs** | Voice list and TTS through the profile key. Used in V2 workflows and agent voice configuration. |
| **Firebase Auth** | Google and email/password authentication with session cookies. |
| **Firestore** | Users, profiles, avatars (V2), expressive-videos (V4), agents, generated-videos (V2), notifications, webhook history. Owner-scoped queries with composite indexes. |
| **Firebase Storage** | Avatars, thumbnails, rendered videos (both V2 and V4). Image proxies for D-ID access. |
| **Stripe** | One PaymentIntent for the credit pack. No Stripe webhook route (client-side fulfillment). |

The app does not call an LLM provider directly. Agent LLM configuration (OpenAI, Google) is set via D-ID API when creating agents but not implemented in current UI. Voice and model IDs come from profile or D-ID defaults.

## Data and rules

- Profile create must set `credits` to 1000. Updates cannot change `credits`.
- Personal avatar delete and update require ownership. Update cannot change `type` away from `personal`.
- Payments are written by the Admin SDK.
- Image and video proxies stay public so D-ID can fetch them. They only serve objects whose path matches the avatar or video owner.
- `getFileUrl` requires a session and an owned path. Those signed URLs expire in one hour. Gallery images use the same-origin proxies. Playback URLs written after an authorized copy use a long-lived Storage signature.

`firestore.rules` and `firestore.indexes.json` include composite indexes for `notifications` (`user_id`, `status`), `generated-videos` (`owner`, `type`), and `didTalkingPhotos` (`owner`, `type`). They take effect only after a Firebase deploy. `storage.rules` is unchanged by the latest security pass.

## Constraints

- D-ID must fetch images over the public internet.
- Server Actions body limit is 3MB.
- When the profile has no D-ID key or Basic Auth, generation stores the bundled sample and does not debit a credit. It does not fall back to `DID_API_KEY`, `D_ID_BASIC_AUTH`, or `ELEVENLABS_API_KEY`. A D-ID auth, credit, or quota error also returns the bundled sample.
- Missing or non-numeric credit balance is treated as zero.
- License is AGPL-3.0-only.
- Package manager is Yarn 1. There is no `package-lock.json`.
- Client Firebase SDK is 13.x and needs Node `>=24.12.0`. CI runs on Node 24. See [roadmap.md](./roadmap.md).

## Build without secrets

`firebaseClient` skips initialization when the public web config is missing. `firebaseAdmin` catches a failed `initializeApp` and logs a warning. Stripe is constructed with an empty string when `STRIPE_SECRET_KEY` is unset, so the production build does not need credentials. Those paths do not perform live API calls during `next build`.
