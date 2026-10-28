# Product specification — D-ID API Demo

Current behavior of the `dev` branch. Next steps, known bugs, and open issues are in [roadmap.md](./roadmap.md).

## Product

A reference app for a D-ID talking-head workflow on Next.js: sign in, store API keys, manage avatars, generate video from a script or a canvas, pay for credits, and keep the finished file in Firebase Storage.

It is a demo with real integrations, not a consumer editor. Operators run it on Vercel or locally. Local image and webhook calls from D-ID need a public HTTPS origin (ngrok or a deploy).

## Users and flows

1. Sign in with Google or email/password. The client keeps a Firebase session. `POST /api/auth` sets an httpOnly `__session` cookie. Sign-out revokes refresh tokens and clears the cookie.
2. Profile holds the D-ID key, the ElevenLabs key, and the credit balance (`users/{uid}/profile/userData`). New profiles start at 1000 credits.
3. Create personal talking photos or favorite templates in `didTalkingPhotos`.
4. Generate from `/generate` (one avatar, script, TTS, or uploaded audio) or from `/videos/create` (Fabric.js scenes). Each submission costs 1 credit, refunded if the D-ID call fails.
5. The app polls D-ID. On a public HTTPS origin it also registers `/api/video-generated/{id}`. The handler copies an allowlisted D-ID result into Storage.
6. `/videos` and `/videos/[id]/show` list and play videos. The header listens for unread notifications.
7. `/payment-attempt` starts a Stripe PaymentIntent for the $99.99 pack (9999 cents). `/payment-success` calls `fulfillPayment`, which grants 10000 credits once.

Protected prefixes: `/avatars`, `/generate`, `/payment-attempt`, `/payment-success`, `/profile`, `/videos`. The edge proxy checks that the session cookie exists. Server actions and sensitive API routes verify it.

## Features as built

| Feature | Behavior |
|---------|----------|
| Auth | Google popup and email/password. Session cookie verified with revocation check. |
| Profile | Client can update allowlisted profile fields. `credits` is required and cannot be changed by the client. |
| Avatars | Personal avatars are owner-scoped. Templates are readable. A personal avatar cannot be updated into a template. |
| Simple generate | Validates keys, script, base URL, and credits, then calls D-ID. |
| Canvas composer | Multi-scene Fabric.js editor. Save and submit go through the same generation action. |
| Library | Owner-scoped Firestore queries. Playback uses a Storage signed URL after the result is copied. |
| Image proxies | `/api/imageproxy/[id]` and `/api/video-image-proxy/[id]` read owned bucket objects via the Admin SDK, sniff a raster type, and do not fetch arbitrary URLs. |
| Voice | ElevenLabs list and TTS use the profile key. Server env keys are not a fallback. |
| Webhooks | Query token or HMAC of the raw body. History is a short redacted line. Result downloads stay on D-ID S3 hosts. |
| Credits | Admin transaction debits 1 credit before the D-ID call and refunds that debit if submission fails. |
| Payments | Only the 9999-cent pack can be created. Fulfillment checks `metadata.userId` and is idempotent. |
| Notifications | `status: "unread"` and unix-seconds `created_at`. |
| Diagnostics | `/api/debug`, `/api/key-diagnostics`, `/api/test-image-access`, and `/api/check-did-image-access` are local-development only. ID lists require a session and return that user's ids. |
| Tests | Vitest covers route protection, webhook URL and auth, storage and app URL allowlists, video status, and credit math. |
| CI | GitHub Actions on Node 22 runs lint, typecheck, test, and a production build with no secrets. |

## Architecture

Browser (Firebase client + Zustand) sends an ID token to `POST /api/auth`. `src/proxy.ts` redirects protected pages when the cookie is missing. Pages are mostly server components that render client UI. Privileged work is in server actions (`protect` / `getCurrentUser`) and route handlers (`requireApiSession`).

Generation order: allowlist the app base URL, create the video document, copy the thumbnail into Storage, save `secret_token`, debit 1 credit, call D-ID. The webhook or the poller downloads the result and writes a Storage URL.

Public base URL comes from the request host, `NEXT_PUBLIC_API_BASE_URL`, or `https://didapidemo.vercel.app`. Generation image URLs must be one of those origins or the exact fallback headshot. `getWebhookUrl` returns null on localhost.

## Integrations

| Service | Use |
|---------|-----|
| D-ID | `POST /talks` and `GET /talks/{id}` with the signed-in user's key |
| ElevenLabs | Voice list and TTS through the profile key |
| Firebase Auth | Google and email/password |
| Firestore | Users, profiles, avatars, videos, notifications, webhook history |
| Firebase Storage | Avatars, thumbnails, rendered video |
| Stripe | One PaymentIntent for the credit pack. No Stripe webhook route. |

The app does not call an LLM provider. D-ID and ElevenLabs model or voice ids are whatever the user and those APIs already use. This spec does not change them.

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
- Generation does not fall back to `DID_API_KEY`, `D_ID_BASIC_AUTH`, or `ELEVENLABS_API_KEY`.
- Missing or non-numeric credit balance is treated as zero.
- License is AGPL-3.0-only.
- Package manager is Yarn 1. There is no `package-lock.json`.
- Client Firebase SDK stays on 12.x until the runtime is Node `>=24.12.0`. See [roadmap.md](./roadmap.md).

## Build without secrets

`firebaseClient` skips initialization when the public web config is missing. `firebaseAdmin` catches a failed `initializeApp` and logs a warning. Stripe is constructed with an empty string when `STRIPE_SECRET_KEY` is unset, so the production build does not need credentials. Those paths do not perform live API calls during `next build`.
