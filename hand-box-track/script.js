import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");
const stage = document.getElementById("stage");
const overlay = document.getElementById("overlay");
const statusEl = document.getElementById("status");
const toggleBtns = document.querySelectorAll(".toggle");

const ctx = overlay.getContext("2d");

let handLandmarker = null;
const toggles = { zoom: true, points: true, skeleton: false, dim: true };
const ZOOM_SCALE = 2;
const BOX_PAD = 0.18;

const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

toggleBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.toggle;
    toggles[key] = !toggles[key];
    btn.classList.toggle("active", toggles[key]);
  });
});

async function init() {
  try {
    await startCamera();
    statusEl.textContent = "Memuat model kecerdasan buatan...";
    await loadModel();
    statusEl.textContent = "Tunjukkan tangan ke kamera";
    runLoop();
  } catch (err) {
    statusEl.textContent = "Gagal: " + err.message;
  }
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 960 }, height: { ideal: 540 } }
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
  });
  overlay.width = video.videoWidth;
  overlay.height = video.videoHeight;
  stage.style.aspectRatio = video.videoWidth + " / " + video.videoHeight;
}

async function loadModel() {
  const vision = await FilesetResolver.forVisionTasks(VISION_URL);
  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2
  });
}

async function runLoop() {
  try {
    const results = await handLandmarker.detectForVideo(video, performance.now());
    handleResults(results);
  } catch (err) {
    statusEl.textContent = "Error deteksi: " + err.message;
  }
  requestAnimationFrame(runLoop);
}

function handleResults(results) {
  ctx.clearRect(0, 0, overlay.width, overlay.height);

  const hands = results.landmarks;
  if (!hands || hands.length === 0) {
    statusEl.textContent = "Tunjukkan tangan ke kamera";
    return;
  }

  const w = video.videoWidth;
  const h = video.videoHeight;
  statusEl.textContent = hands.length + " tangan terdeteksi";

  if (toggles.dim) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.fillRect(0, 0, w, h);
  }

  hands.forEach((hand, i) => {
    const color = "hsl(" + ((i * 137) % 360) + ", 90%, 62%)";
    const box = getBox(hand, w, h);

    if (toggles.zoom) {
      drawZoomBox(box, w, h, color);
    } else {
      drawBox(box, color);
    }

    drawLabel(box, color);
    if (toggles.skeleton) drawSkeleton(hand, w, h, color);
    if (toggles.points) drawPoints(hand, w, h, color);
  });
}

function getBox(hand, w, h) {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const lm of hand) {
    if (lm.x < minX) minX = lm.x;
    if (lm.y < minY) minY = lm.y;
    if (lm.x > maxX) maxX = lm.x;
    if (lm.y > maxY) maxY = lm.y;
  }
  const padX = (maxX - minX) * BOX_PAD;
  const padY = (maxY - minY) * BOX_PAD;
  const x1 = Math.max(0, (1 - maxX) * w - padX * w);
  const x2 = Math.min(w, (1 - minX) * w + padX * w);
  const y1 = Math.max(0, minY * h - padY * h);
  const y2 = Math.min(h, maxY * h + padY * h);
  return { x1, y1, x2, y2 };
}

function drawBox(box, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, overlay.width * 0.004);
  ctx.strokeRect(box.x1, box.y1, box.x2 - box.x1, box.y2 - box.y1);
}

function drawZoomBox(box, w, h, color) {
  const bw = box.x2 - box.x1;
  const bh = box.y2 - box.y1;
  const dw = bw * ZOOM_SCALE;
  const dh = bh * ZOOM_SCALE;
  const dx = box.x1 - (dw - bw) / 2;
  const dy = box.y1 - (dh - bh) / 2;
  const sx = w - box.x2;
  const sy = box.y1;

  ctx.drawImage(video, sx, sy, bw, bh, dx, dy, dw, dh);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.strokeRect(dx, dy, dw, dh);
}

function drawLabel(box, color) {
  const side = box.x1 + (box.x2 - box.x1) / 2 < overlay.width / 2 ? "Tangan Kanan" : "Tangan Kiri";
  ctx.font = "600 " + Math.max(14, overlay.width * 0.022) + "px 'Segoe UI', Arial";
  const text = side;
  const tw = ctx.measureText(text).width;
  const tx = box.x1;
  const ty = Math.max(0, box.y1 - 10);
  const pad = 5;

  ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
  ctx.fillRect(tx - pad, ty - 20, tw + pad * 2, 24);
  ctx.fillStyle = color;
  ctx.fillText(text, tx, ty - 4);
}

function drawSkeleton(hand, w, h, color) {
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = 3;
  for (const [a, b] of CONNECTIONS) {
    const pa = mapPoint(hand[a], w, h);
    const pb = mapPoint(hand[b], w, h);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawPoints(hand, w, h, color) {
  ctx.fillStyle = color;
  const s = Math.max(6, w * 0.014);
  for (const lm of hand) {
    const x = (1 - lm.x) * w;
    const y = lm.y * h;
    ctx.fillRect(x - s / 2, y - s / 2, s, s);
  }
}

function mapPoint(lm, w, h) {
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

init();