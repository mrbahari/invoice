
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { useUser } from '../context/user-context';
import { firebaseConfig } from './config'; // Import config directly

let firebaseApp: FirebaseApp;

// This function now uses the imported config object directly.
export function initializeFirebase() {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
      // This check is a safeguard.
      throw new Error("Firebase config is missing or incomplete. Check src/firebase/config.ts");
    }
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  const firestore = getFirestore(firebaseApp);
  
  // Enable offline persistence
  try {
    enableIndexedDbPersistence(firestore)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          // Multiple tabs open, persistence can only be enabled in one.
          console.warn("Firestore offline persistence failed: Multiple tabs open.");
        } else if (err.code === 'unimplemented') {
          // The browser does not support all of the features required
          console.warn("Firestore offline persistence failed: Browser does not support required features.");
        }
      });
  } catch (error) {
    console.error("Error enabling Firestore offline persistence:", error);
  }

  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export { useUser };
