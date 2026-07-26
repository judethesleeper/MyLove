import {
  firebaseReady,
  getRoom,
  joinRoom,
  subscribeToRoom,
  subscribeToRound,
  setParticipantName,
  setReady,
  startRoundCountdown,
  advancePhase,
  saveRoundImage,
  clearRoomSession
} from "./live-booth-firebase.js";

const params = new URLSearchParams(window.location.search);
const roomId = (params.get("room") || "").toUpperCase();
const role = params.get("role") === "guest" ? "guest" : "host";
const displayName = params.get("name")?.trim() || (role === "host" ? "Host" : "Guest");

const roomCodeText = document.getElementById("roomCodeText");
const roomPhaseChip = document.getElementById("roomPhaseChip");
const roleText = document.getElementById("roleText");
const roundText = document.getElementById("roundText");
const partnerStatusText = document.getElementById("partnerStatusText");
const roomStatus = document.getElementById("roomStatus");
const inviteLinkText = document.getElementById("inviteLinkText");
const cameraPreview = document.getElementById("cameraPreview");
const countdownText = document.getElementById("countdownText");
const flashFrame = document.getElementById("flashFrame");
const startCameraBtn = document.getElementById("startCameraBtn");
const readyBtn = document.getElementById("readyBtn");
const startRoundBtn = document.getElementById("startRoundBtn");
const copyLinkBtn = document.getElementById("copyLinkBtn");
const downloadStripBtn = document.getElementById("downloadStripBtn");
const finalStripPreview = document.getElementById("finalStripPreview");
const captureCanvas = document.getElementById("captureCanvas");
const captureContext = captureCanvas.getContext("2d");
const exportCanvas = document.getElementById("exportCanvas");
const exportContext = exportCanvas.getContext("2d");

let roomState = null;
let mediaStream = null;
let activeCountdownKey = null;
let localShots = {};
let roundData = {
  1: { hostImage: null, guestImage: null },
  2: { hostImage: null, guestImage: null },
  3: { hostImage: null, guestImage: null },
  4: { hostImage: null, guestImage: null }
};
let finalStripDataUrl = null;
let lastCompletedRound = 0;
let subscriptions = [];

function partnerRole() {
  return role === "host" ? "guest" : "host";
}

function inviteLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  url.searchParams.set("role", "guest");
  url.searchParams.set("name", "Partner");
  return url.toString();
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function setStatus(message) {
  roomStatus.textContent = message;
}

function flashCapture() {
  flashFrame.classList.remove("active");
  void flashFrame.offsetWidth;
  flashFrame.classList.add("active");
}

function setCountdownValue(value) {
  countdownText.textContent = value;
  countdownText.classList.add("show");
}

function clearCountdown() {
  countdownText.classList.remove("show");
}

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 960 },
        height: { ideal: 1200 }
      },
      audio: false
    });
    cameraPreview.srcObject = mediaStream;
    await cameraPreview.play();
    readyBtn.disabled = false;
    setStatus("Camera ready. Press 'I'm ready' when both of you want the next shot.");
  } catch (error) {
    setStatus("Camera access failed. Open the site over https and allow camera access on this phone.");
  }
}

function captureCurrentFrame() {
  const width = cameraPreview.videoWidth;
  const height = cameraPreview.videoHeight;
  captureCanvas.width = width;
  captureCanvas.height = height;
  captureContext.save();
  captureContext.translate(width, 0);
  captureContext.scale(-1, 1);
  captureContext.drawImage(cameraPreview, 0, 0, width, height);
  captureContext.restore();

  const scaledCanvas = document.createElement("canvas");
  const scaledWidth = 480;
  const scaledHeight = Math.round((height / width) * scaledWidth);
  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;
  const scaledContext = scaledCanvas.getContext("2d");
  scaledContext.drawImage(captureCanvas, 0, 0, scaledWidth, scaledHeight);
  return scaledCanvas.toDataURL("image/jpeg", 0.55);
}

function renderShotBox(roundNumber, side, src, label) {
  const target = document.querySelector(`[data-shot="${roundNumber}-${side}"]`);
  if (!target) {
    return;
  }

  if (!src) {
    target.textContent = label;
    return;
  }

  target.innerHTML = "";
  const image = document.createElement("img");
  image.src = src;
  image.alt = `Round ${roundNumber} ${side} shot`;
  target.appendChild(image);
}

