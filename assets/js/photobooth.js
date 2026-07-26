const video = document.getElementById("video");
const captureCanvas = document.getElementById("captureCanvas");
const captureContext = captureCanvas.getContext("2d");
const exportCanvas = document.getElementById("exportCanvas");
const exportContext = exportCanvas.getContext("2d");
const countdownEl = document.getElementById("countdown");
const flashEl = document.getElementById("flash");
const startCameraBtn = document.getElementById("startCameraBtn");
const startBoothBtn = document.getElementById("startBoothBtn");
const retakeAllBtn = document.getElementById("retakeAllBtn");
const downloadBtn = document.getElementById("downloadBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
const statusText = document.getElementById("statusText");
const shotSlots = Array.from(document.querySelectorAll(".shot"));
const slotButtons = Array.from(document.querySelectorAll("[data-retake-slot]"));

let mediaStream = null;
let isCapturing = false;
let shots = [];

async function startCamera() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user",
        width: { ideal: 1080 },
        height: { ideal: 1350 }
      },
      audio: false
    });

    video.srcObject = mediaStream;
    await video.play();
    startBoothBtn.disabled = false;
    updateSlotButtons();
    statusText.textContent = "Camera is ready. You can take the full 4-shot strip or retake one shot at a time.";
  } catch (error) {
    statusText.textContent =
      "Camera access did not start. On phone, this usually works only on a secure https page after camera permission is allowed.";
  }
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function showCountdown(seconds) {
  countdownEl.classList.add("show");
  for (let current = seconds; current > 0; current -= 1) {
    countdownEl.textContent = current;
    await wait(1000);
  }
  countdownEl.classList.remove("show");
}

function flashFrame() {
  flashEl.classList.remove("active");
  void flashEl.offsetWidth;
  flashEl.classList.add("active");
}

function captureShot() {
  const width = video.videoWidth;
  const height = video.videoHeight;

  captureCanvas.width = width;
  captureCanvas.height = height;
  captureContext.save();
  captureContext.translate(width, 0);
  captureContext.scale(-1, 1);
  captureContext.drawImage(video, 0, 0, width, height);
  captureContext.restore();
  return captureCanvas.toDataURL("image/jpeg", 0.92);
}

function renderStripSlots() {
  shotSlots.forEach((slot, index) => {
    const shot = shots[index];
    if (!shot) {
      slot.innerHTML = `Shot ${index + 1} will appear here`;
      return;
    }

    slot.innerHTML = "";
    const image = document.createElement("img");
    image.src = shot;
    image.alt = `Captured shot ${index + 1}`;
    slot.appendChild(image);
  });
}

function updateSlotButtons() {
  const canRetakeSingle = Boolean(mediaStream) && !isCapturing;
  slotButtons.forEach((button, index) => {
    button.disabled = !canRetakeSingle || !shots[index];
  });
  retakeAllBtn.disabled = isCapturing || shots.length === 0;
  downloadBtn.disabled = shots.filter(Boolean).length !== 4;
}

async function captureIntoSlot(index) {
  if (!mediaStream || isCapturing) {
    return;
  }

  isCapturing = true;
  updateSlotButtons();
  startBoothBtn.disabled = true;
  statusText.textContent = `Get ready to retake shot ${index + 1}.`;
  await showCountdown(3);
  flashFrame();
  await wait(120);
  shots[index] = captureShot();
  renderStripSlots();
  isCapturing = false;
  startBoothBtn.disabled = false;
  updateSlotButtons();
  statusText.textContent = `Shot ${index + 1} was updated.`;
}

async function runBooth() {
  if (!mediaStream || isCapturing) {
    return;
  }

  isCapturing = true;
  shots = [];
  renderStripSlots();
  startBoothBtn.disabled = true;
  updateSlotButtons();

  for (let i = 0; i < 4; i += 1) {
    statusText.textContent = `Get ready for shot ${i + 1} of 4.`;
    await showCountdown(3);
    flashFrame();
    await wait(120);
    shots[i] = captureShot();
    renderStripSlots();
    statusText.textContent = `Shot ${i + 1} captured.`;
    if (i < 3) {
      await wait(900);
    }
  }

  isCapturing = false;
  startBoothBtn.disabled = false;
  updateSlotButtons();
  statusText.textContent = "Your strip is ready. Retake one photo, clear all, or download it.";
}

function clearStrip() {
  if (isCapturing) {
    return;
  }

  shots = [];
  renderStripSlots();
  updateSlotButtons();
  statusText.textContent = "Strip cleared. You can start again or import other photos.";
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

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

async function downloadStrip() {
  if (shots.filter(Boolean).length !== 4) {
    return;
  }

  exportContext.clearRect(0, 0, exportCanvas.width, exportCanvas.height);
  exportContext.fillStyle = "#fff8fb";
  exportContext.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

  exportContext.fillStyle = "#d44c82";
  exportContext.font = "72px cursive";
  exportContext.textAlign = "center";
  exportContext.fillText("Our Photo Strip", exportCanvas.width / 2, 120);

  const cardX = 90;
  const cardWidth = exportCanvas.width - 180;
  const photoHeight = 400;
  const gap = 34;
  const startY = 180;

  for (let i = 0; i < shots.length; i += 1) {
    const image = await loadImage(shots[i]);
    const y = startY + i * (photoHeight + gap);
    exportContext.save();
    drawRoundedRect(exportContext, cardX, y, cardWidth, photoHeight, 36);
    exportContext.clip();
    exportContext.drawImage(image, cardX, y, cardWidth, photoHeight);
    exportContext.restore();

    exportContext.strokeStyle = "rgba(212, 76, 130, 0.22)";
    exportContext.lineWidth = 4;
    drawRoundedRect(exportContext, cardX, y, cardWidth, photoHeight, 36);
    exportContext.stroke();
  }

  exportContext.fillStyle = "#a45b7b";
  exportContext.font = "36px sans-serif";
  exportContext.fillText("made with love", exportCanvas.width / 2, 2120);

  const link = document.createElement("a");
  link.href = exportCanvas.toDataURL("image/png");
  link.download = "couple-photobooth-strip.png";
  link.click();
}

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function importPhotos(event) {
  const files = Array.from(event.target.files || []).slice(0, 4);
  if (files.length === 0) {
    return;
  }

  const imported = await Promise.all(files.map(fileToDataUrl));
  imported.forEach((src, index) => {
    shots[index] = src;
  });

  renderStripSlots();
  updateSlotButtons();
  statusText.textContent =
    "Imported photos into the strip. This is the easiest static-site option when you and your girlfriend are using different devices.";
  importInput.value = "";
}

startCameraBtn.addEventListener("click", startCamera);
startBoothBtn.addEventListener("click", runBooth);
retakeAllBtn.addEventListener("click", clearStrip);
downloadBtn.addEventListener("click", downloadStrip);
importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", importPhotos);
slotButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const index = Number(button.dataset.retakeSlot);
    captureIntoSlot(index);
  });
});

renderStripSlots();
updateSlotButtons();
