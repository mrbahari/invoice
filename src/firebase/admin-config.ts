
import * as admin from 'firebase-admin';

// Function to create and initialize a Firebase Admin app instance.
// It ensures that the app is initialized only once (singleton pattern).
export function createFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.app();
  }

  // The service account key is securely stored in an environment variable.
  // This is a much safer practice than hardcoding the key in the source code.
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccount) {
    // In a production or deployed environment, you would want to throw an error
    // or handle this more gracefully. For this development environment, we will log a warning.
    console.warn('Firebase service account key is not set. Session persistence will not work. Set the FIREBASE_SERVICE_ACCOUNT_KEY environment variable.');
    return null;
  }

  try {
    const credential = admin.credential.cert(JSON.parse(serviceAccount));
    return admin.initializeApp({
      credential,
    });
  } catch (error: any) {
    console.error('Error initializing Firebase Admin SDK:', error.message);
    return null;
  }
}