function renderRounds() {
  for (let round = 1; round <= 4; round += 1) {
    renderShotBox(round, "host", roundData[round]?.hostImage, "Host photo");
    renderShotBox(round, "guest", roundData[round]?.guestImage, "Guest photo");
  }
}

function updateControls() {
  const participants = roomState?.participants || {};
  const currentRound = roomState?.currentRound || 1;
  const partner = participants[partnerRole()] || {};
  const me = participants[role] || {};
  const bothReady = Boolean(participants.host?.ready && participants.guest?.ready);
  const waitingPhase = roomState?.phase === "waiting";

  roleText.textContent = role === "host" ? "Host" : "Guest";
  roundText.textContent = `${currentRound} / 4`;
  partnerStatusText.textContent = partner.joined
    ? `${partner.name || "Partner"} • ${partner.ready ? "Ready" : "Connected"}`
    : "Waiting";
  roomPhaseChip.textContent = roomState?.phase || "waiting";

  readyBtn.disabled = !mediaStream || roomState?.phase === "complete";
  readyBtn.textContent = me.ready ? "Ready sent" : "I'm ready";
  startRoundBtn.disabled = !(role === "host" && waitingPhase && bothReady);
  downloadStripBtn.disabled = !finalStripDataUrl;
}

async function copyInviteLink() {
  const link = inviteLink();
  try {
    await navigator.clipboard.writeText(link);
    setStatus("Invite link copied. Send it to your girlfriend.");
  } catch (error) {
    setStatus(`Copy this link manually: ${link}`);
  }
}

async function captureRound(roundNumber) {
  if (!mediaStream) {
    return;
  }

  flashCapture();
  await wait(120);
  const image = captureCurrentFrame();
  localShots[roundNumber] = image;
  await saveRoundImage(roomId, roundNumber, role, image);
  setStatus("Your photo is saved for this round. Waiting for the other phone.");
}

function roundComplete(roundNumber) {
  const current = roundData[roundNumber];
  return Boolean(current?.hostImage && current?.guestImage);
}

async function maybeAdvanceRound(roundNumber) {
  if (roundNumber <= lastCompletedRound || !roundComplete(roundNumber) || role !== "host") {
    return;
  }

  lastCompletedRound = roundNumber;
  if (roundNumber < 4) {
    await advancePhase(roomId, "waiting", roundNumber + 1);
    setStatus(`Round ${roundNumber} is done. Get ready for round ${roundNumber + 1}.`);
    return;
  }

  await buildFinalStrip();
  await advancePhase(roomId, "complete", 4);
  setStatus("Final strip is ready. Download it to your phones now.");
}

