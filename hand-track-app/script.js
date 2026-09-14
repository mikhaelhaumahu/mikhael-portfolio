import { FilesetResolver, HandLandmarker } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

const video = document.getElementById("video");
const stage = document.getElementById("stage");
const drawCanvas = document.getElementById("draw");
const overlayCanvas = document.getElementById("overlay");
const statusEl = document.getElementById("status");
const clearBtn = document.getElementById("clear");
const colorBtns = document.querySelectorAll(".color");

const drawCtx = drawCanvas.getContext("2d");
const overCtx = overlayCanvas.getContext("2d");

let handLandmarker = null;
let currentColor = "#ff5252";
let currentFactor = 0.012;
let lastX = null;
let lastY = null;
let eLastX = null;
let eLastY = null;
let drawing = false;
let erasing = false;

const SMOOTH_FRAMES = 3;
let indexHistory = [];
let middleHistory = [];
let pinchThreshold = 36;

const CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
];

const VISION_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

colorBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentColor = btn.dataset.color;
    colorBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

const sizeBtns = document.querySelectorAll(".size");
sizeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    currentFactor = parseFloat(btn.dataset.size);
    sizeBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    updateLineWidth();
  });
});

function updateLineWidth() {
  drawCtx.lineCap = "round";
  drawCtx.lineJoin = "round";
  drawCtx.lineWidth = drawCanvas.width * currentFactor;
}

clearBtn.addEventListener("click", () => {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);
});

window.addEventListener("resize", () => {
  updateLineWidth();
});

async function init() {
  try {
    await startCamera();
    statusEl.textContent = "Memuat model kecerdasan buatan...";
    await loadModel();
    statusEl.textContent = "Arahkan tangan ke kamera";
    runLoop();
  } catch (err) {
    statusEl.textContent = "Gagal: " + err.message;
  }
}

async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { width: { ideal: 640 }, height: { ideal: 480 } }
  });
  video.srcObject = stream;
  await new Promise((resolve) => {
    video.addEventListener("loadedmetadata", resolve, { once: true });
  });
  drawCanvas.width = video.videoWidth;
  drawCanvas.height = video.videoHeight;
  overlayCanvas.width = video.videoWidth;
  overlayCanvas.height = video.videoHeight;
  updateLineWidth();
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
  overCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (!results.landmarks || results.landmarks.length === 0) {
    drawing = false;
    erasing = false;
    lastX = null;
    lastY = null;
    eLastX = null;
    eLastY = null;
    indexHistory = [];
    middleHistory = [];
    statusEl.textContent = "Arahkan tangan ke kamera";
    return;
  }

  const hand = results.landmarks[0];
  const w = video.videoWidth;
  const h = video.videoHeight;

  drawSkeleton(hand, w, h);

  const indexTip = mapPoint(hand[8], w, h);
  const middleTip = mapPoint(hand[12], w, h);

  indexHistory.push(indexTip);
  middleHistory.push(middleTip);
  if (indexHistory.length > SMOOTH_FRAMES) indexHistory.shift();
  if (middleHistory.length > SMOOTH_FRAMES) middleHistory.shift();

  const smIndex = averagePoint(indexHistory);
  const smMiddle = averagePoint(middleHistory);

  overCtx.beginPath();
  overCtx.arc(smIndex.x, smIndex.y, 8, 0, Math.PI * 2);
  overCtx.fillStyle = "rgba(255, 82, 82, 0.9)";
  overCtx.fill();
  overCtx.beginPath();
  overCtx.moveTo(smIndex.x, smIndex.y);
  overCtx.lineTo(smMiddle.x, smMiddle.y);
  overCtx.strokeStyle = "rgba(255, 255, 255, 0.7)";
  overCtx.lineWidth = 2;
  overCtx.stroke();

  const dist = distance(smIndex, smMiddle);
  const isPinch = dist < pinchThreshold;
  const isEraser = isOpenPalm(hand);

  if (isEraser) {
    erasing = true;
    drawing = false;
    lastX = null;
    lastY = null;
    statusEl.textContent = "Penghapus aktif — gerakkan tangan untuk menghapus";

    overCtx.beginPath();
    overCtx.arc(smIndex.x, smIndex.y, 16, 0, Math.PI * 2);
    overCtx.strokeStyle = "#ffffff";
    overCtx.lineWidth = 3;
    overCtx.setLineDash([6, 6]);
    overCtx.stroke();
    overCtx.setLineDash([]);

    eraseStroke(smIndex);
    eLastX = smIndex.x;
    eLastY = smIndex.y;
    return;
  }

  erasing = false;
  eLastX = null;
  eLastY = null;

  if (isPinch) {
    drawing = true;
    statusEl.textContent = "Sedang menggambar!";
    overCtx.beginPath();
    overCtx.arc(smIndex.x, smIndex.y, 14, 0, Math.PI * 2);
    overCtx.strokeStyle = currentColor;
    overCtx.lineWidth = 3;
    overCtx.stroke();
  } else {
    drawing = false;
    statusEl.textContent = "Cubit untuk menggambar, buka telapak tangan lebar untuk menghapus";
  }

  if (drawing) {
    if (lastX !== null) {
      drawCtx.beginPath();
      drawCtx.moveTo(lastX, lastY);
      drawCtx.lineTo(smIndex.x, smIndex.y);
      drawCtx.strokeStyle = currentColor;
      drawCtx.stroke();
    }
    lastX = smIndex.x;
    lastY = smIndex.y;
  } else {
    lastX = null;
    lastY = null;
  }
}

function eraseStroke(p) {
  drawCtx.save();
  drawCtx.globalCompositeOperation = "destination-out";
  drawCtx.lineWidth = drawCanvas.width * currentFactor * 2.4;
  drawCtx.beginPath();
  if (eLastX !== null && eLastY !== null) {
    drawCtx.moveTo(eLastX, eLastY);
  } else {
    drawCtx.moveTo(p.x, p.y);
  }
  drawCtx.lineTo(p.x, p.y);
  drawCtx.stroke();
  drawCtx.restore();
}

function mapPoint(lm, w, h) {
  return { x: (1 - lm.x) * w, y: lm.y * h };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function distNorm(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isOpenPalm(hand) {
  const wrist = hand[0];
  const checks = [
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17]
  ];
  let extended = 0;
  for (const [tip, base] of checks) {
    if (distNorm(hand[tip], wrist) > distNorm(hand[base], wrist)) extended++;
  }
  return extended >= 4;
}

function averagePoint(list) {
  const len = list.length;
  if (len === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of list) {
    x += p.x;
    y += p.y;
  }
  return { x: x / len, y: y / len };
}

function drawSkeleton(hand, w, h) {
  overCtx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  overCtx.lineWidth = 2;
  for (const [a, b] of CONNECTIONS) {
    const pa = mapPoint(hand[a], w, h);
    const pb = mapPoint(hand[b], w, h);
    overCtx.beginPath();
    overCtx.moveTo(pa.x, pa.y);
    overCtx.lineTo(pb.x, pb.y);
    overCtx.stroke();
  }
}

init();