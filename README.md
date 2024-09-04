# D-ID API Demo

## Project Description

This project is a demo application that showcases the integration of D-ID's API with a Next.js 14 application using the App Router. The project allows users to generate and manage digital human videos, leveraging technologies like Firebase for data storage, ElevenLabs for voice synthesis, and Stripe for payment processing.

## Features

- **Create and Manage Digital Human Avatars**: Utilize the D-ID API for generating and managing digital human avatars.
- **Voice Synthesis**: Integrate the ElevenLabs API for adding voice to digital humans.
- **Firebase Storage and Firestore**: Store and manage data in Firebase, including images and user details.
- **Payment Processing**: Use Stripe for handling payments within the application.
- **Image Proxy Server**: A workaround is included to proxy Firebase Storage images through a custom API due to a bug with D-ID's handling of Firebase image URLs.
- **Server Actions in Next.js 14**: Demonstrates the use of React Server Actions in Next.js 14 to interact with the D-ID API and manage server-side logic.
- **Polling and Webhooks**: The project includes a polling mechanism to check the status of video generation but also suggests using webhooks for more efficient real-time updates.

## Getting Started

### Prerequisites

Make sure you have the following tools installed:

- Latest version of [Node.js](https://nodejs.org/)
- [Firebase](https://firebase.google.com/) account for Firestore and Storage
- [D-ID API](https://www.d-id.com/) key
- [ElevenLabs API](https://elevenlabs.io/) key (for voice synthesis)
- [Stripe](https://stripe.com/) account for payment processing
- **Ngrok** (for tunneling localhost, if testing locally)

### Installation

1. **Clone the repository**:

   ```bash
   git clone https://github.com/your-username/d-id-api-demo.git
   cd d-id-api-demo
   ```

2. **Install the dependencies**:

   ```bash
   npm install
   ```

   or

   ```bash
   yarn install
   ```

3. **Configure environment variables**:

   Create a `.env.local` file in the root directory with the following variables:

   ```plaintext
   NEXT_PUBLIC_API_BASE_URL=your_api_base_url
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key

   NEXT_PUBLIC_STRIPE_PRODUCT_NAME=your_stripe_product_name
   NEXT_PUBLIC_STRIPE_KEY=your_stripe_key
   STRIPE_SECRET_KEY=your_stripe_secret_key

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

If you are running this project locally, you'll need to use Ngrok to expose your local server to the public internet because D-ID's API requires a public URL for the image resources.

#### Steps to Set Up Ngrok

1. [Download and install Ngrok](https://ngrok.com/download).
2. Start your local server:

   ```bash
   npm run dev
   ```

3. In a new terminal window, run:

   ```bash
   ngrok http 3000
   ```

4. Ngrok will provide a public URL that you can use to test your application with the D-ID API.

### Important Note

**API Keys**: Users must enter their ElevenLabs API key and D-ID API key in the profile section. These are user-specific variables and are not taken from the environment variables. Without these, the app won't function as intended.

## Usage

### Development

To start the development server:

```bash
npm run dev
```

### Production

To build the project for production:

```bash
npm run build
```

## Main Features

- **Creating Digital Human Videos with Server Actions**: The project demonstrates how to use React Server Actions in Next.js 14 to create digital human videos with the D-ID API. The `generateDIDVideo` server action handles the video creation, allowing flexibility in using pre-recorded audio, text-to-speech, or silent video generation.

- **Polling vs. Webhooks**: The `retrieveDIDVideo` function implements polling to check when a video has been processed. Although polling is effective, the project suggests using webhooks for more efficient real-time updates. Webhooks provide a more scalable and event-driven approach.

### API Routes

- **`/api/proxy-image/[id]`**: This API route is used to proxy images from Firebase Storage to D-ID API due to a bug in D-ID's handling of Firebase Storage URLs.

  Example usage:

  ```bash
  GET /api/proxy-image/{image_id}.png
  ```

  This route fetches the image from Firebase Storage and serves it through your Next.js server with the appropriate headers, ensuring compatibility with D-ID's API.

## Application Structure

### Middleware

The middleware uses [Clerk's middleware](https://clerk.dev/docs/nextjs) to protect specific routes. It checks if a route requires authentication and, if so, enforces the necessary protection.

### State Management

The application uses [Zustand](https://github.com/pmndrs/zustand) to manage local state and synchronize it with Firebase. The state includes the user's profile information, such as email, display name, and API keys required for D-ID and ElevenLabs integrations.

### Server Actions

1. **Generate D-ID Video**:
   Utilizes the D-ID API to generate videos based on user-selected avatars and scripts. It supports both pre-recorded audio and text-to-speech options using the ElevenLabs API.
2. **Retrieve D-ID Video**:
   Polls the D-ID API to check the status of the video rendering, downloads it upon completion, uploads it to Firebase Storage, and stores the metadata in Firestore.

### Pages

- **Avatars Page**:

  - Allows users to browse, create, and edit avatars from the D-ID API.
  - Displays a list of avatars stored in Firebase and provides options to filter by favorites or create new avatars.
  - Users can manage avatar details and create new talking photos directly in the app.

- **Generate Page**:

  - The primary interface for generating videos using selected avatars.
  - Allows users to input a script and choose from different voice settings (pre-recorded audio, text-to-speech, or silence).
  - Displays status and error messages during the video generation process, and shows the generated video upon completion.
  - Provides access to previously generated videos for review.

- **Profile Page**:
  - Allows users to enter their API keys for D-ID and ElevenLabs, view their profile details, and manage their account settings.
  - Displays user authentication data, including email and display name, using Clerk.
  - Integrates a payment page for purchasing additional credits for video generation.

## Contribution

Feel free to fork this repository and submit pull requests. Please ensure your code adheres to the existing style and includes relevant tests.

## License

This project is licensed under the MIT License.

## Acknowledgments

- [D-ID API](https://www.d-id.com/)
- [Next.js](https://nextjs.org/)
- [Firebase](https://firebase.google.com/)
- [ElevenLabs](https://elevenlabs.io/)
- [Stripe](https://stripe.com/)

## Known Issues

- **Firebase Image Proxy**: Due to a bug in the D-ID API not recognizing Firebase Storage URLs, images must be proxied through a server.
- **Local Development**: The application requires a public URL for D-ID's API, which necessitates the use of Ngrok or similar tools when testing locally.

### Summary

- **Next.js 14 with App Router and Server Actions**: Highlights the use of Next.js 14 with the App Router and the use of React Server Actions for interacting with the D-ID API.
- **Polling vs. Webhooks**: Includes information about the use of polling to check video generation status and suggests using webhooks for more efficient real-time updates.
- **Production Command**: Clarifies the usage of `npm run build` for building the project and emphasizes the importance of using Ngrok for local development.

## Contact

For more information or questions, please contact [info@ignitechannel.com](mailto:info@ignitechannel.com).
