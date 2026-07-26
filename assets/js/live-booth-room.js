import {
  firebaseReady,
  getRoom,
  joinRoom,
  subscribeToRoom,
  setParticipantName,
  setReady,
  startRoundCountdown,
  advancePhase,
  saveOffer,
  saveAnswer,
  addIceCandidate,
  subscribeToIceCandidates
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
let connection = null;
let dataChannel = null;
let pendingRemoteCandidates = [];
let addedRemoteCandidateKeys = new Set();
let activeCountdownKey = null;
let localShots = {};
let partnerShots = {};
let finalStripDataUrl = null;
let lastCompletedRound = 0;

function makeInviteLink() {
  const url = new URL(window.location.href);
  url.searchParams.set("room", roomId);
  url.searchParams.set("role", "guest");
  url.searchParams.set("name", "Partner");
  return url.toString();
}

function getPartnerRole() {
  return role === "host" ? "guest" : "host";
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
    setStatus("Camera ready. Press 'I'm ready' when both of you want to start the next round.");
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
  const scaledWidth = 720;
  const scaledHeight = Math.round((height / width) * scaledWidth);
  scaledCanvas.width = scaledWidth;
  scaledCanvas.height = scaledHeight;
  scaledCanvas.getContext("2d").drawImage(captureCanvas, 0, 0, scaledWidth, scaledHeight);
  return scaledCanvas.toDataURL("image/jpeg", 0.78);
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
    renderShotBox(round, "host", role === "host" ? localShots[round] : partnerShots[round], "Host photo");
    renderShotBox(round, "guest", role === "guest" ? localShots[round] : partnerShots[round], "Guest photo");
  }
}

function getConnectionStatus() {
  if (dataChannel?.readyState === "open") {
    return "Connected";
  }
  return "Waiting";
}

function updateControls() {
  const participants = roomState?.participants || {};
  const partner = participants[getPartnerRole()] || {};
  const currentRound = roomState?.currentRound || 1;
  const roomReadyForStart = Boolean(participants.host?.ready && participants.guest?.ready);
  const inWaitingPhase = roomState?.phase === "waiting";

  roleText.textContent = role === "host" ? "Host" : "Guest";
  roundText.textContent = `${currentRound} / 4`;
  partnerStatusText.textContent = `${partner.name || "Partner"} • ${getConnectionStatus()}`;
  roomPhaseChip.textContent = roomState?.phase || "waiting";

  readyBtn.disabled = !mediaStream || roomState?.phase === "complete";
  readyBtn.textContent = participants[role]?.ready ? "Ready sent" : "I'm ready";
  startRoundBtn.disabled = !(role === "host" && inWaitingPhase && roomReadyForStart && dataChannel?.readyState === "open");
  downloadStripBtn.disabled = !finalStripDataUrl;
}

async function copyInviteLink() {
  const link = makeInviteLink();
  try {
    await navigator.clipboard.writeText(link);
    setStatus("Invite link copied. Send it to your girlfriend.");
  } catch (error) {
    setStatus(`Copy this link manually: ${link}`);
  }
}

function createPeerConnection() {
  connection = new RTCPeerConnection({
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  });

  connection.onicecandidate = async (event) => {
    if (!event.candidate) {
      return;
    }
    try {
      await addIceCandidate(roomId, role, event.candidate.toJSON());
    } catch (error) {
      setStatus("Could not send connection candidate.");
    }
  };

  connection.ondatachannel = (event) => {
    attachDataChannel(event.channel);
  };
}

function attachDataChannel(channel) {
  dataChannel = channel;
  dataChannel.onopen = () => {
    updateControls();
    setStatus("Live phone-to-phone connection is ready. Photos stay on the devices during the session.");
    sendMessage({ type: "hello", name: displayName });
  };
  dataChannel.onclose = () => {
    updateControls();
    setStatus("The live connection closed. Refresh and reconnect if needed.");
  };
  dataChannel.onmessage = (event) => {
    handlePeerMessage(event.data);
  };
}

function sendMessage(payload) {
  if (dataChannel?.readyState !== "open") {
    return;
  }
  dataChannel.send(JSON.stringify(payload));
}

async function initializeHostConnection() {
  createPeerConnection();
  attachDataChannel(connection.createDataChannel("booth"));
  const offer = await connection.createOffer();
  await connection.setLocalDescription(offer);
  await saveOffer(roomId, offer.toJSON());
}

async function initializeGuestConnection(offerData) {
  createPeerConnection();
  await connection.setRemoteDescription(new RTCSessionDescription(offerData));
  const answer = await connection.createAnswer();
  await connection.setLocalDescription(answer);
  await saveAnswer(roomId, answer.toJSON());
  flushPendingCandidates();
}

async function applyAnswer(answerData) {
  if (!connection?.currentRemoteDescription) {
    await connection.setRemoteDescription(new RTCSessionDescription(answerData));
    flushPendingCandidates();
  }
}

