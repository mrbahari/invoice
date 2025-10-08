import * as admin from 'firebase-admin';
import serviceAccount from './service-account.json';

// Function to create and initialize a Firebase Admin app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function initializeFirebase() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The service account key is now imported directly from a JSON file.
  // This file should be kept secure and not exposed to the client-side.
  const serviceAccountKey = serviceAccount as admin.ServiceAccount;

  if (!serviceAccountKey.project_id) {
    console.warn('Firebase service account key is missing or invalid. Admin operations will fail.');
    return null;
  }

  try {
    const credential = admin.credential.cert(serviceAccountKey);
    return admin.initializeApp({
      credential,
    });
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
}
