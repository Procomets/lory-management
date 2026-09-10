import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// User can replace these with their actual Firebase credentials, or set environment variables in .env file
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_FIREBASE_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_MESSAGING_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Check if actual valid Web API key is provided (real Firebase Web API keys start with AIzaSy...)
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && 
  !firebaseConfig.apiKey.includes('YOUR_') && 
  firebaseConfig.apiKey.length > 20
);

// Initialize Firebase App if configured, otherwise create app instance safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Secondary auth instance specifically for creating user authentication accounts without signing out active admin
export const getSecondaryAuth = () => {
  const secondaryApp = getApps().find(a => a.name === 'SecondaryAuthApp') || initializeApp(firebaseConfig, 'SecondaryAuthApp');
  return getAuth(secondaryApp);
};

export default app;
