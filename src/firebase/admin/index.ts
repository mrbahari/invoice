
import * as admin from 'firebase-admin';

// Function to create and initialize a Firebase Admin app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The service account key is now read from an environment variable.
  // This is a secure practice, especially for server-side code.
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountKey) {
    console.warn('Firebase service account key is not set in environment variables. Admin operations will fail.');
    return null;
  }

  try {
    // The key is expected to be a JSON string.
    const credential = admin.credential.cert(JSON.parse(serviceAccountKey));
    return admin.initializeApp({
      credential,
    });
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
}
