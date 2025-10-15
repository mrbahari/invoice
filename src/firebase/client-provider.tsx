'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

// --- Singleton Initialization ---
// This logic is now outside the component, ensuring it runs only once per client session.

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

if (getApps().length === 0) {
  // Initialize the app only if it hasn't been initialized
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);

  // Attempt to enable persistence. This is the crucial part.
  // It's now guaranteed to run before any component uses Firestore.
  try {
    enableIndexedDbPersistence(firestore)
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore offline persistence failed: Multiple tabs open.");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore offline persistence failed: Browser does not support required features.");
        }
      });
  } catch (error) {
    console.error("Error enabling Firestore offline persistence:", error);
  }
} else {
  // If the app is already initialized, just get the instances.
  firebaseApp = getApp();
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
}
// --- End of Singleton Initialization ---


export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // The provider now simply passes the singleton instances down.
  // No more useMemo for initialization, which was causing the race condition.
  return (
    <FirebaseProvider
      firebaseApp={firebaseApp}
      auth={auth}
      firestore={firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
