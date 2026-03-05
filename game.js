const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreNode = document.getElementById('score');
const livesNode = document.getElementById('lives');
const levelNode = document.getElementById('level');
const restartButton = document.getElementById('restart');

const keys = new Set();
const WORLD = { width: canvas.width, height: canvas.height };

let state;

function rand(min, max) {
  return Math.random() * (max - min) + min;
}

function resetState() {
  state = {
    player: {
      x: 120,
      y: WORLD.height - 100,
      w: 28,
      h: 36,
      speed: 220
    },
    score: 0,
    lives: 3,
    level: 1,
    notesNeeded: 8,
    notes: [],
    enemies: [],
    jiggy: null,
    invulnUntil: 0,
    gameOver: false,
    win: false
  };

  spawnNotes(8);
  spawnEnemies(2);
  updateHud();
}

function spawnNotes(count) {
  for (let i = 0; i < count; i++) {
    state.notes.push({
      x: rand(40, WORLD.width - 40),
      y: rand(70, WORLD.height - 70),
      r: 8
    });
  }
}

function spawnEnemies(count) {
  for (let i = 0; i < count; i++) {
    const speed = rand(90, 150) + state.level * 10;
    state.enemies.push({
      x: rand(100, WORLD.width - 100),
      y: rand(80, WORLD.height - 80),
      r: 15,
      vx: Math.random() > 0.5 ? speed : -speed,
      vy: Math.random() > 0.5 ? speed : -speed
    });
  }
}

function spawnJiggy() {
  if (!state.jiggy) {
    state.jiggy = {
      x: rand(80, WORLD.width - 80),
      y: rand(80, WORLD.height - 80),
      r: 16
    };
  }
}

function updateHud() {
  scoreNode.textContent = String(state.score);
  livesNode.textContent = String(state.lives);
  levelNode.textContent = String(state.level);
}

