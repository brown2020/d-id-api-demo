# Roadmap — D-ID API Demo

Punchlist for `dev` after the October 2026 security and maintenance passes. This is not a schedule. Promotion to `main` happens after QA.

## Needs a human

- Deploy Firestore rules and indexes. CI does not deploy them. From a machine with Firebase credentials: `firebase deploy --only firestore:rules,firestore:indexes,storage`. Files: `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Storage rules did not change in the security pass; the Firestore rules and the three composite indexes did.
- Move the runtime to Node `>=24.12.0` before upgrading the Firebase JS SDK from 12.19.0 to 13.x. Firebase 13 depends on `@firebase/ai@3`, whose engine is `node >=24.12.0`. Yarn refuses that install on Node 22, which is what `.github/workflows/ci.yml` uses. Vercel project settings were not changed. `firebase-admin` is already 14.5.0 and installs on Node 22.
- Confirm D-ID's real webhook signature header. The handler accepts the per-video query token or an HMAC-SHA256 of the raw body. An unknown signature header does not override a valid token. A vendor-specific scheme was not added because this repo does not document D-ID's header format.
- QA the credit debit, refund, image proxies, and webhook on a real D-ID account before promoting `dev` to `main`.

## Next product work

- Onboarding checklist on Profile: signed in, D-ID key, ElevenLabs key, at least one avatar, and a link to diagnostics when a key is missing. Generate pages already reject a missing key on the server.
- Canvas editor: persist emotion and movement on draft save, reload them on `/videos/[id]/edit`, and keep the avatar preview on the proxy URL.
- Migrate old video documents whose `owner` is the literal `"user"` so the library and rules match the authenticated uid.
- Replace `createDIDAvatarProfile` with a path that validates the talking photo and saves it. The current helper only builds a local object.
- Finish edit-existing-video checks in `generateVideo` (validation when `video_id` is passed).

## Known bugs and limits

- The edge proxy checks cookie presence only. Verification with revocation happens in server actions and API helpers, not at the edge.
- Playback signed URLs written after a successful copy are long-lived (`03-17-2125` / `01-01-2124`). `getFileUrl` expires in one hour. Gallery `<img>` tags use the proxies so that short TTL does not blank the page.
- Profiles created before `credits` was required cannot be updated by the client until a server write sets the field.
- Diagnostic pages (`/diagnostic`, `/test-*`, `/api-diagnostics`) are still public. Their API routes 404 outside local development.
- `getWebhookUrl` still accepts any public HTTPS URL. Callers allowlist the origin before using it.
- Yarn prints incompatible-resolution warnings for `protobufjs@8.8.1` (requested `^7`) and `@grpc/grpc-js@1.14.6` (Firebase Firestore still requests `~1.9.0`). Both pins are intentional and `yarn audit` / `npm audit` report no vulnerabilities. Do not drop the `jwks-rsa` → `jose@5.10.0` pin while `firebase-admin` 14 and `jwks-rsa` 4 are installed.
- TypeScript 7.0 is published. `typescript-eslint` 8.72 only allows TypeScript `<6.1.0`, so the app stays on TypeScript 6.0.3.
- `FIREBASE_UNIVERSE_DOMAIN` and `IS_LOCAL` are in `.env.example` and are not read by application code.
- No Stripe webhook is implemented. Credit grants happen when the success page calls `fulfillPayment`. A buyer who never returns does not get credits until that call runs.
- `glob@10` under `google-gax` / `rimraf` prints an upstream deprecation during install. It is not a current `npm audit` finding.
