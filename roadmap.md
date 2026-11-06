# Roadmap — D-ID API Demo

Punchlist for `dev` after the November 2026 V4/Agents modernization. This is not a schedule. Promotion to `main` happens after QA.

## Completed in November 2026 Modernization

- ✅ V4 Expressive Avatar integration (`/expressive` page)
  - List avatars and sentiments via `GET /expressives/avatars`
  - Create videos via `POST /expressives` with sentiment selection
  - Poll and display status with `GET /expressives/{id}`
  - Demo mode for missing keys/auth failures
  - Credit debit/refund for V4 generations
- ✅ Realtime Agents integration (`/agents` page)
  - Create agents via `POST /agents`
  - Generate client keys via `POST /agents/client-key`
  - Embed code generation for website integration
  - Agent management dashboard
- ✅ Updated home page to showcase V4 + Agents as primary features
- ✅ De-emphasized legacy V2 workflows in navigation
- ✅ Firestore rules and indexes for new collections (`expressive-videos`, `agents`)
- ✅ Protected routes for `/expressive` and `/agents`
- ✅ Full documentation updates (README, spec.md, roadmap.md)
- ✅ CI green: lint, typecheck, test, build all passing

## Needs a human

- Deploy Firestore rules and indexes. CI does not deploy them. From a machine with Firebase credentials: `firebase deploy --only firestore:rules,firestore:indexes,storage`. Files: `firestore.rules`, `firestore.indexes.json`, `storage.rules`. Storage rules did not change in the security pass; the Firestore rules and the three composite indexes did.
- Confirm the Vercel runtime is Node `>=24.12.0`. The Firebase JS SDK is 13.1 and depends on `@firebase/ai`, whose engine is `node >=24.12.0`. CI already uses Node 24. Vercel project settings were not changed in this pass. `firebase-admin` is 14.5.0.
- Confirm D-ID's real webhook signature header. The handler accepts the per-video query token or an HMAC-SHA256 of the raw body. An unknown signature header does not override a valid token. A vendor-specific scheme was not added because this repo does not document D-ID's header format.
- QA the credit debit, refund, image proxies, and webhook on a real D-ID account before promoting `dev` to `main`.

## Next product work (V4/Agents enhancements)

- **V4 Expressive Videos**: Add expressive video library view (`/expressive/library`) similar to `/videos` for V2 content
- **Agent Configuration**: Add UI for custom LLM settings (OpenAI/Google model selection, API keys)
- **Agent Knowledge Base**: UI for uploading knowledge documents to agents (RAG configuration)
- **Agent Voice Customization**: UI for selecting custom voices beyond default Azure
- **Unified Video Library**: Merge V2 and V4 videos into single library view with filtering
- **Expressive Video Storage**: Download and store V4 result videos in Firebase Storage (currently only displays D-ID URLs)
- **Agent Testing**: In-app agent preview/testing interface before deploying
- **Sentiment Previews**: Show sentiment emotion previews in avatar selection grid

## Next product work (Legacy/Infrastructure)

- Onboarding checklist on Profile: signed in, D-ID key, ElevenLabs key, at least one avatar, and a link to diagnostics when a key is missing
- Canvas editor: persist emotion and movement on draft save, reload them on `/videos/[id]/edit`, and keep the avatar preview on the proxy URL
- Migrate old video documents whose `owner` is the literal `"user"` so the library and rules match the authenticated uid
- Replace `createDIDAvatarProfile` with a path that validates the talking photo and saves it. The current helper only builds a local object
- Finish edit-existing-video checks in `generateVideo` (validation when `video_id` is passed)

## Known bugs and limits

### V4/Agents Specific
- Agent client keys are domain-restricted. Production domains must be allowlisted in D-ID console (documented in UI)
- V4 expressive videos are not downloaded to Firebase Storage; playback uses D-ID result URLs directly
- No V4 video library page yet (expressive videos only viewable during generation)
- Agent creation uses hardcoded default presenter (Amber) and voice (Azure Jenny). Custom selection UI not yet implemented
- No agent LLM or knowledge base configuration UI (agents use default D-ID behavior)
- V4 webhook support not implemented (uses polling only)
- Notifications only fire for V2 video completion (V4 videos complete inline during polling)

### General
- The edge proxy checks cookie presence only. Verification with revocation happens in server actions and API helpers, not at the edge
- Playback signed URLs written after a successful copy are long-lived (`03-17-2125` / `01-01-2124`). `getFileUrl` expires in one hour. Gallery `<img>` tags use the proxies so that short TTL does not blank the page
- Profiles created before `credits` was required cannot be updated by the client until a server write sets the field
- Diagnostic pages (`/diagnostic`, `/test-*`, `/api-diagnostics`) are still public. Their API routes 404 outside local development
- `getWebhookUrl` still accepts any public HTTPS URL. Callers allowlist the origin before using it (V2 only)
- Yarn prints incompatible-resolution warnings for `protobufjs@8.8.1` (requested `^7`) and `@grpc/grpc-js@1.14.6` (Firebase Firestore still requests `~1.9.0`). Both pins are intentional and `yarn audit` / `npm audit` report no vulnerabilities. Do not drop the `jwks-rsa` → `jose@5.10.0` pin while `firebase-admin` 14 and `jwks-rsa` 4 are installed
- TypeScript 7.0.2 is published. `eslint-config-next` 16.4 still depends on `typescript-eslint` 8.72, which only allows TypeScript `<6.1.0`, so the app stays on TypeScript 6.0.3
- `FIREBASE_UNIVERSE_DOMAIN` and `IS_LOCAL` are in `.env.example` and are not read by application code
- No Stripe webhook is implemented. Credit grants happen when the success page calls `fulfillPayment`. A buyer who never returns does not get credits until that call runs
- `glob@10` under `google-gax` / `rimraf` prints an upstream deprecation during install. It is not a current `npm audit` finding
- Node 24.12+ required for `@firebase/ai` package; local dev may need `--ignore-engines` flag with older Node versions