async function addRemoteCandidate(candidateData) {
  const key = JSON.stringify(candidateData);
  if (addedRemoteCandidateKeys.has(key)) {
    return;
  }
  addedRemoteCandidateKeys.add(key);

  const candidate = new RTCIceCandidate(candidateData);
  if (!connection || !connection.remoteDescription) {
    pendingRemoteCandidates.push(candidate);
    return;
  }
  await connection.addIceCandidate(candidate);
}

function flushPendingCandidates() {
  if (!connection?.remoteDescription) {
    return;
  }
  pendingRemoteCandidates.forEach((candidate) => {
    connection.addIceCandidate(candidate).catch(() => {});
  });
  pendingRemoteCandidates = [];
}

function handlePeerMessage(rawMessage) {
  const message = JSON.parse(rawMessage);
  if (message.type === "hello") {
    setStatus(`${message.name || "Partner"} is connected. You can start when both of you are ready.`);
    return;
  }

  if (message.type === "shot") {
    partnerShots[message.round] = message.image;
    renderRounds();
    maybeFinishRound(message.round);
    return;
  }

  if (message.type === "complete") {
    finalStripPreview.src = message.strip;
    finalStripPreview.classList.add("show");
    finalStripDataUrl = message.strip;
    updateControls();
    setStatus("Shared strip is ready. Download it to your phone.");
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
  renderRounds();
  sendMessage({ type: "shot", round: roundNumber, image });
  maybeFinishRound(roundNumber);
}

function maybeFinishRound(roundNumber) {
  if (!localShots[roundNumber] || !partnerShots[roundNumber] || lastCompletedRound >= roundNumber) {
    return;
  }

  lastCompletedRound = roundNumber;
  if (role === "host") {
    if (roundNumber < 4) {
      advancePhase(roomId, "waiting", roundNumber + 1).catch(() => {});
      setStatus(`Round ${roundNumber} is done. Get ready for round ${roundNumber + 1}.`);
    } else {
      buildAndShareFinalStrip().catch(() => {
        setStatus("The strip could not be built.");
      });
    }
  } else {
    setStatus(`Round ${roundNumber} is done. Waiting for the host to move to the next step.`);
  }
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

async function buildAndShareFinalStrip() {
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
  const hostImages = role === "host" ? localShots : partnerShots;
  const guestImages = role === "guest" ? localShots : partnerShots;

  for (let round = 1; round <= 4; round += 1) {
    const hostImage = await loadImage(hostImages[round]);
    const guestImage = await loadImage(guestImages[round]);
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
  exportContext.fillText("download to both phones after the session", exportCanvas.width / 2, 2440);

  finalStripDataUrl = exportCanvas.toDataURL("image/png");
  finalStripPreview.src = finalStripDataUrl;
  finalStripPreview.classList.add("show");
  sendMessage({ type: "complete", strip: finalStripDataUrl });
  await advancePhase(roomId, "complete", 4);
  updateControls();
  setStatus("Final strip is ready. Download it now on both phones if you want to keep it.");
}

function renderRoom(currentRoom) {
  if (!currentRoom) {
    setStatus("Room not found.");
    return;
  }

  roomState = currentRoom;
  roomCodeText.textContent = roomId;
  inviteLinkText.textContent = makeInviteLink();
  renderRounds();
  updateControls();

  const partner = currentRoom.participants?.[getPartnerRole()];
  if (currentRoom.phase === "waiting" && dataChannel?.readyState !== "open") {
    setStatus("Waiting for the phone-to-phone connection.");
  } else if (currentRoom.phase === "waiting") {
    setStatus(partner?.joined
      ? "Both of you can press 'I'm ready'. The host starts the round when both are ready."
      : "Send the invite link and wait for your partner to join.");
  } else if (currentRoom.phase === "countdown") {
    setStatus("Countdown started for both phones.");
  } else if (currentRoom.phase === "complete" && finalStripDataUrl) {
    setStatus("Final strip is ready. Download it now, because it is not stored in the backend.");
  }
}

async function initializeConnectionForRoom(currentRoom) {
  if (role === "host") {
    if (!connection) {
      await initializeHostConnection();
    }
    if (currentRoom.answer && connection && !connection.currentRemoteDescription) {
      await applyAnswer(currentRoom.answer);
    }
  } else if (currentRoom.offer && !connection) {
    await initializeGuestConnection(currentRoom.offer);
  }
}

async function initializeRoom() {
  roomCodeText.textContent = roomId || "----";
  inviteLinkText.textContent = makeInviteLink();

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

    subscribeToIceCandidates(roomId, getPartnerRole(), async (candidate) => {
      await addRemoteCandidate(candidate);
    });

    subscribeToRoom(roomId, async (currentRoom) => {
      renderRoom(currentRoom);
      await initializeConnectionForRoom(currentRoom);
      await runCountdownIfNeeded(currentRoom);
    });
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

initializeRoom();
