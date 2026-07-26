export const firebaseConfig = {
   apiKey: "AIzaSyCWRVW06DUkh5d8JYIBcOdgoVOY0zd1Dkg",
  authDomain: "my-love-live-booth.firebaseapp.com",
  projectId: "my-love-live-booth",
  storageBucket: "my-love-live-booth.firebasestorage.app",
  messagingSenderId: "939082784436",
  appId: "1:939082784436:web:bd16bf1131364067a401e1",
  measurementId: "G-CWY0PBDCLV"
};

export function isFirebaseConfigured() {
  return Object.values(firebaseConfig).every((value) => {
    return typeof value === "string" && value.length > 0 && !value.startsWith("YOUR_");
  });
}
