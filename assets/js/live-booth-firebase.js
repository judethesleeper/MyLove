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
  orderBy
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
    connectionReady: false,
    offer: null,
    answer: null,
    participants: {
      host: { joined: true, ready: false, name: "Host" },
      guest: { joined: false, ready: false, name: "Guest" }
    },
    updatedAt: serverTimestamp()
  });
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

export async function saveOffer(roomId, offer) {
  await updateDoc(roomRef(roomId), {
    offer,
    updatedAt: serverTimestamp()
  });
}

export async function saveAnswer(roomId, answer) {
  await updateDoc(roomRef(roomId), {
    answer,
    connectionReady: true,
    updatedAt: serverTimestamp()
  });
}

export async function addIceCandidate(roomId, role, candidate) {
  await addDoc(collection(roomRef(roomId), `${role}Candidates`), {
    candidate,
    createdAt: serverTimestamp()
  });
}

export function subscribeToIceCandidates(roomId, role, callback) {
  const candidateQuery = query(
    collection(roomRef(roomId), `${role}Candidates`),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(candidateQuery, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        callback(change.doc.data().candidate);
      }
    });
  });
}
