import { firebaseConfig, isFirebaseConfigured } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  addDoc,
  query,
  orderBy,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

let app = null;
let db = null;

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
}

function assertFirebase() {
  if (!app || !db) {
    throw new Error("Firebase is not configured yet.");
  }
}

function roomRef(roomId) {
  assertFirebase();
  return doc(db, "liveBoothRooms", roomId);
}

function roundRef(roomId, roundNumber) {
  assertFirebase();
  return doc(collection(roomRef(roomId), "rounds"), String(roundNumber));
}

export function firebaseReady() {
  return Boolean(app && db);
}

export async function createRoom(roomId) {
  await setDoc(roomRef(roomId), {
    roomId,
    createdAt: serverTimestamp(),
    phase: "waiting",
    currentRound: 1,
    countdownStartsAt: null,
    participants: {
      host: { joined: true, ready: false, name: "Host" },
      guest: { joined: false, ready: false, name: "Guest" }
    },
    updatedAt: serverTimestamp()
  });

  for (let round = 1; round <= 4; round += 1) {
    await setDoc(roundRef(roomId, round), {
      round,
      hostImage: null,
      guestImage: null,
      updatedAt: serverTimestamp()
    });
  }
}

export async function joinRoom(roomId) {
  const snapshot = await getDoc(roomRef(roomId));
  if (!snapshot.exists()) {
    throw new Error("Room not found.");
  }

  await updateDoc(roomRef(roomId), {
    "participants.guest.joined": true,
    updatedAt: serverTimestamp()
  });

  return snapshot.data();
}

export async function getRoom(roomId) {
  const snapshot = await getDoc(roomRef(roomId));
  return snapshot.exists() ? snapshot.data() : null;
}

export function subscribeToRoom(roomId, callback) {
  return onSnapshot(roomRef(roomId), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
}

export function subscribeToRound(roomId, roundNumber, callback) {
  return onSnapshot(roundRef(roomId, roundNumber), (snapshot) => {
    callback(snapshot.exists() ? snapshot.data() : null);
  });
}

export async function setParticipantName(roomId, role, name) {
  await updateDoc(roomRef(roomId), {
    [`participants.${role}.name`]: name,
    updatedAt: serverTimestamp()
  });
}

export async function setReady(roomId, role, ready) {
  await updateDoc(roomRef(roomId), {
    [`participants.${role}.ready`]: ready,
    updatedAt: serverTimestamp()
  });
}

export async function startRoundCountdown(roomId, roundNumber) {
  await updateDoc(roomRef(roomId), {
    phase: "countdown",
    currentRound: roundNumber,
    countdownStartsAt: Date.now() + 1500,
    "participants.host.ready": false,
    "participants.guest.ready": false,
    updatedAt: serverTimestamp()
  });
}

export async function advancePhase(roomId, phase, roundNumber) {
  await updateDoc(roomRef(roomId), {
    phase,
    currentRound: roundNumber,
    updatedAt: serverTimestamp()
  });
}

export async function saveRoundImage(roomId, roundNumber, role, imageData) {
  const field = role === "host" ? "hostImage" : "guestImage";
  await updateDoc(roundRef(roomId, roundNumber), {
    [field]: imageData,
    updatedAt: serverTimestamp()
  });
}

export async function clearRoomSession(roomId) {
  for (let round = 1; round <= 4; round += 1) {
    await setDoc(roundRef(roomId, round), {
      round,
      hostImage: null,
      guestImage: null,
      updatedAt: serverTimestamp()
    });
  }

  await updateDoc(roomRef(roomId), {
    phase: "waiting",
    currentRound: 1,
    countdownStartsAt: null,
    "participants.host.ready": false,
    "participants.guest.ready": false,
    updatedAt: serverTimestamp()
  });
}