function circleRectHit(circle, rect) {
  const cx = Math.max(rect.x, Math.min(circle.x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(circle.y, rect.y + rect.h));
  const dx = circle.x - cx;
  const dy = circle.y - cy;
  return dx * dx + dy * dy < circle.r * circle.r;
}

function handleInput(dt) {
  const p = state.player;
  let dx = 0;
  let dy = 0;

  if (keys.has('ArrowLeft') || keys.has('a')) dx -= 1;
  if (keys.has('ArrowRight') || keys.has('d')) dx += 1;
  if (keys.has('ArrowUp') || keys.has('w')) dy -= 1;
  if (keys.has('ArrowDown') || keys.has('s')) dy += 1;

  if (dx !== 0 || dy !== 0) {
    const mag = Math.hypot(dx, dy);
    p.x += (dx / mag) * p.speed * dt;
    p.y += (dy / mag) * p.speed * dt;
  }

  p.x = Math.max(0, Math.min(WORLD.width - p.w, p.x));
  p.y = Math.max(0, Math.min(WORLD.height - p.h, p.y));
}

function update(dt, now) {
  if (state.gameOver || state.win) return;

  handleInput(dt);

  // Note collection
  state.notes = state.notes.filter((note) => {
    if (circleRectHit(note, state.player)) {
      state.score += 1;
      updateHud();
      return false;
    }
    return true;
  });

  if (state.score >= state.notesNeeded && !state.jiggy) {
    spawnJiggy();
  }

  // Enemy movement + collision
  for (const enemy of state.enemies) {
    enemy.x += enemy.vx * dt;
    enemy.y += enemy.vy * dt;

    if (enemy.x - enemy.r <= 0 || enemy.x + enemy.r >= WORLD.width) enemy.vx *= -1;
    if (enemy.y - enemy.r <= 0 || enemy.y + enemy.r >= WORLD.height) enemy.vy *= -1;

    if (now > state.invulnUntil && circleRectHit(enemy, state.player)) {
      state.lives -= 1;
      state.invulnUntil = now + 1200;
      state.player.x = 120;
      state.player.y = WORLD.height - 100;
      updateHud();
      if (state.lives <= 0) {
        state.gameOver = true;
      }
    }
  }

  // Jiggy collection advances level
  if (state.jiggy && circleRectHit(state.jiggy, state.player)) {
    state.level += 1;
    state.notesNeeded += 4;
    state.jiggy = null;
    spawnNotes(6 + state.level);
    spawnEnemies(1);
    updateHud();

    if (state.level > 3) {
      state.win = true;
    }
  }
}

function drawNote(note) {
  ctx.fillStyle = '#ffd400';
  ctx.beginPath();
  ctx.arc(note.x, note.y, note.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#614400';
  ctx.fillRect(note.x - 2, note.y - 11, 4, 7);
}

function drawEnemy(enemy) {
  ctx.fillStyle = '#ff6b6b';
  ctx.beginPath();
  ctx.arc(enemy.x, enemy.y, enemy.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#381010';
  ctx.fillRect(enemy.x - 5, enemy.y - 3, 3, 3);
  ctx.fillRect(enemy.x + 2, enemy.y - 3, 3, 3);
}

function drawPlayer(now) {
  const p = state.player;
  const blinking = now < state.invulnUntil && Math.floor(now / 100) % 2 === 0;
  if (blinking) return;

  // Banjo-ish bear body
  ctx.fillStyle = '#8c5b2d';
  ctx.fillRect(p.x, p.y, p.w, p.h);

  // Kazooie-ish backpack wing
  ctx.fillStyle = '#e64a33';
  ctx.beginPath();
  ctx.moveTo(p.x + p.w, p.y + 6);
  ctx.lineTo(p.x + p.w + 18, p.y + 14);
  ctx.lineTo(p.x + p.w, p.y + 24);
  ctx.closePath();
  ctx.fill();

  // eye
  ctx.fillStyle = '#fff';
  ctx.fillRect(p.x + 18, p.y + 8, 6, 6);
  ctx.fillStyle = '#000';
  ctx.fillRect(p.x + 21, p.y + 10, 2, 2);
}

function drawJiggy(jiggy, now) {
  const pulse = 1 + Math.sin(now / 140) * 0.08;
  ctx.save();
  ctx.translate(jiggy.x, jiggy.y);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#ffe877';
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI * 2 * i) / 8;
    const r = i % 2 === 0 ? jiggy.r : jiggy.r * 0.52;
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawMessage(text, color) {
  ctx.fillStyle = '#0008';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);
  ctx.fillStyle = color;
  ctx.font = 'bold 42px Trebuchet MS';
  ctx.textAlign = 'center';
  ctx.fillText(text, WORLD.width / 2, WORLD.height / 2);
}

function render(now) {
  ctx.clearRect(0, 0, WORLD.width, WORLD.height);

  // Scenic background details
  ctx.fillStyle = '#6ac2ff';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height * 0.58);
  ctx.fillStyle = '#62b55a';
  ctx.fillRect(0, WORLD.height * 0.58, WORLD.width, WORLD.height * 0.42);

  for (const note of state.notes) drawNote(note);
  for (const enemy of state.enemies) drawEnemy(enemy);
  if (state.jiggy) drawJiggy(state.jiggy, now);
  drawPlayer(now);

  if (state.gameOver) {
    drawMessage('Game Over — press Restart!', '#ff9d9d');
  }

  if (state.win) {
    drawMessage('You Win! Dad is now the Jiggy Master 🏆', '#fff3a3');
  }
}

let previous = performance.now();
function frame(now) {
  const dt = Math.min(0.032, (now - previous) / 1000);
  previous = now;

  update(dt, now);
  render(now);
  requestAnimationFrame(frame);
}

window.addEventListener('keydown', (event) => {
  keys.add(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

window.addEventListener('keyup', (event) => {
  keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
});

restartButton.addEventListener('click', () => {
  resetState();
});

resetState();
requestAnimationFrame(frame);
