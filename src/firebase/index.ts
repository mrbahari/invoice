'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { useUser } from '../context/user-context';
import { firebaseConfig } from './config'; // Import config directly

let firebaseApp: FirebaseApp;

// IMPORTANT: This function is now simplified to use a direct import.
export function initializeFirebase() {
  if (!getApps().length) {
    if (!firebaseConfig.apiKey) {
        throw new Error("Firebase config is missing or incomplete. Check src/firebase/config.ts");
    }
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApp();
  }
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
export { useUser };
