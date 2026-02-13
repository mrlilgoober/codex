const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const levelEl = document.getElementById("level");
const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("start");
const restartBtn = document.getElementById("restart");

const WORLD = { width: canvas.width, height: canvas.height };
const TOTAL_LEVELS = 3;

const LEVEL_CONFIGS = [
  { notes: 9, time: 50, witchSpeed: 2.1, witchRange: [460, 670] },
  { notes: 12, time: 45, witchSpeed: 2.7, witchRange: [420, 680] },
  { notes: 15, time: 40, witchSpeed: 3.2, witchRange: [380, 690] },
];

const player = { x: 90, y: 320, size: 22, speed: 4 };
const witch = { x: 570, y: 285, size: 28, vx: 2.2, minX: 430, maxX: 670 };

const keys = new Set();
let gameInterval;
let timerInterval;
let level;
let timeLeft;
let score;
let lives;
let ended;
let runStarted;
let notes = [];

function randomInRange(min, max) {
  return Math.random() * (max - min) + min;
}

function createNotes(count) {
  return Array.from({ length: count }, () => ({
    x: randomInRange(40, WORLD.width - 40),
    y: randomInRange(100, WORLD.height - 35),
    size: 8,
    collected: false,
  }));
}

function updateHud() {
  levelEl.textContent = `Level: ${level}`;
  scoreEl.textContent = `Notes: ${score}/${notes.length}`;
  livesEl.textContent = `Feathers: ${lives}`;
  timerEl.textContent = `Time: ${timeLeft}`;
}

function placeAtSpawn() {
  player.x = 90;
  player.y = 320;
}

function loadLevel(levelNumber) {
  const cfg = LEVEL_CONFIGS[levelNumber - 1];
  level = levelNumber;
  score = 0;
  timeLeft = cfg.time;
  notes = createNotes(cfg.notes);

  witch.x = 570;
  witch.y = 285;
  witch.vx = cfg.witchSpeed;
  witch.minX = cfg.witchRange[0];
  witch.maxX = cfg.witchRange[1];

  placeAtSpawn();
  messageEl.textContent = `Level ${level}: Collect all notes!`;
  messageEl.className = "";
  updateHud();
}

function startRun() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);

  lives = 3;
  ended = false;
  runStarted = true;
  loadLevel(1);

  gameInterval = setInterval(tick, 1000 / 60);
  timerInterval = setInterval(() => {
    if (ended || !runStarted) return;
    timeLeft -= 1;
    updateHud();

    if (timeLeft <= 0) {
      finish(false, "Time's up! The witch wins this run.");
    }
  }, 1000);
}

function nextLevel() {
  if (level >= TOTAL_LEVELS) {
    finish(true, "🏆 You beat all levels! Dad is hero of Spiral Meadow!");
    return;
  }

  loadLevel(level + 1);
}

function finish(won, text) {
  ended = true;
  runStarted = false;
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  messageEl.textContent = text;
  messageEl.className = won ? "win" : "lose";
}

function circlesCollide(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const radius = a.size + b.size;
  return dx * dx + dy * dy < radius * radius;
}

function movePlayer() {
  if (keys.has("arrowleft") || keys.has("a")) player.x -= player.speed;
  if (keys.has("arrowright") || keys.has("d")) player.x += player.speed;
  if (keys.has("arrowup") || keys.has("w")) player.y -= player.speed;
  if (keys.has("arrowdown") || keys.has("s")) player.y += player.speed;

  player.x = Math.max(player.size, Math.min(WORLD.width - player.size, player.x));
  player.y = Math.max(70, Math.min(WORLD.height - player.size, player.y));
}

function moveWitch() {
  witch.x += witch.vx;
  if (witch.x < witch.minX || witch.x > witch.maxX) {
    witch.vx *= -1;
  }
}

function handleCollisions() {
  for (const note of notes) {
    if (note.collected || !circlesCollide(player, note)) continue;
    note.collected = true;
    score += 1;
    updateHud();

    if (score === notes.length) {
      nextLevel();
      return;
    }
  }

  if (circlesCollide(player, witch)) {
    lives -= 1;
    placeAtSpawn();
    updateHud();

    if (lives <= 0) {
      finish(false, "Out of feathers! Try the run again.");
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#92ebff";
  ctx.fillRect(0, 0, WORLD.width, 150);

  ctx.fillStyle = "#71d67f";
  ctx.fillRect(0, 150, WORLD.width, WORLD.height - 150);

  ctx.fillStyle = "#4cad5f";
  ctx.fillRect(0, 315, WORLD.width, WORLD.height - 315);

  ctx.fillStyle = "#f7f7ff";
  ctx.beginPath();
  ctx.arc(640, 70, 26, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  ctx.fillStyle = "#8b5a2b";
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ff4b3e";
  ctx.beginPath();
  ctx.moveTo(player.x - 5, player.y);
  ctx.lineTo(player.x - 30, player.y - 12);
  ctx.lineTo(player.x - 22, player.y + 11);
  ctx.closePath();
  ctx.fill();
}

function drawWitch() {
  ctx.fillStyle = "#732f91";
  ctx.beginPath();
  ctx.arc(witch.x, witch.y, witch.size, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#2f103f";
  ctx.beginPath();
  ctx.moveTo(witch.x, witch.y - 35);
  ctx.lineTo(witch.x - 22, witch.y - 8);
  ctx.lineTo(witch.x + 22, witch.y - 8);
  ctx.closePath();
  ctx.fill();
}

function drawNotes() {
  ctx.fillStyle = "#ffe15f";
  for (const note of notes) {
    if (note.collected) continue;

    ctx.beginPath();
    ctx.arc(note.x, note.y, note.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(note.x + 4, note.y - 18, 4, 18);
  }
}

function drawTitleScreen() {
  drawBackground();
  ctx.fillStyle = "rgba(26, 19, 64, 0.82)";
  ctx.fillRect(80, 90, 560, 220);

  ctx.fillStyle = "#fff6d5";
  ctx.textAlign = "center";
  ctx.font = "bold 34px Trebuchet MS";
  ctx.fillText("Bear & Bird", WORLD.width / 2, 150);

  ctx.font = "20px Trebuchet MS";
  ctx.fillText("Dad's Adventure", WORLD.width / 2, 186);

  ctx.font = "16px Trebuchet MS";
  ctx.fillText("Press Start Adventure below", WORLD.width / 2, 236);
  ctx.fillText("Clear 3 levels to win", WORLD.width / 2, 266);
}

function tick() {
  if (ended || !runStarted) return;

  movePlayer();
  moveWitch();
  handleCollisions();

  drawBackground();
  drawNotes();
  drawPlayer();
  drawWitch();
}

window.addEventListener("keydown", (event) => {
  keys.add(event.key.toLowerCase());
});

window.addEventListener("keyup", (event) => {
  keys.delete(event.key.toLowerCase());
});

startBtn.addEventListener("click", startRun);
restartBtn.addEventListener("click", startRun);

level = 1;
score = 0;
lives = 3;
timeLeft = LEVEL_CONFIGS[0].time;
ended = false;
runStarted = false;
notes = [];
updateHud();
drawTitleScreen();
messageEl.textContent = "Press Start Adventure to begin your run.";
