"use client";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Unsubscribe
} from "firebase/firestore";
import { firestore } from "./firebase-client";
import { LiveRole, type LiveRoom, type LiveRoundData } from "@/types/live-booth";
import type { TemplateId } from "@/types/photobooth";
import { getTemplate } from "./photobooth-utils";

function roomRef(roomId: string) {
  return doc(firestore, "liveBoothRooms", roomId);
}

function roundRef(roomId: string, roundNumber: number) {
  return doc(collection(roomRef(roomId), "rounds"), String(roundNumber));
}

export function createRandomRoomId() {
  return `LOVE${Math.floor(1000 + Math.random() * 9000)}`;
}

export async function createLiveRoom(roomId: string, hostName: string, templateId: TemplateId) {
  const template = getTemplate(templateId);

  await setDoc(roomRef(roomId), {
    roomId,
    templateId,
    phase: "waiting",
    currentRound: 1,
    countdownStartsAt: null,
    participants: {
      host: { joined: true, ready: false, name: hostName || "Host" },
      guest: { joined: false, ready: false, name: "Guest" }
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  for (let round = 1; round <= template.slots.length; round += 1) {
    await setDoc(roundRef(roomId, round), {
      round,
      hostImage: null,
      guestImage: null,
      updatedAt: serverTimestamp()
    });
  }
}

export async function joinLiveRoom(roomId: string, guestName: string) {
  const snapshot = await getDoc(roomRef(roomId));
  if (!snapshot.exists()) {
    throw new Error("Room not found.");
  }

  await updateDoc(roomRef(roomId), {
    "participants.guest.joined": true,
    "participants.guest.name": guestName || "Guest",
    updatedAt: serverTimestamp()
  });
}

export function subscribeToLiveRoom(roomId: string, callback: (room: LiveRoom | null) => void): Unsubscribe {
  return onSnapshot(roomRef(roomId), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as LiveRoom) : null);
  });
}

export function subscribeToRound(
  roomId: string,
  roundNumber: number,
  callback: (round: LiveRoundData | null) => void
): Unsubscribe {
  return onSnapshot(roundRef(roomId, roundNumber), (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as LiveRoundData) : null);
  });
}

export async function setParticipantReady(roomId: string, role: LiveRole, ready: boolean) {
  await updateDoc(roomRef(roomId), {
    [`participants.${role}.ready`]: ready,
    updatedAt: serverTimestamp()
  });
}

export async function startCountdown(roomId: string, roundNumber: number) {
  await updateDoc(roomRef(roomId), {
    phase: "countdown",
    currentRound: roundNumber,
    countdownStartsAt: Date.now() + 1500,
    "participants.host.ready": false,
    "participants.guest.ready": false,
    updatedAt: serverTimestamp()
  });
}

export async function saveRoundImage(roomId: string, roundNumber: number, role: LiveRole, dataUrl: string) {
  const field = role === "host" ? "hostImage" : "guestImage";
  await updateDoc(roundRef(roomId, roundNumber), {
    [field]: dataUrl,
    updatedAt: serverTimestamp()
  });
}

export async function advanceRoom(roomId: string, phase: LiveRoom["phase"], currentRound: number) {
  await updateDoc(roomRef(roomId), {
    phase,
    currentRound,
    updatedAt: serverTimestamp()
  });
}
