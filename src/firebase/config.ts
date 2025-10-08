// This file contains the public Firebase configuration.
// It is NOT a secret and is required by the client-side Firebase SDK.
// It is safe to be included in your source code.

import { FirebaseOptions } from 'firebase/app';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "YOUR_API_KEY", // Replace with your actual config
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};
