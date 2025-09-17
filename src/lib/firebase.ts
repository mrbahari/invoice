// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-5061951288-49d18",
  "appId": "1:187985328856:web:76a7c5fe18f29ce67735ad",
  "storageBucket": "studio-5061951288-49d18.firebasestorage.app",
  "apiKey": "AIzaSyBr46llypgYD3fDEOTb5v-AF4jQpa_xTq8",
  "authDomain": "studio-5061951288-49d18.firebaseapp.com",
  "messagingSenderId": "187985328856"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };
