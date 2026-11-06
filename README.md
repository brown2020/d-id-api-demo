# D-ID API Demo

Next.js 16 demo showcasing D-ID's modern API capabilities: V4 Expressive Avatars with emotional sentiments, Realtime Conversational Agents, and legacy talking-photo workflows. Features Firebase auth/storage, ElevenLabs voice synthesis, and Stripe credit payments.

Demo: [https://d-id-api-demo.vercel.app](https://d-id-api-demo.vercel.app)

Product behavior is in [spec.md](./spec.md). Next steps and open issues are in [roadmap.md](./roadmap.md).

## Features

### V4 Expressive Avatars (Primary)
- **Create emotional videos** with D-ID's V4 expressive avatars (`/expressive`)
- Select from multiple avatars and sentiments (Professional, Empathetic, Excited, Friendly, etc.)
- Real-time polling for video generation status
- Automatic demo mode when no API key is configured
- Full integration with D-ID's `/expressives` API endpoint
- Documentation: [V4 Expressive Avatar Quickstart](https://docs.d-id.com/docs/v4-expressive-avatar-quickstart)

### Realtime Agents (Primary)
- **Create conversational AI agents** with live video avatars (`/agents`)
- Generate client keys for embedding agents on websites
- One-click embed code generation for quick integration
- Agent management dashboard with full configuration
- Support for custom presenters and voice configurations
- Documentation: [D-ID Realtime Overview](https://docs.d-id.com/docs/realtime-overview) | [Embed Quickstart](https://docs.d-id.com/docs/embed-quickstart)

### Core Infrastructure
- Google and email/password sign-in with Firebase Auth
- Profile stores each user's D-ID key, ElevenLabs key, and credit balance
- Server actions use an httpOnly `__session` cookie for security
- Stripe checkout for credit packs (server-side credit management)
- Image proxies so D-ID can fetch Firebase-backed images
- Video library and playback with real-time status updates

### Legacy Features
- Avatar library for personal talking photos and templates (`/avatars`)
- V2 simple generation (`/generate`)
- Fabric.js multi-scene composer (`/videos/create`, `/videos/[id]/edit`)
- Local-only diagnostics for keys, image access, and ngrok

## Tech stack

| Area | Package |
|------|---------|
| Framework | Next.js 16.4, React 19.3, TypeScript 6.0 |
| UI | Tailwind CSS 4.3, styled-components 6.6, Framer Motion 14.9, Lucide 1.66 |
| Forms | react-hook-form 7.91, Yup 1.7 |
| State | Zustand 5.0 |
| Canvas | Fabric.js 7.4 |
| Voice | `@elevenlabs/elevenlabs-js` 2.75 |
| Client data | `firebase` 13.1 (Auth, Firestore, Storage) |
| Server data | `firebase-admin` 14.5 |
| Payments | `stripe` 23.1, `@stripe/stripe-js` 10, `@stripe/react-stripe-js` 7 |
| HTTP | axios 1.21 |
| Tests | Vitest 5, Vite 8 |
| Lint | ESLint 10, `eslint-config-next` 16.4 |
| Package manager | Yarn 1.22 (`yarn.lock` only) |
| Node (CI) | 24 |

`firebase-admin` 14 depends on `jwks-rsa` 4. This repo pins that package's `jose` dependency to 5.10.0 (see `overrides` and `resolutions` in `package.json`).

The Firebase JS SDK is 13.1. It pulls `@firebase/ai`, which requires Node `>=24.12.0`. CI uses Node 24, which satisfies that engine. TypeScript stays on 6.0.3 because `eslint-config-next` 16.4 depends on `typescript-eslint` 8.72, which only allows TypeScript `<6.1.0`.

## Project structure

```
src/
  app/          # App Router pages and API routes
  actions/      # Server actions (D-ID, Stripe, auth)
  components/   # UI, including the canvas composer
  firebase/     # Client SDK and Admin SDK setup
  libs/         # Auth, credits, URL allowlists
  server/       # Admin helpers that are not server actions
  zustand/      # Client stores
firestore.rules
firestore.indexes.json
storage.rules
.github/workflows/ci.yml
```

## Setup

Requirements: Node.js 24, Yarn 1.22, a Firebase project (Auth, Firestore, Storage), a Stripe account for checkout, and a public HTTPS origin when D-ID must reach this app (Vercel or ngrok). Users paste their own D-ID and ElevenLabs keys into Profile. With no D-ID key, or when D-ID returns an auth, credit, or quota error, generation plays the bundled sample in `public/demo/` and labels it in the UI.

```bash
git clone https://github.com/brown2020/d-id-api-demo.git
cd d-id-api-demo
git checkout dev
yarn install
cp .env.example .env.local
yarn dev
```

Open [http://localhost:3000](http://localhost:3000). Fill `.env.local` from the names below. Do not commit secrets.

`yarn build` succeeds when Firebase and Stripe env vars are unset. The client SDK skips init, and Admin init is caught so static generation can finish. Runtime sign-in, storage, and checkout still need the variables set.

## Environment variables

| Name | Role |
|------|------|
| `NEXT_PUBLIC_FIREBASE_APIKEY` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_AUTHDOMAIN` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_PROJECTID` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_STORAGEBUCKET` | Firebase web config and server bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_APPID` | Firebase web config |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENTID` | Optional Analytics id |
| `NEXT_PUBLIC_USE_EMULATOR` | When `true` in development, the client uses the Auth emulator |
| `FIREBASE_TYPE` | Admin service account |
| `FIREBASE_PROJECT_ID` | Admin service account |
| `FIREBASE_PRIVATE_KEY_ID` | Admin service account |
| `FIREBASE_PRIVATE_KEY` | Admin service account |
| `FIREBASE_CLIENT_EMAIL` | Admin service account |
| `FIREBASE_CLIENT_ID` | Admin service account |
| `FIREBASE_AUTH_URI` | Admin service account |
| `FIREBASE_TOKEN_URI` | Admin service account |
| `FIREBASE_AUTH_PROVIDER_X509_CERT_URL` | Admin service account |
| `FIREBASE_CLIENT_CERTS_URL` | Admin service account |
| `FIREBASE_UNIVERSE_DOMAIN` | Admin service account (present in `.env.example`; not read by the app) |
| `NEXT_PUBLIC_STRIPE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PRODUCT_NAME` | Label stored on the PaymentIntent |
| `NEXT_PUBLIC_API_BASE_URL` | Public HTTPS origin for webhooks and image URLs. Browser calls use the page origin when it is allowed. |
| `DID_API_KEY` | Optional. Diagnostics only. A profile with no D-ID key plays the bundled sample and does not call D-ID or spend credits. |
| `D_ID_BASIC_AUTH` | Optional. Local diagnostics only. Not a generation fallback. |
| `ELEVENLABS_API_KEY` | Optional. Local diagnostics only. Voice calls use the profile key. |
| `IS_LOCAL` | Optional flag present in `.env.example`. Local vs production gating uses `NODE_ENV` and `VERCEL_ENV`. |

`NODE_ENV` and `VERCEL_ENV` are set by the platform. Diagnostic API routes respond only when `VERCEL_ENV` is unset or `development`, and `NODE_ENV` is not `production`.

## Scripts

| Script | What it does |
|--------|----------------|
| `yarn dev` | Next.js dev server |
| `yarn build` | Production build |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint, zero warnings |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` | Vitest once |
| `yarn validate` | lint, typecheck, test, and build |

## CI

`.github/workflows/ci.yml` runs on `dev`, `main`, and pull requests: `yarn install --frozen-lockfile`, lint, typecheck, test, and build on Node 24. No secrets are injected. The build is expected to pass without Firebase or Stripe credentials.

## Firebase rules

Rules and indexes in git are not deployed by CI. Apply them with the Firebase CLI when you are ready:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

Files: `firestore.rules`, `firestore.indexes.json`, `storage.rules`. `cors.json` is the Storage CORS document for buckets D-ID must read.

## Deployment

The production host is Vercel. Set the env var names above in the project. Set `NEXT_PUBLIC_API_BASE_URL` to the public HTTPS origin so webhooks and image URLs match the app. Localhost uses polling only.

## License

[GNU Affero General Public License v3](./LICENSE.md) (`AGPL-3.0-only`).