async function runCountdownIfNeeded(currentRoom) {
  const currentRound = currentRoom.currentRound;
  const countdownStartsAt = currentRoom.countdownStartsAt;
  const key = `${currentRound}-${countdownStartsAt}`;
  if (currentRoom.phase !== "countdown" || !countdownStartsAt || activeCountdownKey === key) {
    return;
  }

  activeCountdownKey = key;
  const delay = Math.max(0, countdownStartsAt - Date.now());
  if (delay > 0) {
    await wait(delay);
  }

  for (let number = 3; number >= 1; number -= 1) {
    setCountdownValue(String(number));
    await wait(1000);
  }

  clearCountdown();
  await captureRound(currentRound);
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

async function buildFinalStrip() {
  exportContext.fillStyle = "#fff8fb";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.fillStyle = "#d94881";
  exportContext.font = "76px cursive";
  exportContext.textAlign = "center";
  exportContext.fillText("Our Live Booth", exportCanvas.width / 2, 120);

  const cardWidth = exportCanvas.width - 120;
  const cardHeight = 500;
  const startX = 60;
  const startY = 180;
  const gapY = 40;
  const innerGap = 24;
  const photoWidth = (cardWidth - innerGap) / 2;

  for (let round = 1; round <= 4; round += 1) {
    const hostImage = await loadImage(roundData[round].hostImage);
    const guestImage = await loadImage(roundData[round].guestImage);
    const cardY = startY + (round - 1) * (cardHeight + gapY);

    exportContext.fillStyle = "#ffeaf3";
    drawRoundedRect(exportContext, startX, cardY, cardWidth, cardHeight, 30);
    exportContext.fill();

    exportContext.fillStyle = "#b9537f";
    exportContext.font = "30px sans-serif";
    exportContext.textAlign = "left";
    exportContext.fillText(`Round ${round}`, startX + 24, cardY + 42);

    const leftX = startX + 20;
    const rightX = leftX + photoWidth + innerGap;
    const photoY = cardY + 62;
    const photoHeight = cardHeight - 82;

    [hostImage, guestImage].forEach((image, index) => {
      const x = index === 0 ? leftX : rightX;
      exportContext.save();
      drawRoundedRect(exportContext, x, photoY, photoWidth, photoHeight, 24);
      exportContext.clip();
      exportContext.drawImage(image, x, photoY, photoWidth, photoHeight);
      exportContext.restore();
    });
  }

  exportContext.fillStyle = "#a45b7b";
  exportContext.font = "34px sans-serif";
  exportContext.textAlign = "center";
  exportContext.fillText("download before leaving the room", exportCanvas.width / 2, 2440);

  finalStripDataUrl = exportCanvas.toDataURL("image/png");
  finalStripPreview.src = finalStripDataUrl;
  finalStripPreview.classList.add("show");
  updateControls();
}

function renderRoom(currentRoom) {
  if (!currentRoom) {
    setStatus("Room not found.");
    return;
  }

  roomState = currentRoom;
  roomCodeText.textContent = roomId;
  inviteLinkText.textContent = inviteLink();
  updateControls();

  const partner = currentRoom.participants?.[partnerRole()];
  if (currentRoom.phase === "waiting") {
    setStatus(partner?.joined
      ? "Both phones are in the room. Press 'I'm ready' on both, then the host starts the round."
      : "Send the invite link and wait for your partner to join.");
  } else if (currentRoom.phase === "countdown") {
    setStatus("Countdown started for both phones.");
  } else if (currentRoom.phase === "complete" && finalStripDataUrl) {
    setStatus("Final strip is ready. Download it now on both phones.");
  }
}

function subscribeToRounds() {
  for (let round = 1; round <= 4; round += 1) {
    const unsubscribe = subscribeToRound(roomId, round, async (data) => {
      if (!data) {
        return;
      }
      roundData[round] = data;
      renderRounds();
      if (roundComplete(round)) {
        await maybeAdvanceRound(round);
      }
    });
    subscriptions.push(unsubscribe);
  }
}

async function initializeRoom() {
  roomCodeText.textContent = roomId || "----";
  inviteLinkText.textContent = inviteLink();

  if (!firebaseReady()) {
    startCameraBtn.disabled = true;
    readyBtn.disabled = true;
    startRoundBtn.disabled = true;
    setStatus("Firebase is not configured yet. Paste your Firebase web config into assets/js/firebase-config.js first.");
    return;
  }

  if (!roomId) {
    setStatus("No room code found in the URL.");
    return;
  }

  try {
    const existing = await getRoom(roomId);
    if (!existing) {
      setStatus("Room not found.");
      return;
    }

    if (role === "guest" && !existing.participants?.guest?.joined) {
      await joinRoom(roomId);
    }

    await setParticipantName(roomId, role, displayName);
    subscribeToRounds();
    subscriptions.push(subscribeToRoom(roomId, async (currentRoom) => {
      renderRoom(currentRoom);
      await runCountdownIfNeeded(currentRoom);
    }));
  } catch (error) {
    setStatus(error.message || "Could not load room.");
  }
}

startCameraBtn.addEventListener("click", startCamera);
readyBtn.addEventListener("click", async () => {
  try {
    await setReady(roomId, role, true);
    setStatus("Ready sent. Waiting for the next step.");
  } catch (error) {
    setStatus(error.message || "Could not update ready state.");
  }
});

startRoundBtn.addEventListener("click", async () => {
  if (!roomState) {
    return;
  }
  try {
    await startRoundCountdown(roomId, roomState.currentRound);
  } catch (error) {
    setStatus(error.message || "Could not start round.");
  }
});

copyLinkBtn.addEventListener("click", copyInviteLink);
downloadStripBtn.addEventListener("click", () => {
  if (!finalStripDataUrl) {
    return;
  }
  const link = document.createElement("a");
  link.href = finalStripDataUrl;
  link.download = `${roomId.toLowerCase()}-live-booth-strip.png`;
  link.click();
});

window.addEventListener("beforeunload", () => {
  subscriptions.forEach((unsubscribe) => unsubscribe());
});

initializeRoom();
