import { firebaseReady, createRoom, joinRoom } from "./live-booth-firebase.js";

const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const roomCodeInput = document.getElementById("roomCodeInput");
const displayNameInput = document.getElementById("displayNameInput");
const homeStatus = document.getElementById("homeStatus");
const setupNotice = document.getElementById("setupNotice");

function normalizeRoomCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

function randomRoomCode() {
  return `LOVE${Math.floor(1000 + Math.random() * 9000)}`;
}

function getDisplayName() {
  const name = displayNameInput.value.trim();
  return name || "You";
}

function goToRoom(roomId, role, name) {
  const params = new URLSearchParams({
    room: roomId,
    role,
    name
  });
  window.location.href = `./room.html?${params.toString()}`;
}

roomCodeInput.addEventListener("input", () => {
  roomCodeInput.value = normalizeRoomCode(roomCodeInput.value);
});

if (firebaseReady()) {
  setupNotice.textContent =
    "Firebase is configured. You can create a room now and send the invite link to your girlfriend.";
  homeStatus.textContent = "Ready to create or join a live booth room.";
} else {
  createRoomBtn.disabled = true;
  joinRoomBtn.disabled = true;
}

createRoomBtn.addEventListener("click", async () => {
  const roomId = randomRoomCode();
  const name = getDisplayName();
  homeStatus.textContent = `Creating room ${roomId}...`;

  try {
    await createRoom(roomId);
    goToRoom(roomId, "host", name);
  } catch (error) {
    homeStatus.textContent = error.message || "Could not create room.";
  }
});

joinRoomBtn.addEventListener("click", async () => {
  const roomId = normalizeRoomCode(roomCodeInput.value);
  const name = getDisplayName();
  if (!roomId) {
    homeStatus.textContent = "Enter a room code first.";
    return;
  }

  homeStatus.textContent = `Joining room ${roomId}...`;
  try {
    await joinRoom(roomId);
    goToRoom(roomId, "guest", name);
  } catch (error) {
    homeStatus.textContent = error.message || "Could not join room.";
  }
});
