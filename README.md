# D-ID API Demo

## Documentation

| Document | Purpose |
|----------|---------|
| [`spec.md`](./spec.md) | Product behavior, current state, and roadmap (authoritative) |
| [`AGENTS.md`](./AGENTS.md) | Agent and contributor workflow for autonomous development |

## Project Description

This demo application showcases the integration of the D-ID API with a Next.js (App Router) application. The project enables users to generate and manage digital human videos, leveraging Firebase (Auth/Firestore/Storage), ElevenLabs (voice synthesis), and Stripe (payments).

## Tech Stack (from `package.json` / `yarn.lock`)

- **Framework**: Next.js `^16.2.4` (App Router)
- **UI**: React `^19.2.5`, Tailwind CSS `^4.2.4`, Framer Motion `^12.38.0`, Lucide React `1.8.0`, Styled Components `^6.4.1`
- **State**: Zustand `^5.0.12`
- **Forms**: React Hook Form `^7.73.1` (+ `@hookform/resolvers`), Yup `^1.7.1`
- **APIs**: D-ID (external), ElevenLabs via `@elevenlabs/elevenlabs-js` `^2.44.0`
- **Payments**: Stripe SDK `stripe` `^22.0.2`, `@stripe/react-stripe-js` `^6.2.0`, `@stripe/stripe-js` `^9.3.0`
- **Firebase**: `firebase` `^12.12.1` (client), `firebase-admin` `^13.8.0` (server/Admin SDK)

## Features

- **Create and Manage Digital Human Avatars**: Use the D-ID API to generate and manage digital human avatars.
- **Voice Synthesis**: Integrate the ElevenLabs API to add voice to digital humans.
- **Firebase Storage and Firestore**: Store and manage data in Firebase, including images and user details.
- **Payment Processing**: Handle payments within the application using Stripe.
- **Image Proxy Server**: Proxy Firebase Storage images through a custom API to address a bug in D-ID's handling of Firebase image URLs.
- **Server Actions in Next.js 16**: Use React Server Actions in Next.js 16 to interact with the D-ID API and manage server-side logic.
- **Polling and Webhooks**: Poll video generation status and register D-ID webhooks when the app has a public HTTPS base URL.

## Getting Started

### Prerequisites

Ensure you have the following tools installed:

- Latest version of [Node.js](https://nodejs.org/)
- [Firebase](https://firebase.google.com/) account for Firestore and Storage
- [D-ID API](https://www.d-id.com/) key
- [ElevenLabs API](https://elevenlabs.io/) key (for voice synthesis)
- [Stripe](https://stripe.com/) account for payment processing
- **Ngrok** (if testing locally)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/brown2020/d-id-api-demo.git
   cd d-id-api-demo
   ```

2. **Install the dependencies** (Yarn is the canonical package manager):

   ```bash
   yarn install
   ```

3. **Configure environment variables**:

   Create a `.env.local` file in the root directory with the following variables:

   ```plaintext
   NEXT_PUBLIC_API_BASE_URL=your_api_base_url

   NEXT_PUBLIC_STRIPE_PRODUCT_NAME=your_stripe_product_name
   NEXT_PUBLIC_STRIPE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret_key

   # D-ID API Authentication
   DID_API_KEY=your_did_api_key
   D_ID_BASIC_AUTH=your_did_basic_auth_string

   # ElevenLabs API key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

   # Firebase Client Config
   NEXT_PUBLIC_FIREBASE_APIKEY=your_firebase_apikey
   NEXT_PUBLIC_FIREBASE_AUTHDOMAIN=your_firebase_authdomain
   NEXT_PUBLIC_FIREBASE_PROJECTID=your_firebase_projectid
   NEXT_PUBLIC_FIREBASE_STORAGEBUCKET=your_firebase_storagebucket
   NEXT_PUBLIC_FIREBASE_MESSAGINGSENDERID=your_firebase_messagingsenderid
   NEXT_PUBLIC_FIREBASE_APPID=your_firebase_appid
   NEXT_PUBLIC_FIREBASE_MEASUREMENTID=your_firebase_measurementid

   # Firebase Server Config
   FIREBASE_TYPE=service_account
   FIREBASE_PROJECT_ID=your_firebase_project_id
   FIREBASE_PRIVATE_KEY_ID=your_firebase_private_key_id
   FIREBASE_PRIVATE_KEY=your_firebase_private_key
   FIREBASE_CLIENT_EMAIL=your_firebase_client_email
   FIREBASE_CLIENT_ID=your_firebase_client_id
   FIREBASE_AUTH_URI=your_firebase_auth_uri
   FIREBASE_TOKEN_URI=your_firebase_token_uri
   FIREBASE_AUTH_PROVIDER_X509_CERT_URL=your_firebase_auth_provider_cert_url
   FIREBASE_CLIENT_CERTS_URL=your_firebase_client_certs_url
   FIREBASE_UNIVERSE_DOMAIN=your_firebase_universe_domain
   ```

### Running Locally

To run this project locally, use Ngrok to expose your local server to the public internet because D-ID's API requires a public URL for image resources.

#### Setting Up Ngrok

1. [Download and install Ngrok](https://ngrok.com/download).
2. Start your local server:

   ```bash
   yarn dev
   ```

3. In a new terminal window, run:

   ```bash
   ngrok http 3000
   ```

4. Ngrok will provide a public URL that you can use to test your application with the D-ID API.

### Important Note

**API Keys**: Users must enter their ElevenLabs API key and D-ID API key in the profile section. These keys are user-specific and not fetched from the environment variables. The app will not function properly without these keys.

## Firebase Security Rules (from `firestore.rules` + `storage.rules`)

### Firestore (`firestore.rules`)

- **Default**: deny all reads/writes unless explicitly allowed.
- **`users/{userId}`**:
  - **read**: only the signed-in user can read their own user doc.
  - **create/update**: only for self, with explicit protections against client-side privilege/credits escalation.
  - **subcollections**:
    - `users/{userId}/profile/{docId}`: read/write self (private per-user profile data)
    - `users/{userId}/payments/{paymentId}`: read/write self (private per-user payment history)
- **`notifications/{notificationId}`**:
  - **read**: only if `resource.data.user_id == request.auth.uid`
  - **update**: owner can only change `status` (immutable `user_id`, `video_id`, `type`)
  - **create/delete**: denied for clients
- **`generated-videos/{videoId}`**:
  - private to owner via `owner` field (read/create/update/delete gated by ownership)
- **`didTalkingPhotos/{talkingPhotoId}`**:
  - **personal**: private to owner (`owner` field) and fully manageable by owner
  - **template**: readable by any signed-in user; updates limited to a safe “favorite” toggle in `favorite_of`
  - **subcollection** `didTalkingPhotos/{talkingPhotoId}/videos/{videoId}`: client read only for owner; all writes denied
- **Server-only collections**:
  - `webhook-history/*`: no client read/write
  - `error-report/*`: no client read/write

### Storage (`storage.rules`)

- **Default**: deny all reads/writes unless explicitly allowed.
- **Allowed client uploads (avatar images)**:
  - Path: `images/{uid}/{avatarId}/{fileName}`
  - **read/write**: only for the signed-in owner (`uid`)
  - **write constraints**: must be an `image/*` content type and **< 10MB**
- **Everything else**: server-managed (Admin SDK and/or signed URLs).

## Usage

### Development

To start the development server:

```bash
yarn dev
```

### Production

To build the project for production:

```bash
yarn build
```

## Main Features

- **Creating Digital Human Videos with Server Actions**: Demonstrates how to use React Server Actions in Next.js 16 to create digital human videos with the D-ID API. The `generateDIDVideo` server action handles video creation, allowing flexibility in using pre-recorded audio, text-to-speech, or silent video generation.

- **Polling vs. Webhooks**: The `retrieveDIDVideo` function uses polling to check when a video has been processed. Public HTTPS deployments also register a D-ID webhook for faster callbacks, while localhost stays polling-only.

### API Routes

- **`/api/imageproxy/[id]`**: Proxies avatar images from Firestore/Firebase Storage for D-ID (Firebase Storage URLs are not reliably accepted by D-ID).

- **`/api/video-image-proxy/[id]`**: Proxies video thumbnail images for D-ID.

  Example usage:

  ```bash
  GET /api/imageproxy/{document_id}.png
  ```

  This route fetches the image from Firebase Storage and serves it through your Next.js server with the appropriate headers, ensuring compatibility with D-ID's API.

## Application Structure

### Route protection

Authentication uses Firebase Auth on the client, an httpOnly session cookie (`__session`), and edge checks in `src/proxy.ts` for protected routes. Firestore/Storage access is constrained by `firestore.rules` and `storage.rules`. See `AGENTS.md` for protected path list and gaps.

### State Management

Uses [Zustand](https://github.com/pmndrs/zustand) to manage local state and synchronize it with Firebase. The state includes user profile information, such as email, display name, and API keys required for D-ID and ElevenLabs integrations.

### Server Actions

1. **Generate D-ID Video**:
   Utilizes the D-ID API to generate videos based on user-selected avatars and scripts, supporting both pre-recorded audio and text-to-speech options via the ElevenLabs API.
2. **Retrieve D-ID Video**:
   Polls the D-ID API to check video rendering status, downloads the video upon completion, uploads it to Firebase Storage, and stores metadata in Firestore.

### Pages

- **Avatars Page**:

  - Allows users to browse, create, and edit avatars from the D-ID API.
  - Displays avatars stored in Firebase, with options to filter by favorites or create new avatars.
  - Manages avatar details and creates new talking photos directly in the app.

- **Generate Page**:

  - Main interface for generating videos using selected avatars.
  - Allows input of a script and choice of voice settings (pre-recorded audio, text-to-speech, or silence).
  - Shows status and error messages during video generation and displays the generated video upon completion.
  - Provides access to previously generated videos for review.

- **Profile Page**:
  - Allows users to enter their API keys for D-ID and ElevenLabs, view profile details, and manage account settings.
  - Displays user authentication data (email, display name) via Firebase.
  - Integrates a payment page for purchasing additional credits for video generation.

## Contribution

Contributions are welcome! Fork the repository and submit a pull request with your changes. Ensure your code follows the existing style and includes relevant tests.

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**. See `LICENSE.md`.

## Acknowledgments

- [D-ID API](https://www.d-id.com/)
- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [ElevenLabs](https://elevenlabs.io/)
- [Stripe](https://stripe.com/)

## Known Issues

- **Firebase Image Proxy**: Due to a bug in the D-ID API's handling of Firebase Storage URLs, images must be proxied through a server.
- **Local Development**: The application requires a public URL for D-ID's API, necessitating the use of Ngrok or similar tools when testing locally.

### Summary

- **Next.js (App Router) and Server Actions**: Demonstrates the use of Next.js with the App Router and React Server Actions for D-ID API integration.
- **Polling vs. Webhooks**: Uses polling as the fallback status path and D-ID webhooks when a public HTTPS callback URL is available.
- **Production Command**: Explains the use of `yarn build` for production and emphasizes the need for Ngrok in local development.

## Contact

For more information or questions, please contact [info@ignitechannel.com](mailto:info@ignitechannel.com).
