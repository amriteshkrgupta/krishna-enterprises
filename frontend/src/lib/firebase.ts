/**
 * lib/firebase.ts
 * Firebase client SDK initialization.
 * Used for Firebase Auth sign-in on the frontend.
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';

export const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'AIzaSyCzB69zrBiylqq7Q6WDtiVSEel34NAs5hk',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'krishna-enterprises-77254.firebaseapp.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'krishna-enterprises-77254',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'krishna-enterprises-77254.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '258175597302',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '1:258175597302:web:c03fc28bf882716b4e4ad7',
  measurementId:     process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID     || 'G-KMMTNSVFZS',
};

// Prevent re-initialization in Next.js hot reloads
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firebaseAuth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export {
  app,
  firebaseAuth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type FirebaseUser,
};

export default firebaseConfig;
