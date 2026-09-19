// ═══════════════════════════════════════════════════════════════
// FIREBASE CONFIG — Cloud sync (Firestore) + Super Admin login (Auth)
// ═══════════════════════════════════════════════════════════════
//
// Preferred setup: put your project's config in a local .env file
// (copy .env.example → .env, fill in the values) instead of editing this
// file. Vite exposes anything prefixed VITE_ to the client automatically.
// .env is gitignored, so a real deployment's keys never end up in source
// control / a public repo.
//
// Where to find your project's config:
// 1. Go to https://console.firebase.google.com, open your project
// 2. Top-left gear icon (⚙️) → "Project settings"
// 3. Scroll down to the "Your apps" section
//    - If no Web app (</>) is registered yet, click the "</>" icon
//      → give the app a name → "Register app"
// 4. An object appears under "SDK setup and configuration" — put those
//    values into your .env file (see .env.example).
//
// (Alternative: this config can also be pasted from inside the app via
//  the Super Admin's "Firebase Settings" page — no code/env editing needed.
//  Handy for a hosted demo where the person running it doesn't have
//  filesystem access to set up .env.)
//
// If no .env is set up, this falls back to whatever project this app
// shipped configured for — fine for trying the app out, but for a real
// deployment you should point it at your own Firebase project so you
// control who can read/write the data (see Firestore Security Rules in
// the Firebase console).

const ENV_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const DEFAULT_CONFIG = {
  apiKey: "AIzaSyCevZQ147HjQKzEyQjr7cfFgI4Icj-tlYM",
  authDomain: "kd-premier-league.firebaseapp.com",
  projectId: "kd-premier-league",
  storageBucket: "kd-premier-league.firebasestorage.app",
  messagingSenderId: "568383052969",
  appId: "1:568383052969:web:5d659048366e3bcb5b9db8",
};

import { initializeApp } from "firebase/app";
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Runtime override priority:
//   1. Super Admin's in-app "Firebase Settings" page (localStorage)
//   2. .env file (VITE_FIREBASE_*)
//   3. the fallback default above
function loadConfig() {
  try {
    const saved = localStorage.getItem('kdpl_firebase_config');
    if (saved) return JSON.parse(saved);
  } catch { /* ignore malformed saved config */ }
  if (ENV_CONFIG.apiKey && ENV_CONFIG.projectId) return ENV_CONFIG;
  return DEFAULT_CONFIG;
}

export const firebaseConfig = loadConfig();
export const firebaseApp = initializeApp(firebaseConfig);

// Offline persistence: writes/reads made while offline are queued in
// IndexedDB (not just in-memory), so a page reload or app close while
// offline no longer loses pending changes — they flush automatically the
// next time the SDK sees a connection. `persistentMultipleTabManager`
// lets several open tabs on the same device share that same cache instead
// of fighting over it. Falls back to the plain (memory-only) client on
// browsers/environments where IndexedDB persistence can't be set up.
function initDb() {
  try {
    return initializeFirestore(firebaseApp, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    console.warn('Firestore offline persistence unavailable, falling back to in-memory cache:', err);
    return getFirestore(firebaseApp);
  }
}

export const db = initDb();
export const auth = getAuth(firebaseApp);

export function isFirebaseConfigured(): boolean {
  return firebaseConfig.apiKey !== "YOUR_API_KEY" && !!firebaseConfig.apiKey;
}

