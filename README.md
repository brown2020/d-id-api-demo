# D-ID API Demo

## Project Description

This project is a demo application that showcases the integration of D-ID's API with a Next.js 14 application using the App Router. The project allows users to generate and manage digital human videos, leveraging technologies like Firebase for data storage, ElevenLabs for voice synthesis, and Stripe for payment processing.

## Features

- **Create and Manage Digital Human Avatars**: Utilize D-ID API for generating and managing digital human avatars.
- **Voice Synthesis**: Integrate ElevenLabs API for adding voice to digital humans.
- **Firebase Storage and Firestore**: Store and manage data in Firebase, including images and user details.
- **Payment Processing**: Use Stripe for handling payments within the application.
- **Image Proxy Server**: A workaround is included to proxy Firebase Storage images through a custom API due to a bug with D-ID's handling of Firebase image URLs.
- **Server Actions in Next.js 14**: Demonstrates the use of React Server Actions in Next.js 14 to interact with the D-ID API and manage server-side logic.
- **Polling and Webhooks**: The project includes a polling mechanism to check the status of video generation but also suggests using webhooks for more efficient real-time updates.

## Installation

### Prerequisites

- Latest Node.js version
- Firebase account for Firestore and Storage
- D-ID API key
- ElevenLabs API key (for voice synthesis)
- Stripe account for payment processing
- **Ngrok** (for tunneling localhost, if testing locally)

### Steps

1. Clone the repository:

   ```bash
   git clone https://github.com/brown2020/d-id-api-demo.git
   cd d-id-api-demo
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:

   - Create a `.env.local` file in the root directory with the following variables:

     ```env
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
     ```

4. **Running Locally**:
   If you are running this project locally, you'll need to use Ngrok to expose your local server to the public internet because D-ID's API requires a public URL for the image resources.

   Steps to set up Ngrok:

   - [Download and install Ngrok](https://ngrok.com/download).
   - Start your local server:
     ```bash
     npm run dev
     ```
   - In a new terminal window, run:
     ```bash
     ngrok http 3000
     ```
   - Ngrok will provide a public URL that you can use to test your application with the D-ID API.

### Important Note

**API Keys**: The user must enter their ElevenLabs API key and D-ID API key in the profile section. These are user-specific variables and are not taken from the environment variables. Without these, the app won't function as intended.

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

### Main Features

- **Creating Digital Human Videos with Server Actions**: The project demonstrates how to use React Server Actions in Next.js 14 to create digital human videos with the D-ID API. The `generateDIDVideo` server action handles the video creation, allowing flexibility in using pre-recorded audio, text-to-speech, or silent video generation.
- **Polling vs. Webhooks**: The `retrieveDIDVideo` function implements polling to check when a video has been processed. Although polling is effective, the project suggests using webhooks for more efficient real-time updates. Webhooks provide a more scalable and event-driven approach.

### API Routes

- **`/api/proxy-image/[id]`**: This API route is used to proxy images from Firebase Storage to D-ID API due to a bug in D-ID's handling of Firebase Storage URLs.

  Example usage:

  ```bash
  GET /api/proxy-image/{image_id}.png
  ```

  This route fetches the image from Firebase Storage and serves it through your Next.js server with the appropriate headers, ensuring compatibility with D-ID's API.

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

### Summary:

- **Next.js 14 with App Router and Server Actions**: The README now highlights the use of Next.js 14 with the App Router and specifically mentions the use of React Server Actions for interacting with the D-ID API.
- **Polling vs. Webhooks**: The README includes information about the use of polling to check video generation status and suggests using webhooks for more efficient real-time updates.
- **Production Command**: Updated the instructions to remove `npm start` and correctly indicate `npm run build` for building the project.
