"use client";

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCWRVW06DUkh5d8JYIBcOdgoVOY0zd1Dkg",
  authDomain: "my-love-live-booth.firebaseapp.com",
  projectId: "my-love-live-booth",
  storageBucket: "my-love-live-booth.firebasestorage.app",
  messagingSenderId: "939082784436",
  appId: "1:939082784436:web:bd16bf1131364067a401e1"
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const firestore = getFirestore(firebaseApp);
