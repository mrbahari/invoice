'use client';
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
// This is a mock configuration. Replace it with your actual Firebase config.
const firebaseConfig = {
  "projectId": "studio-5061951288-49d18",
  "appId": "1:187985328856:web:76a7c5fe18f29ce67735ad",
  "apiKey": "AIzaSyBr46llypgYD3fDEOTb5v-AF4jQpa_xTq8",
  "authDomain": "studio-5061951288-49d18.firebaseapp.com",
  "messagingSenderId": "187985328856"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
