# D-ID API Demo

Reference Next.js app for D-ID talking-head video workflows: sign in, manage avatars, generate videos (simple or Fabric.js multi-scene), synthesize voice with ElevenLabs, store assets in Firebase, and buy credits with Stripe. Demo: [https://d-id-api-demo.vercel.app](https://d-id-api-demo.vercel.app)

## Features

Verified from the current codebase:

- **Avatars / talking photos** — create and manage D-ID talking photos (`/avatars`)
- **Simple generate** — `/generate` script + TTS or custom audio → poll status
- **Advanced create** — `/videos/create` Fabric.js canvas (scenes, emotions, movements)
- **Video library** — list, show, and edit under `/videos`
- **ElevenLabs voices** — voice list and TTS when a profile API key is set
- **Image / video proxies** — API routes so D-ID can fetch Firebase Storage URLs reliably
- **Webhooks + polling** — D-ID webhook URL helpers when a public HTTPS base is available
- **Auth & profile** — Firebase Auth; profile stores per-user D-ID / ElevenLabs keys and credits
- **Stripe credits** — payment attempt/success flows
- **Diagnostics** — pages/APIs for keys, image access, ngrok/base URL setup (`/api-diagnostics`, `/diagnostic`, `/ngrok-setup`, etc.)

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router, Server Actions) |
| UI | React 19, Tailwind CSS 4, Framer Motion, Lucide, styled-components |
| Language | TypeScript 6 |
| Forms | react-hook-form, Yup |
| State | Zustand 5 |
| Canvas | Fabric.js 7 |
| D-ID | External REST API (`DID_API_KEY` / Basic auth) |
| Voice | ElevenLabs JS SDK |
| Backend | Firebase 12 + firebase-admin 13 (Auth, Firestore, Storage) |
| Payments | Stripe |
| HTTP | axios |
| Toasts | react-hot-toast |
| Package manager | **Yarn 1** (`packageManager`: `yarn@1.22.22`, lockfile `yarn.lock`) |
| Tests | Vitest 3 |
| Node (CI) | 22 |

`.npmrc` sets `legacy-peer-deps=true` (relevant if using npm; prefer Yarn as above).

## Project structure

```
d-id-api-demo/
├── src/
│   ├── app/              # Pages + API routes (proxies, diagnostics, webhooks helpers)
│   ├── actions/          # Server Actions (D-ID / generation)
│   ├── components/       # create-video, video-show, shared UI
│   ├── firebase/         # Client + Admin Firebase setup
│   ├── libs/             # D-ID helpers, webhooks, payments, auth constants
│   ├── hooks/, zustand/, utils/, types/, assets/
├── .env.example
├── firestore.rules
├── storage.rules
├── cors.json
└── .github/workflows/ci.yml
```

## Getting started

### Prerequisites

- Node.js 22+
- Yarn 1.22.x
- Firebase project (Auth, Firestore, Storage)
- D-ID API key
- ElevenLabs API key (for TTS)
- Stripe account (for credit purchases)
- Public HTTPS URL for D-ID webhooks in non-local use (Vercel or ngrok)

### Install

```bash
git clone https://github.com/brown2020/d-id-api-demo.git
cd d-id-api-demo
git checkout dev
yarn install
cp .env.example .env.local
# fill in values — never commit secrets
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). For local webhooks/image access from D-ID, use the in-app ngrok setup pages or set `NEXT_PUBLIC_API_BASE_URL` to a public HTTPS origin.

## Environment variables

| Name | Purpose | Where to get it |
|------|---------|-----------------|
| `NEXT_PUBLIC_FIREBASE_APIKEY` | Firebase web API key | Firebase Console → Your apps |
| `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` | Auth domain | Same |
| `NEXT_PUBLIC_FIREBASE_PROJECTID` | Project ID | Same |
| `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` | Storage bucket | Same |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` | Messaging sender ID | Same |
| `NEXT_PUBLIC_FIREBASE_APPID` | App ID | Same |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | Analytics ID | Optional |
| `FIREBASE_TYPE` | Admin credential type (`service_account`) | Service account JSON |
| `FIREBASE_PROJECT_ID` | Admin project ID | Same |
| `FIREBASE_PRIVATE_KEY_ID` | Key ID | Same |
| `FIREBASE_PRIVATE_KEY` | Private key | Same |
| `FIREBASE_CLIENT_EMAIL` | Client email | Same |
| `FIREBASE_CLIENT_ID` | Client ID | Same |
| `FIREBASE_AUTH_URI` | OAuth auth URI | Same / Google defaults |
| `FIREBASE_TOKEN_URI` | Token URI | Same |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Cert URL | Same |
| `FIREBASE_CLIENT_CERTS_URL` | Client certs URL | Same |
| `FIREBASE_UNIVERSE_DOMAIN` | Universe domain | Same |
| `DID_API_KEY` | Server D-ID API key | [studio.d-id.com](https://studio.d-id.com) / D-ID console |
| `D_ID_BASIC_AUTH` | Optional Basic auth header value for D-ID | Derived from D-ID key (see `/basic-auth-generator`) |
| `ELEVENLABS_API_KEY` | Server fallback ElevenLabs key | [elevenlabs.io](https://elevenlabs.io) |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key | Stripe Dashboard |
| `STRIPE_SECRET_KEY` | Stripe secret key | Stripe Dashboard |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | Product name for credit checkout | Stripe product config |
| `NEXT_PUBLIC_API_BASE_URL` | Public HTTPS base for proxies/webhooks | Your deploy URL or ngrok |
| `NEXT_PUBLIC_USE_EMULATOR` | Point client at Firebase emulators | Optional |
| `IS_LOCAL` | Local-mode flag from `.env.example` | Optional |

Users can also store personal D-ID / ElevenLabs keys on their profile for client-side voice listing and generation flows.

## Firebase

- Rules: `firestore.rules`, `storage.rules`
- `cors.json` for Storage CORS when D-ID must fetch objects

Deploy rules with the Firebase CLI as needed.

## Scripts

| Script | Description |
|--------|-------------|
| `yarn dev` | Next.js dev server |
| `yarn build` | Production build |
| `yarn start` | Serve production build |
| `yarn lint` | ESLint (`--max-warnings 0`) |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Vitest |
| `yarn validate` | lint + typecheck + test + build |

## Testing and CI

Vitest covers libs (payment credits, video status, auth constants, webhook URL, Firebase auth errors).

GitHub Actions (`.github/workflows/ci.yml`) on `dev` / `main` and PRs: `yarn install --frozen-lockfile` → lint → typecheck → test → build (Node 22). Client Firebase secrets are optional for this gate (build skips client init when unset).

## Deployment

Typical host: Vercel ([https://d-id-api-demo.vercel.app](https://d-id-api-demo.vercel.app)). Set env vars in the project. Ensure `NEXT_PUBLIC_API_BASE_URL` is the production HTTPS origin so D-ID webhooks and image proxies work. `next.config.mjs` allows remote images from Firebase Storage, Google user content, and related hosts; Server Actions body size limit is 3mb.

## Contributing

- `main` — production
- `dev` — integration

See [AGENTS.md](./AGENTS.md) and [spec.md](./spec.md). Prefer Yarn to match the lockfile.

## License

[GNU Affero General Public License v3](./LICENSE.md) (AGPL-3.0-only per `package.json`).
