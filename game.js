const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const ui = {
  start: document.querySelector("#startScreen"),
  end: document.querySelector("#endScreen"),
  pause: document.querySelector("#pauseScreen"),
  startButton: document.querySelector("#startButton"),
  restartButton: document.querySelector("#restartButton"),
  soundButton: document.querySelector("#soundButton"),
  livesButton: document.querySelector("#livesButton"),
  health: document.querySelector("#health"),
  specials: document.querySelector("#specialCount"),
  waveHud: document.querySelector("#waveHud"),
  waveNum: document.querySelector("#waveNum"),
  waveTotal: document.querySelector("#waveTotal"),
  enemyNum: document.querySelector("#enemyNum"),
  endEyebrow: document.querySelector("#endEyebrow"),
  endTitle: document.querySelector("#endTitle"),
  endMessage: document.querySelector("#endMessage"),
  statTime: document.querySelector("#statTime"),
  statKills: document.querySelector("#statKills"),
  statDeaths: document.querySelector("#statDeaths"),
  statScore: document.querySelector("#statScore"),
  scoreEntry: document.querySelector("#scoreEntry"),
  nameInput: document.querySelector("#nameInput"),
  submitScore: document.querySelector("#submitScore"),
  scoreNote: document.querySelector("#scoreNote"),
  leaderboardList: document.querySelector("#leaderboardList"),
  touchControls: document.querySelector("#touchControls"),
  moveStick: document.querySelector("#moveStick"),
  moveKnob: document.querySelector("#moveKnob"),
  fireTouch: document.querySelector("#fireTouch"),
  yarnTouch: document.querySelector("#yarnTouch"),
  pauseTouch: document.querySelector("#pauseTouch"),
  resumeTouch: document.querySelector("#resumeTouch"),
  pauseLivesBtn: document.querySelector("#pauseLivesBtn"),
  pauseSoundBtn: document.querySelector("#pauseSoundBtn"),
  pauseLivesState: document.querySelector("#pauseLivesState"),
  pauseSoundState: document.querySelector("#pauseSoundState"),
  pauseHealth: document.querySelector("#pauseHealth"),
  pauseYarn: document.querySelector("#pauseYarn"),
  mobileStatus: document.querySelector("#mobileStatus"),
  mobileHealth: document.querySelector("#mobileHealth"),
  mobileYarn: document.querySelector("#mobileYarn"),
};

const W = canvas.width;
const H = canvas.height;
const TAU = Math.PI * 2;
const BORDER = 28;

const colors = {
  sky: "#fff8e8",
  floorA: "#b8e6d0",
  floorB: "#fff5e0",
  grid: "#a8d9c4",
  wall: "#c8b8e8",
  wallTop: "#ddd4f5",
  wallDark: "#a898cc",
  wallLine: "#8b7eb8",
  tank: "#7ecfc4",
  tankLight: "#b8ede8",
  tankDark: "#5bafa6",
  acid: "#98e0d8",
  cat: "#5a6578",
  catLight: "#8b96a8",
  catEye: "#ffeaa8",
  catEyeShine: "#fff8e8",
  catNose: "#ffb8c8",
  catEar: "#e8a8bc",
  orange: "#ffb88c",
  cream: "#fff5e0",
  peach: "#ffd4a8",
  shellFoe: "#ffd4a8",
  shellPlayer: "#ffb88c",
  ink: "#5a6578",
  cloud: "#d4eeff",
  cloudDark: "#b8dcf0",
  accent: "#f5a962",
};

// Enemy archetypes — every one is a cat-driven tank.
const KINDS = {
  rook: {
    hull: "#ffeaa8", light: "#fff4cc", dark: "#e8c878",
    speed: 0, turretRate: 3.5, fireRate: 0.78, shellSpeed: 560,
    maxBounces: 2, aimTol: 0.20, health: 2, r: 24, armored: true,
    weapon: "rocket",
    fur: "tabby", meowPitch: 0.78,
  },
  chaser: {
    hull: "#a8d8f0", light: "#d4eeff", dark: "#7bb8d8",
    speed: 76, turretRate: 3.0, fireRate: 2.3, shellSpeed: 335,
    maxBounces: 1, aimTol: 0.22, health: 1, r: 20, armored: false,
    fur: "blue", meowPitch: 1.0,
  },
  dasher: {
    hull: "#ffd4e0", light: "#ffe8f0", dark: "#e8a8bc",
    speed: 138, turretRate: 4.2, fireRate: 1.5, shellSpeed: 385,
    maxBounces: 0, aimTol: 0.30, health: 1, r: 18, armored: false,
    fur: "calico", meowPitch: 1.28,
  },
  bruiser: {
    hull: "#9aa8bc", light: "#c4ced8", dark: "#6b7a8f",
    speed: 152, turretRate: 4.2, fireRate: 1.15, shellSpeed: 430,
    maxBounces: 1, aimTol: 0.20, health: 1, r: 22, armored: false,
    cloaks: true, aggressive: true,
    fur: "void", meowPitch: 0.92,
  },
};

const WAVES = [
  ["chaser", "chaser"],
  ["chaser", "chaser", "dasher"],
  ["chaser", "dasher", "dasher"],
  ["chaser", "rook", "dasher"],
  ["chaser", "bruiser", "dasher", "rook"],
  ["bruiser", "bruiser", "chaser", "dasher", "dasher"],
  ["rook", "bruiser", "bruiser", "dasher", "dasher", "chaser"],
  ["rook", "rook", "bruiser", "bruiser", "dasher", "dasher", "chaser"],
  ["rook", "rook", "bruiser", "bruiser", "dasher", "dasher", "chaser", "chaser"],
];

// Open pads kept clear of the redesigned maze.
const SPAWNS = [
  { x: 1120, y: 120 }, { x: 1120, y: 600 }, { x: 1120, y: 360 },
  { x: 640, y: 100 }, { x: 640, y: 620 }, { x: 900, y: 360 },
  { x: 420, y: 120 }, { x: 420, y: 600 },
];

const PLAYER_MAX_SHELLS = 5;
const LB_KEY = "tanks-vs-cats-lb-v1";
const LB_MAX = 8;

const keys = new Set();
const mouse = { x: W * 0.7, y: H * 0.5, down: false };
const touch = {
  using: false,
  mx: 0,
  my: 0,
  firing: false,
  pointerId: null,
};
let mode = "menu";
let muted = false;
let unlimitedLives = false;
let lastTime = 0;
let audioContext;
const meowVoices = Array.from({ length: 5 }, () => {
  const audio = new Audio("./audio/cat-meow.mp3");
  audio.preload = "auto";
  return audio;
});
let meowVoiceIndex = 0;
let shake = 0;
let freeze = 0;
let game;
let pendingScore = null;
let highlightScoreId = null;

const wantsTouchUi = () =>
  window.matchMedia("(pointer: coarse)").matches
  || window.matchMedia("(max-width: 820px)").matches;

const walls = [
  // Left mid L
  { x: 210, y: 170, w: 30, h: 170 },
  { x: 210, y: 310, w: 150, h: 30 },
  // Top center pillar
  { x: 540, y: 70, w: 30, h: 150 },
  // Top right L
  { x: 850, y: 90, w: 220, h: 30 },
  { x: 1040, y: 90, w: 30, h: 150 },
  // Center corridor split (gap in the middle)
  { x: 390, y: 330, w: 150, h: 30 },
  { x: 700, y: 330, w: 150, h: 30 },
  // Mid-right pillars
  { x: 760, y: 200, w: 30, h: 90 },
  { x: 760, y: 430, w: 30, h: 90 },
  // Bottom left L
  { x: 170, y: 510, w: 170, h: 30 },
  { x: 170, y: 510, w: 30, h: 130 },
  // Bottom center pillar
  { x: 540, y: 500, w: 30, h: 150 },
  // Bottom right L
  { x: 850, y: 560, w: 220, h: 30 },
  { x: 850, y: 440, w: 30, h: 150 },
];

function random(min, max) { return Math.random() * (max - min) + min; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function angleTo(a, b) { return Math.atan2(b.y - a.y, b.x - a.x); }
function angleDelta(a, b) { return Math.atan2(Math.sin(b - a), Math.cos(b - a)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function resetGame() {
  game = {
    time: 0,
    wave: 0,
    kills: 0,
    deaths: 0,
    levelStartKills: 0,
    bounceCount: 0,
    killsSinceYarn: 0,
    lives: 3,
    player: {
      x: 120, y: 360, r: 20, angle: 0, turret: 0, health: 1,
      cooldown: 0, invincible: 0, specials: 3, tread: 0, flash: 0,
    },
    enemies: [],
    shells: [],
    yarn: [],
    particles: [],
    rings: [],
    marks: [],
    banner: null,
    waveClearTimer: 0,
  };
  pendingScore = null;
  highlightScoreId = null;
  updateHud();
}

function startGame() {
  resetGame();
  mode = "playing";
  ui.start.classList.add("hidden");
  ui.end.classList.add("hidden");
  ui.pause.classList.add("hidden");
  ui.waveHud.classList.remove("hidden");
  ui.waveTotal.textContent = WAVES.length;
  ui.scoreEntry.classList.add("hidden");
  setTouchControlsVisible(true);
  ensureAudio();
  sound("start");
  startWave(0);
}

function startWave(index, isRetry = false) {
  game.wave = index;
  if (!isRetry) game.levelStartKills = game.kills;
  const roster = WAVES[index];
  const used = [];
  roster.forEach((kind, i) => {
    const spot = findSpawn(kind, used);
    used.push(spot);
    const enemy = makeEnemy(kind, spot.x, spot.y);
    game.enemies.push(enemy);
  });
  game.banner = { text: `WAVE ${index + 1}`, sub: subtitleFor(index), time: 1.9 };
  updateHud();
  sound("wave");
}

function findSpawn(kind, used) {
  const r = KINDS[kind].r + 2;
  const clearance = kind === "rook" ? 86 : r;
  const player = game.player;
  const candidates = SPAWNS
    .filter(p => !blockedAt(p.x, p.y, clearance))
    .filter(p => distance(p, player) > 280)
    .filter(p => used.every(u => distance(p, u) > 70))
    .sort(() => Math.random() - 0.5);
  if (candidates.length) return candidates[0];

  // Fallback: probe open floor so we never spawn inside a barrier.
  for (let attempt = 0; attempt < 80; attempt++) {
    const p = {
      x: random(80, W - 80),
      y: random(80, H - 80),
    };
    if (blockedAt(p.x, p.y, clearance)) continue;
    if (distance(p, player) < 260) continue;
    if (used.some(u => distance(p, u) < 70)) continue;
    return p;
  }
  return { x: W - 120, y: H / 2 };
}

function subtitleFor(index) {
  return [
    "STANDARD BLUE PATROL",
    "FAST CATS INCOMING",
    "SPEED TRIAL",
    "ROCKET CAT SPOTTED",
    "THE VOID ROLLS IN",
    "ARMORED LITTER",
    "ROCKET ALLEY",
    "NINE LIVES, NO MERCY",
    "THE FINAL MEOWDOWN",
  ][index] || "INCOMING";
}

function makeEnemy(kind, x, y) {
  const k = KINDS[kind];
  return {
    kind, x, y, r: k.r, angle: random(0, TAU), turret: random(0, TAU),
    health: k.health, maxHealth: k.health,
    moveDir: random(0, TAU), repath: random(0.2, 1),
    fireCd: random(1.4, 2.6), flash: 0, blink: 0, hitFlash: 0,
    distract: 0, tread: 0, spawnT: 0.7, alive: true, invincible: 0,
    meowCd: random(12, 24),
    cloak: 0, cloakCd: k.cloaks ? random(0.15, 0.45) : Infinity,
  };
}

function endGame(won) {
  mode = won ? "won" : "lost";
  mouse.down = false;
  touch.firing = false;
  touch.mx = 0;
  touch.my = 0;
  resetStickKnob();
  setTouchControlsVisible(false);
  ui.pause.classList.add("hidden");

  const score = computeScore(won);
  pendingScore = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    score,
    time: Math.floor(game.time),
    deaths: game.deaths,
    kills: game.kills,
    wave: Math.min(game.wave + 1, WAVES.length),
    won,
    unlimited: unlimitedLives,
    submitted: false,
  };

  ui.endEyebrow.textContent = won ? "MISSION COMPLETE" : "MISSION FAILED";
  ui.endTitle.innerHTML = won ? "CATS<br><em>ROUTED.</em>" : "TANK<br><em>SCRAPPED.</em>";
  ui.endMessage.textContent = won
    ? "The living room is secure. Every cat tank is a smoking wreck."
    : "The platoon overran you. Regroup and roll out again.";
  ui.statTime.textContent = formatTime(game.time);
  ui.statKills.textContent = game.kills;
  ui.statDeaths.textContent = game.deaths;
  ui.statScore.textContent = score.toLocaleString();
  setupScoreEntry(pendingScore);
  renderLeaderboard();
  ui.end.classList.remove("hidden");
  ui.waveHud.classList.add("hidden");
  sound(won ? "win" : "lose");
}

function computeScore(won) {
  const time = Math.floor(game.time);
  const wavesCleared = won ? WAVES.length : game.wave;
  const base = wavesCleared * 8000 + game.kills * 450;
  const clearBonus = won ? 25000 : 0;
  const timeBonus = won
    ? Math.max(0, 780 - time) * 90
    : Math.max(0, wavesCleared * 40 - Math.floor(time / 4)) * 20;
  const deathPenalty = game.deaths * 3500;
  return Math.max(0, Math.floor(base + clearBonus + timeBonus - deathPenalty));
}

function loadScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

function saveScores(list) {
  localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, LB_MAX)));
}

function setupScoreEntry(entry) {
  if (!entry) {
    ui.scoreEntry.classList.add("hidden");
    return;
  }
  ui.scoreEntry.classList.remove("hidden");
  ui.submitScore.disabled = false;
  ui.nameInput.value = (localStorage.getItem("tanks-vs-cats-name") || "AAA").slice(0, 3).toUpperCase();

  if (entry.unlimited) {
    ui.scoreNote.textContent = "Practice / unlimited lives — not eligible for the high-score board.";
    ui.scoreNote.className = "score-note blocked";
    ui.submitScore.disabled = true;
    ui.nameInput.disabled = true;
  } else {
    ui.scoreNote.textContent = "Arcade board is saved on this device. Faster clears + fewer deaths rank higher.";
    ui.scoreNote.className = "score-note eligible";
    ui.nameInput.disabled = false;
    if (entry.submitted) {
      ui.scoreNote.textContent = "Score saved to this device's high-score board.";
      ui.submitScore.disabled = true;
    }
  }
}

function sanitizeInitials(value) {
  const cleaned = (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 3);
  return cleaned.padEnd(3, "A");
}

function submitPendingScore() {
  if (!pendingScore || pendingScore.unlimited || pendingScore.submitted) return;
  const name = sanitizeInitials(ui.nameInput.value);
  ui.nameInput.value = name;
  localStorage.setItem("tanks-vs-cats-name", name);

  const list = loadScores();
  list.push({
    id: pendingScore.id,
    name,
    score: pendingScore.score,
    time: pendingScore.time,
    deaths: pendingScore.deaths,
    kills: pendingScore.kills,
    won: pendingScore.won,
    date: Date.now(),
  });
  list.sort((a, b) => b.score - a.score || a.time - b.time || a.deaths - b.deaths);
  saveScores(list);
  pendingScore.submitted = true;
  highlightScoreId = pendingScore.id;
  ui.submitScore.disabled = true;
  ui.scoreNote.textContent = "Score saved to this device's high-score board.";
  ui.scoreNote.className = "score-note eligible";
  renderLeaderboard();
  ensureAudio();
  tone(520, .08, "square", .03);
  setTimeout(() => tone(780, .12, "square", .03), 70);
}

function renderLeaderboard() {
  const list = loadScores();
  if (!list.length) {
    ui.leaderboardList.innerHTML = `<li class="empty">NO SCORES YET — CLEAR THE CATS</li>`;
    return;
  }
  ui.leaderboardList.innerHTML = list.map((row, i) => {
    const hi = row.id && row.id === highlightScoreId ? " highlight" : "";
    return `<li class="${hi.trim()}">
      <span class="rank">${String(i + 1).padStart(2, "0")}</span>
      <span class="name">${escapeHtml(row.name)}</span>
      <span class="pts">${Number(row.score).toLocaleString()}</span>
      <span class="meta">${formatTime(row.time)} · ${row.deaths}D</span>
    </li>`;
  }).join("");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function updateHud() {
  if (!game) return;
  const lives = Math.max(0, game.lives);
  const hearts = unlimitedLives
    ? "∞"
    : `${"● ".repeat(lives)}${"○ ".repeat(3 - lives)}`.trim();
  ui.health.textContent = hearts;
  ui.health.setAttribute("aria-label", unlimitedLives ? "Unlimited lives" : `${lives} lives`);
  ui.livesButton.setAttribute("aria-pressed", String(unlimitedLives));
  ui.specials.textContent = game.player.specials;
  ui.waveNum.textContent = game.wave + 1;
  ui.enemyNum.textContent = game.enemies.length;

  if (ui.mobileHealth) ui.mobileHealth.textContent = hearts;
  if (ui.mobileYarn) ui.mobileYarn.textContent = game.player.specials;
  if (ui.pauseHealth) ui.pauseHealth.textContent = hearts;
  if (ui.pauseYarn) ui.pauseYarn.textContent = game.player.specials;
  if (ui.pauseLivesBtn) {
    ui.pauseLivesBtn.setAttribute("aria-pressed", String(unlimitedLives));
    ui.pauseLivesState.textContent = unlimitedLives ? "ON" : "OFF";
  }
  if (ui.pauseSoundBtn) {
    ui.pauseSoundBtn.setAttribute("aria-pressed", String(!muted));
    ui.pauseSoundState.textContent = muted ? "OFF" : "ON";
  }
  const showMobileHud = wantsTouchUi() && (mode === "playing" || mode === "paused" || mode === "respawning");
  if (ui.mobileStatus) ui.mobileStatus.classList.toggle("hidden", !showMobileHud);
}

function ensureAudio() {
  if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === "suspended") audioContext.resume();
}

function tone(freq, duration, type = "square", volume = 0.035, slide = 0) {
  if (muted || !audioContext) return;
  const now = audioContext.currentTime;
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(freq, now);
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(gain).connect(audioContext.destination);
  oscillator.start(now);
  oscillator.stop(now + duration);
}

function sound(name, pitch = 1) {
  if (name === "shoot") tone(210, .07, "square", .025, -80);
  if (name === "foeShoot") tone(150, .08, "square", .018, -40);
  if (name === "rocket") { tone(82, .22, "sawtooth", .045, -30); tone(190, .09, "square", .018, -80); }
  if (name === "bounce") tone(380, .04, "square", .012, 80);
  if (name === "hit") { tone(160, .1, "square", .03, -40); tone(420, .06, "sine", .02, 80); }
  if (name === "kill") { tone(180, .16, "sawtooth", .04, -80); tone(520, .09, "square", .02, 120); }
  if (name === "hurt") tone(75, .28, "sawtooth", .06, -35);
  if (name === "yarn") { tone(460, .13, "sine", .035, 180); setTimeout(() => tone(690, .1, "sine", .025, 90), 70); }
  if (name === "wave") { [330, 440].forEach((f, i) => setTimeout(() => tone(f, .16, "square", .03), i * 110)); }
  if (name === "start") { [220, 330, 440].forEach((f, i) => setTimeout(() => tone(f, .12), i * 80)); }
  if (name === "win") { [330, 440, 660, 880].forEach((f, i) => setTimeout(() => tone(f, .2, "square", .035), i * 110)); }
  if (name === "lose") { [220, 165, 110].forEach((f, i) => setTimeout(() => tone(f, .3, "sawtooth", .04), i * 150)); }
  if (name === "meow") meow(pitch);
}

function meow(pitch = 1) {
  if (muted) return;
  const voice = meowVoices.find(audio => audio.paused || audio.ended)
    || meowVoices[meowVoiceIndex++ % meowVoices.length];
  voice.pause();
  voice.currentTime = 0;
  voice.playbackRate = clamp(pitch, 0.72, 1.35);
  voice.volume = 0.62;
  voice.play().catch(() => {
    // Keep an audible fallback if the browser blocks media playback.
    ensureAudio();
    tone(520 * pitch, .12, "sawtooth", .055, 220 * pitch);
    setTimeout(() => tone(760 * pitch, .20, "triangle", .05, -430 * pitch), 90);
  });
}

function circleRect(x, y, r, rect) {
  const cx = clamp(x, rect.x, rect.x + rect.w);
  const cy = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy < r * r;
}

function blockedAt(x, y, r) {
  return x - r < BORDER || x + r > W - BORDER || y - r < BORDER || y + r > H - BORDER ||
    walls.some(w => circleRect(x, y, r, w));
}

function moveCircle(entity, dx, dy) {
  if (!blockedAt(entity.x + dx, entity.y, entity.r)) entity.x += dx;
  if (!blockedAt(entity.x, entity.y + dy, entity.r)) entity.y += dy;
}

function lineBlocked(ax, ay, bx, by) {
  const steps = Math.ceil(Math.hypot(bx - ax, by - ay) / 12);
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = ax + (bx - ax) * t;
    const y = ay + (by - ay) * t;
    if (walls.some(w => x > w.x && x < w.x + w.w && y > w.y && y < w.y + w.h)) return true;
  }
  return false;
}

// Small A* grid used by aggressive Void tanks to route around the maze.
const NAV_CELL = 40;
const NAV_COLS = Math.floor((W - BORDER * 2) / NAV_CELL);
const NAV_ROWS = Math.floor((H - BORDER * 2) / NAV_CELL);

function navPoint(col, row) {
  return {
    x: BORDER + NAV_CELL / 2 + col * NAV_CELL,
    y: BORDER + NAV_CELL / 2 + row * NAV_CELL,
  };
}

function navSegmentOpen(entity, point, radius) {
  const steps = Math.max(1, Math.ceil(Math.hypot(point.x - entity.x, point.y - entity.y) / 10));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = entity.x + (point.x - entity.x) * t;
    const y = entity.y + (point.y - entity.y) * t;
    if (blockedAt(x, y, radius)) return false;
  }
  return true;
}

function nearestNavCell(entity, radius) {
  let best = null;
  let bestDistance = Infinity;
  for (let row = 0; row < NAV_ROWS; row++) {
    for (let col = 0; col < NAV_COLS; col++) {
      const point = navPoint(col, row);
      if (blockedAt(point.x, point.y, radius)) continue;
      if (!navSegmentOpen(entity, point, radius)) continue;
      const d = Math.hypot(point.x - entity.x, point.y - entity.y);
      if (d < bestDistance) {
        bestDistance = d;
        best = { col, row };
      }
    }
  }
  return best;
}

function navigationAngle(entity, target) {
  if (!lineBlocked(entity.x, entity.y, target.x, target.y)) {
    return angleTo(entity, target);
  }
  const clearance = entity.r + 3;
  const start = nearestNavCell(entity, clearance);
  const goal = nearestNavCell(target, clearance);
  if (!start || !goal) return angleTo(entity, target);
  if (start.col === goal.col && start.row === goal.row) return angleTo(entity, target);

  const key = (col, row) => `${col},${row}`;
  const startKey = key(start.col, start.row);
  const goalKey = key(goal.col, goal.row);
  const open = [{ ...start, g: 0, f: 0 }];
  const scores = new Map([[startKey, 0]]);
  const parents = new Map();
  const closed = new Set();
  const directions = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
  ];

  while (open.length) {
    let bestIndex = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIndex].f) bestIndex = i;
    }
    const current = open.splice(bestIndex, 1)[0];
    const currentKey = key(current.col, current.row);
    if (closed.has(currentKey)) continue;
    if (currentKey === goalKey) {
      let stepKey = goalKey;
      let parentKey = parents.get(stepKey);
      while (parentKey && parentKey !== startKey) {
        stepKey = parentKey;
        parentKey = parents.get(stepKey);
      }
      const [col, row] = stepKey.split(",").map(Number);
      return angleTo(entity, navPoint(col, row));
    }
    closed.add(currentKey);

    for (const [dc, dr] of directions) {
      const col = current.col + dc;
      const row = current.row + dr;
      if (col < 0 || row < 0 || col >= NAV_COLS || row >= NAV_ROWS) continue;
      const point = navPoint(col, row);
      if (blockedAt(point.x, point.y, clearance)) continue;
      if (dc && dr) {
        const sideA = navPoint(current.col + dc, current.row);
        const sideB = navPoint(current.col, current.row + dr);
        if (blockedAt(sideA.x, sideA.y, clearance) || blockedAt(sideB.x, sideB.y, clearance)) continue;
      }
      const nextKey = key(col, row);
      if (closed.has(nextKey)) continue;
      const g = current.g + (dc && dr ? 1.414 : 1);
      if (g >= (scores.get(nextKey) ?? Infinity)) continue;
      scores.set(nextKey, g);
      parents.set(nextKey, currentKey);
      const h = Math.hypot(goal.col - col, goal.row - row);
      open.push({ col, row, g, f: g + h });
    }
  }
  return angleTo(entity, target);
}

function activeYarn() {
  // Cats notice a yarn ball whether it's still rolling or has settled.
  return game.yarn.find(y => y.life > 0);
}

// ---- shells ----------------------------------------------------------------

function fireShell(owner, x, y, angle, speed, maxBounces, type = "shell", source = null) {
  game.shells.push({
    x, y, owner,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    r: type === "rocket" ? 9 : 6,
    life: type === "rocket" ? 7 : 3.4,
    bounces: 0, maxBounces, age: 0, type, source,
  });
  spawnMuzzle(x, y, angle, owner === "player" ? colors.acid : colors.shellFoe);
}

function shoot() {
  const p = game.player;
  const mine = game.shells.filter(s => s.owner === "player").length;
  if (p.cooldown > 0 || mine >= PLAYER_MAX_SHELLS) return;
  const nose = 30;
  fireShell("player", p.x + Math.cos(p.turret) * nose, p.y + Math.sin(p.turret) * nose, p.turret, 560, 1);
  p.cooldown = .24;
  p.flash = .07;
  sound("shoot");
}

function shootYarn() {
  const p = game.player;
  if (p.specials <= 0 || p.cooldown > 0) return;
  const speed = 430;
  game.yarn.push({
    x: p.x + Math.cos(p.turret) * 28,
    y: p.y + Math.sin(p.turret) * 28,
    vx: Math.cos(p.turret) * speed,
    vy: Math.sin(p.turret) * speed,
    r: 11, life: 7.5, landed: false, spin: 0, dir: p.turret,
  });
  p.specials--;
  p.cooldown = .4;
  sound("yarn");
  updateHud();
}

function spawnMuzzle(x, y, angle, color) {
  for (let i = 0; i < 6; i++) {
    const a = angle + random(-.6, .6);
    const s = random(45, 150);
    addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, random(2, 5), color, random(.1, .26));
  }
}

function addParticle(x, y, vx, vy, size, color, life, gravity = 0) {
  game.particles.push({ x, y, vx, vy, size, color, life, maxLife: life, gravity });
}

function burst(x, y, color, count = 16) {
  const puffColors = [colors.cream, colors.peach, colors.orange, color];
  for (let i = 0; i < count; i++) {
    const a = random(0, TAU);
    const s = random(25, 180);
    const c = puffColors[i % puffColors.length];
    addParticle(x, y, Math.cos(a) * s, Math.sin(a) * s, random(4, 10), c, random(.3, .9), 60);
  }
  game.rings.push({ x, y, r: 6, life: .4, maxLife: .4, color: colors.peach, puff: true });
}

// ---- update ----------------------------------------------------------------

function update(dt) {
  if (mode === "respawning") {
    updateEffects(dt);
    return;
  }
  if (mode !== "playing") return;
  game.time += dt;
  if (game.banner) {
    game.banner.time -= dt;
    if (game.banner.time <= 0) game.banner = null;
  }

  updatePlayer(dt);
  updateEnemies(dt);
  updateShells(dt);
  updateYarn(dt);
  updateEffects(dt);
  checkWaveProgress(dt);
}

function updatePlayer(dt) {
  const p = game.player;
  p.cooldown -= dt;
  p.invincible -= dt;
  p.flash -= dt;

  let mx = (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0);
  let my = (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0);
  if (touch.using && (Math.abs(touch.mx) > 0.08 || Math.abs(touch.my) > 0.08)) {
    mx = touch.mx;
    my = touch.my;
  }
  const mag = Math.hypot(mx, my) || 1;
  mx /= mag; my /= mag;
  const speed = 205;
  moveCircle(p, mx * speed * dt, my * speed * dt);
  if (mx || my) {
    p.angle += angleDelta(p.angle, Math.atan2(my, mx)) * Math.min(1, dt * 10);
    p.tread += dt * 10;
  }

  if (touch.using) {
    const target = nearestEnemyForAim();
    if (target) p.turret = angleTo(p, target);
    else if (Math.abs(mx) > 0.01 || Math.abs(my) > 0.01) p.turret = Math.atan2(my, mx);
  } else {
    p.turret = angleTo(p, mouse);
  }
  if (mouse.down || touch.firing) shoot();
}

function nearestEnemyForAim() {
  const p = game.player;
  let best = null;
  let bestDist = Infinity;
  for (const e of game.enemies) {
    if (!e.alive || e.spawnT > 0) continue;
    const d = distance(p, e);
    if (d < bestDist) {
      bestDist = d;
      best = e;
    }
  }
  return best;
}

function updateEnemies(dt) {
  const p = game.player;
  const yarn = activeYarn();

  for (const e of game.enemies) {
    const k = KINDS[e.kind];
    e.flash -= dt;
    e.hitFlash -= dt;
    e.blink -= dt;
    e.fireCd -= dt;
    e.invincible -= dt;
    e.meowCd -= dt;
    if (k.cloaks) {
      if (e.cloak > 0) {
        e.cloak -= dt;
        if (e.cloak <= 0) e.cloakCd = random(0.8, 1.6);
      } else {
        e.cloakCd -= dt;
      }
    }
    if (Math.random() < dt * .3 && e.blink <= 0) e.blink = .12;

    if (e.spawnT > 0) {
      e.spawnT -= dt;
      e.turret += dt * 2;
      continue;
    }

    // Distraction: a landed yarn ball nearby hijacks the cat's attention.
    const lured = yarn && distance(e, yarn) < 340;
    e.distract = lured ? Math.min(1, e.distract + dt * 3) : Math.max(0, e.distract - dt * 2);
    if (k.cloaks) {
      if (lured) {
        e.cloak = 0;
        e.cloakCd = Math.max(e.cloakCd, 2);
      } else if (e.cloak <= 0 && e.cloakCd <= 0) {
        e.cloak = random(2.4, 3.4);
      }
    }
    if (!lured && e.meowCd <= 0) {
      sound("meow", k.meowPitch * random(0.92, 1.08));
      e.meowCd = random(14, 28);
    }

    if (lured) {
      const a = angleTo(e, yarn);
      e.turret += angleDelta(e.turret, a) * Math.min(1, dt * 4);
      if (k.speed > 0 && distance(e, yarn) > 34) {
        const before = { x: e.x, y: e.y };
        moveCircle(e, Math.cos(a) * (k.speed * 1.15) * dt, Math.sin(a) * (k.speed * 1.15) * dt);
        e.tread += dt * 9;
        if (Math.hypot(e.x - before.x, e.y - before.y) < 0.05) e.moveDir = random(0, TAU);
      }
      if (distance(e, yarn) < 44) {
        yarn.life -= dt * 2.2;
        if (Math.random() < dt * 10) addParticle(yarn.x, yarn.y, random(-40, 40), random(-70, -15), 3, colors.orange, .4, 90);
      }
      continue;
    }

    // Movement / wander.
    if (k.speed > 0) {
      e.repath -= dt;
      const toP = angleTo(e, p);
      const dp = distance(e, p);
      if (e.repath <= 0) {
        if (k.aggressive) e.moveDir = navigationAngle(e, p);
        else if (dp > 430) e.moveDir = toP + random(-.6, .6);
        else if (dp < 190) e.moveDir = toP + Math.PI + random(-.6, .6);
        else e.moveDir = toP + (Math.random() < .5 ? 1 : -1) * (Math.PI / 2) + random(-.5, .5);
        e.repath = k.aggressive ? random(.15, .3) : random(.7, 1.6);
      }
      const before = { x: e.x, y: e.y };
      moveCircle(e, Math.cos(e.moveDir) * k.speed * dt, Math.sin(e.moveDir) * k.speed * dt);
      e.tread += dt * 8;
      if (Math.hypot(e.x - before.x, e.y - before.y) < 0.05) e.repath = 0;
    }

    // Aim + fire.
    const toP = angleTo(e, p);
    e.turret += angleDelta(e.turret, toP) * Math.min(1, dt * k.turretRate);
    if (e.fireCd <= 0) {
      const los = !lineBlocked(e.x, e.y, p.x, p.y);
      const aimed = Math.abs(angleDelta(e.turret, toP)) < k.aimTol;
      if ((los || k.weapon === "rocket") && aimed) {
        fireShell("enemy", e.x + Math.cos(e.turret) * 28, e.y + Math.sin(e.turret) * 28, e.turret, k.shellSpeed, k.maxBounces, k.weapon, e);
        e.fireCd = k.fireRate * random(.85, 1.2);
        e.flash = .08;
        sound(k.weapon === "rocket" ? "rocket" : "foeShoot");
      } else if (!los && k.maxBounces > 0 && Math.random() < dt * .5) {
        fireShell("enemy", e.x + Math.cos(e.turret) * 28, e.y + Math.sin(e.turret) * 28, e.turret, k.shellSpeed, k.maxBounces, k.weapon, e);
        e.fireCd = k.fireRate * 1.5;
        e.flash = .08;
        sound(k.weapon === "rocket" ? "rocket" : "foeShoot");
      }
    }
  }

  // Light separation so cat tanks don't stack.
  for (let i = 0; i < game.enemies.length; i++) {
    for (let j = i + 1; j < game.enemies.length; j++) {
      const a = game.enemies[i], b = game.enemies[j];
      const d = distance(a, b);
      const min = a.r + b.r + 4;
      if (d > 0 && d < min) {
        const push = (min - d) / 2;
        const ang = angleTo(b, a);
        moveCircle(a, Math.cos(ang) * push, Math.sin(ang) * push);
        moveCircle(b, -Math.cos(ang) * push, -Math.sin(ang) * push);
      }
    }
  }
}

function updateShells(dt) {
  const p = game.player;
  for (let i = game.shells.length - 1; i >= 0; i--) {
    const s = game.shells[i];
    s.age += dt;
    s.life -= dt;
    const oldX = s.x, oldY = s.y;
    let bounced = false;
    let countedBounce = false;

    s.x += s.vx * dt;
    const edgeX = s.x - s.r < BORDER || s.x + s.r > W - BORDER;
    const wallX = walls.some(w => circleRect(s.x, s.y, s.r, w));
    if (edgeX || wallX) {
      s.x = oldX; s.vx *= -1; bounced = true;
      countedBounce ||= wallX || s.owner !== "enemy";
    }
    s.y += s.vy * dt;
    const edgeY = s.y - s.r < BORDER || s.y + s.r > H - BORDER;
    const wallY = walls.some(w => circleRect(s.x, s.y, s.r, w));
    if (edgeY || wallY) {
      s.y = oldY; s.vy *= -1; bounced = true;
      countedBounce ||= wallY || s.owner !== "enemy";
    }
    if (bounced) {
      if (countedBounce) s.bounces++;
      game.bounceCount++;
      sound("bounce");
      burst(s.x, s.y, colors.cream, 3);
      if (countedBounce && s.bounces > s.maxBounces) { game.shells.splice(i, 1); continue; }
    }

    // Collisions with tanks (armed after a short fuse so muzzle blasts are safe).
    let consumed = false;
    if (s.age > 0.09) {
      if (p.health > 0 && distance(s, p) < s.r + p.r) {
        damagePlayer(Math.atan2(s.vy, s.vx));
        consumed = true;
      }
      if (!consumed) {
        for (const e of game.enemies) {
          if (e.invincible > 0) continue;
          // Cats ignore their own fresh/direct shot, but can still be hit by
          // a long-returning interior-wall ricochet.
          if (e === s.source && (s.age < 1.25 || s.bounces === 0)) continue;
          if (distance(s, e) < s.r + e.r) {
            damageEnemy(e, s);
            consumed = true;
            break;
          }
        }
      }
    }
    if (consumed) { game.shells.splice(i, 1); continue; }
    if (s.life <= 0) game.shells.splice(i, 1);
  }
}

function damageEnemy(enemy, shell) {
  if (enemy.invincible > 0) return;
  const k = KINDS[enemy.kind];
  enemy.cloak = 0;
  enemy.cloakCd = random(4, 7);
  enemy.health--;
  enemy.hitFlash = .14;
  enemy.invincible = .22;
  shake = enemy.health <= 0 ? 9 : 5;
  freeze = .035;
  burst(enemy.x, enemy.y, k.light, enemy.health <= 0 ? 20 : 8);
  sound(enemy.health <= 0 ? "kill" : "hit");
  if (enemy.health <= 0) sound("meow", k.meowPitch * 0.78);

  if (shell) {
    const ang = Math.atan2(shell.vy, shell.vx);
    moveCircle(enemy, Math.cos(ang) * 10, Math.sin(ang) * 10);
  }

  if (enemy.health <= 0) {
    destroyEnemy(enemy);
  }
}

function destroyEnemy(enemy) {
  const idx = game.enemies.indexOf(enemy);
  if (idx === -1) return;
  game.enemies.splice(idx, 1);
  game.kills++;
  game.killsSinceYarn++;
  burst(enemy.x, enemy.y, colors.cat, 8);
  game.marks.push({ x: enemy.x, y: enemy.y, r: 15, alpha: .32 });

  if (game.killsSinceYarn >= 3 && game.player.specials < 3) {
    game.player.specials++;
    game.killsSinceYarn = 0;
    game.rings.push({ x: game.player.x, y: game.player.y, r: 18, life: .8, maxLife: .8, color: colors.acid });
    tone(720, .15, "sine", .025, 130);
  }
  updateHud();
}

function damagePlayer(angle) {
  const p = game.player;
  if (p.invincible > 0 || mode !== "playing") return;
  p.health = 0;
  game.deaths++;
  if (!unlimitedLives) game.lives--;
  mode = "respawning";
  mouse.down = false;
  touch.firing = false;
  shake = 18;
  freeze = .08;
  burst(p.x, p.y, colors.orange, 22);
  game.marks.push({ x: p.x, y: p.y, r: 13, alpha: .35 });
  moveCircle(p, -Math.cos(angle) * 24, -Math.sin(angle) * 24);
  sound("hurt");
  updateHud();
  for (let i = 0; i < 46; i++) {
    const a = random(0, TAU);
    const s = random(60, 360);
    addParticle(p.x, p.y, Math.cos(a) * s, Math.sin(a) * s, random(3, 10), i % 3 ? colors.orange : colors.tank, random(.5, 1.2), 160);
  }
  if (unlimitedLives || game.lives > 0) {
    setTimeout(replayCurrentLevel, 900);
  } else {
    setTimeout(() => endGame(false), 700);
  }
}

function replayCurrentLevel() {
  if (mode !== "respawning") return;
  const p = game.player;
  p.x = 120;
  p.y = 360;
  p.angle = 0;
  p.turret = 0;
  p.health = 1;
  p.cooldown = 0;
  p.invincible = 1.2;
  game.enemies = [];
  game.shells = [];
  game.yarn = [];
  game.kills = game.levelStartKills;
  game.waveClearTimer = 0;
  game.banner = null;
  mode = "playing";
  startWave(game.wave, true);
  game.banner = {
    text: unlimitedLives ? "TRY AGAIN" : `LIFE ${game.lives}`,
    sub: `REPLAYING LEVEL ${game.wave + 1}`,
    time: 1.9,
  };
}

function updateYarn(dt) {
  for (let i = game.yarn.length - 1; i >= 0; i--) {
    const y = game.yarn[i];
    y.life -= dt;

    const speed = Math.hypot(y.vx, y.vy);
    // Roll: angular speed ~ linear speed / radius, direction from travel.
    if (speed > 1) {
      y.dir = Math.atan2(y.vy, y.vx);
      y.spin += (y.vx >= 0 ? 1 : -1) * (speed / y.r) * dt;
    }

    // Move on each axis, bouncing off walls/borders like a real ball.
    const restitution = 0.55;
    y.x += y.vx * dt;
    if (y.x - y.r < BORDER || y.x + y.r > W - BORDER || walls.some(w => circleRect(y.x, y.y, y.r, w))) {
      y.x -= y.vx * dt;
      y.vx *= -restitution;
      if (speed > 40) sound("bounce");
    }
    y.y += y.vy * dt;
    if (y.y - y.r < BORDER || y.y + y.r > H - BORDER || walls.some(w => circleRect(y.x, y.y, y.r, w))) {
      y.y -= y.vy * dt;
      y.vy *= -restitution;
      if (speed > 40) sound("bounce");
    }

    // Rolling friction — glides, then eases to a stop.
    const fric = Math.max(0, 1 - 1.9 * dt);
    y.vx *= fric;
    y.vy *= fric;
    if (Math.hypot(y.vx, y.vy) < 14) { y.vx = 0; y.vy = 0; y.landed = true; }
    else y.landed = false;

    if (y.life <= 0) {
      burst(y.x, y.y, "#3f9ec2", 8);
      game.yarn.splice(i, 1);
    }
  }
}

function updateEffects(dt) {
  for (let i = game.particles.length - 1; i >= 0; i--) {
    const p = game.particles[i];
    p.life -= dt;
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= Math.pow(.12, dt);
    if (p.life <= 0) game.particles.splice(i, 1);
  }
  for (let i = game.rings.length - 1; i >= 0; i--) {
    const r = game.rings[i];
    r.life -= dt;
    r.r += dt * 130;
    if (r.life <= 0) game.rings.splice(i, 1);
  }
  for (const mark of game.marks) mark.alpha *= Math.pow(.35, dt);
  game.marks = game.marks.filter(m => m.alpha > .02);
  shake *= Math.pow(.012, dt);
}

function checkWaveProgress(dt) {
  if (game.enemies.length > 0) return;
  if (game.banner) return;
  game.waveClearTimer += dt;
  if (game.waveClearTimer < 1.3) return;
  game.waveClearTimer = 0;
  if (game.wave + 1 < WAVES.length) {
    startWave(game.wave + 1);
  } else if (mode === "playing") {
    endGame(true);
  }
}

// ---- rendering -------------------------------------------------------------

function draw() {
  ctx.save();
  if (shake > .2) ctx.translate(random(-shake, shake), random(-shake, shake));
  drawArena();
  if (game) {
    drawMarks();
    drawYarn();
    for (const e of game.enemies) drawEnemyTank(e);
    if (game.player.health > 0 || mode === "menu") drawPlayerTank(game.player);
    drawShells();
    drawEffects();
    drawBanner();
  } else {
    drawPlayerTank({ x: 150, y: 380, angle: -.1, turret: -.05, tread: 0, invincible: 0, flash: 0 });
    drawEnemyTank({ x: 1040, y: 250, angle: 2.4, turret: 3.3, tread: 0, kind: "chaser", blink: 0, hitFlash: 0, distract: 0, flash: 0, spawnT: 0, health: 1, maxHealth: 1, r: 20 });
    drawEnemyTank({ x: 1120, y: 520, angle: 1.4, turret: 3.9, tread: 0, kind: "dasher", blink: 0, hitFlash: 0, distract: 0, flash: 0, spawnT: 0, health: 1, maxHealth: 1, r: 18 });
    drawEnemyTank({ x: 760, y: 470, angle: 0.6, turret: 3.0, tread: 0, kind: "rook", blink: 0, hitFlash: 0, distract: 0, flash: 0, spawnT: 0, health: 2, maxHealth: 2, r: 24 });
  }
  ctx.restore();
}

function drawCloud(cx, cy, scale = 1) {
  ctx.save();
  ctx.fillStyle = colors.cloud;
  const s = scale;
  ctx.beginPath();
  ctx.arc(cx, cy, 22 * s, 0, TAU);
  ctx.arc(cx + 18 * s, cy - 4 * s, 16 * s, 0, TAU);
  ctx.arc(cx + 34 * s, cy, 18 * s, 0, TAU);
  ctx.arc(cx + 14 * s, cy + 6 * s, 14 * s, 0, TAU);
  ctx.fill();
  ctx.fillStyle = colors.cloudDark;
  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.arc(cx + 8 * s, cy + 4 * s, 10 * s, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawPastelWall(wall) {
  ctx.fillStyle = "rgba(168,152,204,.18)";
  roundedRect(wall.x + 3, wall.y + 4, wall.w, wall.h, 14); ctx.fill();
  ctx.fillStyle = colors.wall;
  roundedRect(wall.x, wall.y, wall.w, wall.h, 14); ctx.fill();
  ctx.strokeStyle = colors.wallLine;
  ctx.lineWidth = 2;
  roundedRect(wall.x + 1, wall.y + 1, wall.w - 2, wall.h - 2, 13); ctx.stroke();
  ctx.fillStyle = colors.wallTop;
  if (wall.w >= wall.h) {
    roundedRect(wall.x + 10, wall.y + 7, wall.w - 20, 7, 4); ctx.fill();
  } else {
    roundedRect(wall.x + 7, wall.y + 10, 7, wall.h - 20, 4); ctx.fill();
  }
  ctx.fillStyle = colors.wallDark;
  for (let i = 0; i < 3; i++) {
    const bx = wall.x + 14 + i * (wall.w > wall.h ? (wall.w - 28) / 2 : 0);
    const by = wall.y + 14 + i * (wall.h > wall.w ? (wall.h - 28) / 2 : 0);
    ctx.beginPath();
    ctx.ellipse(bx, by + (wall.w >= wall.h ? wall.h / 2 - 14 : 0), 5, 4, 0, 0, TAU);
    ctx.fill();
  }
}

function drawArena() {
  ctx.fillStyle = colors.sky;
  ctx.fillRect(0, 0, W, H);

  drawCloud(90, 52, 1.1);
  drawCloud(340, 38, 0.85);
  drawCloud(620, 58, 1);
  drawCloud(920, 44, 0.9);
  drawCloud(1140, 62, 0.75);

  const left = BORDER;
  const top = BORDER;
  const right = W - BORDER;
  const bottom = H - BORDER;
  const tile = 40;
  for (let y = top; y < bottom; y += tile) {
    for (let x = left; x < right; x += tile) {
      const checker = (Math.floor((x - left) / tile) + Math.floor((y - top) / tile)) % 2;
      ctx.fillStyle = checker ? colors.floorA : colors.floorB;
      ctx.fillRect(x, y, tile, tile);
    }
  }

  const accents = [
    [160, 200], [360, 440], [560, 160], [760, 560], [960, 320], [1080, 480],
  ];
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.45;
  for (const [ax, ay] of accents) {
    if (ax > left && ax < right - tile && ay > top && ay < bottom - tile) {
      ctx.strokeRect(ax, ay, tile, tile);
    }
  }
  ctx.globalAlpha = 1;

  ctx.strokeStyle = colors.wallLine;
  ctx.lineWidth = 3;
  roundedRect(left + 1, top + 1, right - left - 2, bottom - top - 2, 10);
  ctx.stroke();
  ctx.fillStyle = colors.cream;
  ctx.fillRect(left + 4, top + 4, right - left - 8, 5);
  ctx.fillRect(left + 4, top + 4, 5, bottom - top - 8);

  for (const wall of walls) drawPastelWall(wall);
}

function drawChassis(x, y, bodyAngle, treadPhase, pal, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bodyAngle);
  ctx.scale(scale, scale);
  ctx.fillStyle = "rgba(139,126,184,.15)";
  roundedRect(-20, -12, 40, 32, 8); ctx.fill();
  ctx.fillStyle = pal.dark;
  roundedRect(-23, -20, 46, 11, 5); ctx.fill();
  roundedRect(-23, 9, 46, 11, 5); ctx.fill();
  ctx.fillStyle = pal.light;
  for (let tx = -17; tx < 19; tx += 9) {
    const off = Math.sin(treadPhase + tx) * 2;
    roundedRect(tx + off - 2, -18, 5, 5, 2); ctx.fill();
    roundedRect(tx - off - 2, 13, 5, 5, 2); ctx.fill();
  }
  ctx.fillStyle = pal.hull;
  roundedRect(-18, -14, 36, 28, 8); ctx.fill();
  ctx.fillStyle = pal.light;
  roundedRect(-14, -10, 28, 6, 3); ctx.fill();
  ctx.restore();
}

function drawBarrel(x, y, turret, pal) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(turret);
  ctx.fillStyle = pal.dark;
  roundedRect(0, -3.5, 28, 7, 3); ctx.fill();
  ctx.fillStyle = pal.light;
  roundedRect(22, -2.5, 10, 5, 2); ctx.fill();
  ctx.restore();
}

function drawPlayerTank(p) {
  if (p.invincible > 0 && Math.floor(p.invincible * 12) % 2 === 0) return;
  const pal = { hull: colors.tank, light: colors.tankLight, dark: colors.tankDark };
  drawChassis(p.x, p.y, p.angle, p.tread, pal);
  drawBarrel(p.x, p.y, p.turret, { dark: colors.tankDark, light: colors.tankLight });

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = colors.tankDark;
  ctx.beginPath(); ctx.arc(0, 0, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = colors.tank;
  ctx.beginPath(); ctx.arc(0, 0, 10, 0, TAU); ctx.fill();
  ctx.fillStyle = colors.tankLight;
  ctx.beginPath(); ctx.arc(-3, -3, 3, 0, TAU); ctx.fill();
  ctx.restore();

  if (p.flash > 0) spawnFlash(p.x + Math.cos(p.turret) * 34, p.y + Math.sin(p.turret) * 34);
}

function drawEnemyTank(e) {
  const k = KINDS[e.kind];
  if (e.cloak > 0) {
    ctx.save();
    ctx.globalAlpha = 0.08 + Math.sin(performance.now() / 90) * 0.03;
    ctx.strokeStyle = colors.wallLine;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 7]);
    ctx.beginPath();
    ctx.ellipse(e.x, e.y + 4, e.r + 5, e.r - 5, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();
    return;
  }
  const pal = { hull: k.hull, light: k.light, dark: k.dark };
  const scale = e.kind === "rook" ? 1.18 : e.kind === "bruiser" ? 1.12 : e.kind === "dasher" ? 0.9 : 1;
  ctx.save();
  if (e.spawnT > 0) ctx.globalAlpha = clamp(1 - e.spawnT / 0.7, 0, 1) * 0.9 + 0.1;

  const flash = e.hitFlash > 0;
  const drawPal = flash
    ? { hull: colors.cream, light: colors.cream, dark: "#c9c7ac" }
    : pal;
  drawChassis(e.x, e.y, e.angle, e.tread, drawPal, scale);
  drawBarrel(e.x, e.y, e.turret, { dark: flash ? "#c9c7ac" : k.dark, light: flash ? colors.cream : k.light });

  // Extra armor plating on rook tanks.
  if (k.armored) {
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle);
    ctx.fillStyle = flash ? "#ddd8c0" : k.light;
    roundedRect(-16, -12, 10, 24, 3); ctx.fill();
    roundedRect(6, -12, 10, 24, 3); ctx.fill();
    ctx.fillStyle = flash ? "#c9c7ac" : k.dark;
    ctx.fillRect(-14, -8, 6, 4);
    ctx.fillRect(8, -8, 6, 4);
    ctx.restore();
  }

  // Cat driver popping out of the turret hatch.
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.fillStyle = flash ? "#c9c7ac" : k.dark;
  ctx.beginPath(); ctx.arc(0, 0, 12 + (scale - 1) * 8, 0, TAU); ctx.fill();
  drawRiderCat(e);
  ctx.restore();

  ctx.restore();

  // Health pips for multi-hit tanks.
  if ((e.maxHealth || 1) > 1) {
    const total = e.maxHealth;
    const hp = e.health ?? total;
    const start = e.x - (total * 7) / 2;
    for (let i = 0; i < total; i++) {
      ctx.fillStyle = i < hp ? colors.catNose : "rgba(139,126,184,.25)";
      roundedRect(start + i * 8, e.y - (e.r || 20) - 14, 6, 6, 3); ctx.fill();
    }
  }

  if (e.spawnT > 0) {
    ctx.strokeStyle = k.light;
    ctx.globalAlpha = clamp(e.spawnT / 0.7, 0, 1);
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, 22 + (0.7 - e.spawnT) * 40, 0, TAU); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (e.flash > 0) spawnFlash(e.x + Math.cos(e.turret) * 30, e.y + Math.sin(e.turret) * 30);
}

// Compact cute cat sitting in the hatch; fur/eye style varies by kind.
function drawRiderCat(e) {
  const happy = e.distract > 0.4;
  const face = Math.cos(e.turret) < 0 ? -1 : 1;
  const fur = KINDS[e.kind].fur;
  const p = catPalette(fur);
  ctx.save();
  ctx.scale(face * 0.62, 0.62);
  ctx.translate(0, -3);

  // Ears.
  ctx.fillStyle = p.ear;
  pixelPoly([[-16, -6], [-19, -27], [-4, -14]]); ctx.fill();
  pixelPoly([[16, -6], [19, -27], [4, -14]]); ctx.fill();
  ctx.fillStyle = p.earInner;
  pixelPoly([[-14, -9], [-15, -22], [-7, -14]]); ctx.fill();
  pixelPoly([[14, -9], [15, -22], [7, -14]]); ctx.fill();

  // Head.
  ctx.fillStyle = p.body;
  roundedRect(-18, -13, 36, 30, 13); ctx.fill();

  if (fur === "tabby") {
    // Forehead "M" tabby stripes + cheek stripes.
    ctx.fillStyle = p.shade;
    ctx.fillRect(-1, -13, 2, 8);
    ctx.fillRect(-6, -12, 2, 6);
    ctx.fillRect(4, -12, 2, 6);
    ctx.fillRect(-17, 2, 6, 2);
    ctx.fillRect(-17, 6, 6, 2);
    ctx.fillRect(11, 2, 6, 2);
    ctx.fillRect(11, 6, 6, 2);
    // Sunglasses.
    ctx.fillStyle = "#16191d";
    roundedRect(-14, -5, 12, 9, 3); ctx.fill();
    roundedRect(2, -5, 12, 9, 3); ctx.fill();
    ctx.fillRect(-2, -2, 4, 2);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    ctx.fillRect(-12, -4, 3, 2);
    ctx.fillRect(4, -4, 3, 2);
    ctx.fillStyle = colors.catNose;
    pixelPoly([[-3, 8], [3, 8], [0, 12]]); ctx.fill();
  } else if (fur === "blue") {
    // Standard blue-gray cat with forehead stripes and round eyes.
    ctx.fillStyle = p.shade;
    ctx.fillRect(-1, -13, 2, 7);
    ctx.fillRect(-7, -11, 2, 5);
    ctx.fillRect(5, -11, 2, 5);
    if (e.blink > 0 || happy) {
      ctx.strokeStyle = p.eye;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(-7, 1, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(7, 1, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.fillStyle = p.eye;
      roundedRect(-11, -5, 8, 10, 4); ctx.fill();
      roundedRect(3, -5, 8, 10, 4); ctx.fill();
      ctx.fillStyle = "#24323a";
      ctx.fillRect(-8, -2, 3, 6);
      ctx.fillRect(5, -2, 3, 6);
    }
    ctx.fillStyle = colors.catNose;
    pixelPoly([[-3, 8], [3, 8], [0, 12]]); ctx.fill();
  } else if (fur === "void") {
    // Sleek black cat with pale slit eyes.
    if (e.blink > 0 || happy) {
      ctx.strokeStyle = p.eye;
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(-7, 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(7, 2, 4, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      ctx.fillStyle = p.eye;
      roundedRect(-11, -1, 8, 4, 2); ctx.fill();
      roundedRect(3, -1, 8, 4, 2); ctx.fill();
    }
    ctx.fillStyle = "#3a2a2e";
    ctx.fillRect(-1, 7, 2, 2);
  } else {
    // Calico: white base with orange + charcoal patches, cute round eyes.
    ctx.fillStyle = "#ffd888";
    roundedRect(-18, -13, 13, 15, 8); ctx.fill();
    ctx.fillStyle = "#c8b8e8";
    roundedRect(6, -4, 12, 16, 7); ctx.fill();
    if (e.blink > 0 || happy) {
      ctx.strokeStyle = p.eye;
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.beginPath(); ctx.arc(-7, 1, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
      ctx.beginPath(); ctx.arc(7, 1, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
    } else {
      ctx.fillStyle = p.eye;
      roundedRect(-11, -5, 8, 11, 4); ctx.fill();
      roundedRect(3, -5, 8, 11, 4); ctx.fill();
      ctx.fillStyle = "#2a2410";
      roundedRect(-8, -2, 3, 7, 1.5); ctx.fill();
      roundedRect(5, -2, 3, 7, 1.5); ctx.fill();
      ctx.fillStyle = colors.catEyeShine;
      ctx.fillRect(-10, -3, 2, 2);
      ctx.fillRect(4, -3, 2, 2);
    }
    ctx.fillStyle = colors.catNose;
    pixelPoly([[-3, 8], [3, 8], [0, 12]]); ctx.fill();
  }
  ctx.restore();

  if (happy) {
    const hy = -30 + Math.sin(performance.now() / 220) * 3;
    drawHeart(14, hy, 6, "#e86a86");
  }
}

function catPalette(fur) {
  if (fur === "tabby") {
    return { body: "#ffeaa8", shade: "#f5c878", ear: "#ffd888", earInner: "#ffb8c8", eye: colors.ink };
  }
  if (fur === "calico") {
    return { body: "#ffe8f0", shade: "#ffd4e0", ear: "#ffb8c8", earInner: "#ffd4e0", eye: colors.catEye };
  }
  if (fur === "blue") {
    return { body: "#a8c8d8", shade: "#8bb0c4", ear: "#a8c8d8", earInner: "#ffb8c8", eye: "#fff8e8" };
  }
  return { body: "#8b9aac", shade: "#6b7a8f", ear: "#8b9aac", earInner: "#c4ced8", eye: "#fff8e8" };
}

function spawnFlash(x, y) {
  ctx.save();
  ctx.globalAlpha = .8;
  ctx.fillStyle = colors.cream;
  ctx.beginPath(); ctx.arc(x, y, 6, 0, TAU); ctx.fill();
  ctx.restore();
}

function pixelPoly(points) {
  ctx.beginPath();
  points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
  ctx.closePath();
}

function drawHeart(x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.3, y - s * 0.2, x - s * 0.5, y - s * 1.1, x, y - s * 0.35);
  ctx.bezierCurveTo(x + s * 0.5, y - s * 1.1, x + s * 1.3, y - s * 0.2, x, y + s * 0.9);
  ctx.closePath();
  ctx.fill();
}

function roundedRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function drawShells() {
  for (const s of game.shells) {
    if (s.type === "rocket") {
      const angle = Math.atan2(s.vy, s.vx);
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.rotate(angle);
      ctx.fillStyle = "rgba(255,184,140,.35)";
      pixelPoly([[-8, 0], [-28, -7], [-20, 0], [-28, 7]]); ctx.fill();
      ctx.fillStyle = colors.peach;
      roundedRect(-7, -5, 16, 10, 5); ctx.fill();
      ctx.fillStyle = colors.cream;
      pixelPoly([[9, -5], [16, 0], [9, 5]]); ctx.fill();
      ctx.fillStyle = colors.orange;
      ctx.beginPath(); ctx.arc(-2, 0, 3, 0, TAU); ctx.fill();
      ctx.restore();
      continue;
    }
    const isPlayer = s.owner === "player";
    const core = isPlayer ? colors.shellPlayer : colors.shellFoe;
    const outline = isPlayer ? "#e8a878" : "#e8c090";
    const shine = colors.cream;

    ctx.fillStyle = "rgba(255,213,168,.25)";
    ctx.beginPath(); ctx.arc(s.x - s.vx * .018, s.y - s.vy * .018, s.r + 2, 0, TAU); ctx.fill();
    ctx.fillStyle = outline;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r + 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = core;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    ctx.fillStyle = shine;
    ctx.beginPath(); ctx.arc(s.x - s.r * .25, s.y - s.r * .25, Math.max(1.5, s.r * .3), 0, TAU); ctx.fill();
  }
}

function drawYarn() {
  for (const y of game.yarn) {
    ctx.fillStyle = "rgba(139,126,184,.14)";
    ctx.beginPath(); ctx.ellipse(y.x, y.y + y.r * 0.85, y.r * 1.05, y.r * 0.42, 0, 0, TAU); ctx.fill();

    const dir = (y.dir ?? 0) + Math.PI;
    const ex = y.x + Math.cos(dir) * (y.r - 1);
    const ey = y.y + Math.sin(dir) * (y.r - 1);
    const nx = Math.cos(dir + Math.PI / 2), ny = Math.sin(dir + Math.PI / 2);
    ctx.strokeStyle = colors.wallLine;
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex + Math.cos(dir) * 8 + nx * 5, ey + Math.sin(dir) * 8 + ny * 5);
    ctx.lineTo(ex + Math.cos(dir) * 16 - nx * 4, ey + Math.sin(dir) * 16 - ny * 4);
    ctx.stroke();

    ctx.save();
    ctx.translate(y.x, y.y);
    ctx.rotate(y.spin);

    ctx.fillStyle = colors.wallLine;
    ctx.beginPath(); ctx.arc(0, 0, y.r + 1.5, 0, TAU); ctx.fill();
    ctx.fillStyle = "#a8d8f0";
    ctx.beginPath(); ctx.arc(0, 0, y.r, 0, TAU); ctx.fill();

    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, y.r, 0, TAU); ctx.clip();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#7bb8d8";
    for (let o = -y.r - 6; o <= y.r + 6; o += 4) {
      ctx.beginPath(); ctx.moveTo(o, -y.r - 2); ctx.lineTo(o + y.r, y.r + 2); ctx.stroke();
    }
    ctx.strokeStyle = "#b8dcf0";
    for (let o = -y.r - 6; o <= y.r + 6; o += 4) {
      ctx.beginPath(); ctx.moveTo(o, y.r + 2); ctx.lineTo(o + y.r, -y.r - 2); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();

    if (y.landed) {
      ctx.strokeStyle = "rgba(168,216,240,.55)";
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(y.x, y.y, 16 + Math.sin(performance.now() / 120) * 4, 0, TAU); ctx.stroke();
    }
  }
}

function drawEffects() {
  for (const p of game.particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.55, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const r of game.rings) {
    const t = 1 - r.life / r.maxLife;
    ctx.globalAlpha = Math.max(0, r.life / r.maxLife) * 0.7;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.puff ? 3 : 2;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r + t * (r.puff ? 22 : 16), 0, TAU);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawMarks() {
  for (const m of game.marks) {
    ctx.globalAlpha = m.alpha;
    ctx.fillStyle = colors.wallDark;
    ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawBanner() {
  if (!game.banner) return;
  const b = game.banner;
  const fade = clamp(b.time, 0, 1) * clamp(1.9 - b.time, 0, 1);
  ctx.save();
  ctx.globalAlpha = clamp(fade + 0.15, 0, 1);
  ctx.textAlign = "center";
  ctx.fillStyle = colors.orange;
  ctx.font = "700 52px Silkscreen";
  ctx.fillText(b.text, W / 2, H / 2 - 6);
  ctx.fillStyle = colors.ink;
  ctx.font = "400 14px DM Mono";
  ctx.fillText(b.sub, W / 2, H / 2 + 26);
  ctx.restore();
  ctx.textAlign = "start";
}

// ---- loop + input ----------------------------------------------------------

function frame(now) {
  const rawDt = Math.min(.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  if (freeze > 0) freeze -= rawDt;
  else update(rawDt);
  draw();
  requestAnimationFrame(frame);
}

function canvasPosition(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (W / rect.width),
    y: (event.clientY - rect.top) * (H / rect.height),
  };
}

function setTouchControlsVisible(visible) {
  const show = visible && wantsTouchUi() && (mode === "playing" || mode === "paused" || mode === "respawning");
  ui.touchControls.classList.toggle("hidden", !show);
  ui.touchControls.setAttribute("aria-hidden", String(!show));
  ui.touchControls.classList.toggle("is-paused", mode === "paused");
  touch.using = show && mode !== "paused";
  if (!show || mode === "paused") {
    touch.mx = 0;
    touch.my = 0;
    touch.firing = false;
    touch.pointerId = null;
    resetStickKnob();
    ui.fireTouch.classList.remove("pressed");
  }
  syncPauseButton();
  updateHud();
}

function syncPauseButton() {
  const paused = mode === "paused";
  ui.pauseTouch.setAttribute("aria-pressed", String(paused));
  const label = ui.pauseTouch.querySelector(".touch-btn-label");
  if (label) label.textContent = paused ? "▶" : "II";
  else ui.pauseTouch.textContent = paused ? "▶" : "II";
}

function togglePause() {
  if (mode === "playing") {
    mode = "paused";
    mouse.down = false;
    touch.firing = false;
    ui.fireTouch.classList.remove("pressed");
    ui.pause.classList.remove("hidden");
  } else if (mode === "paused") {
    mode = "playing";
    ui.pause.classList.add("hidden");
  }
  setTouchControlsVisible(mode === "playing" || mode === "paused" || mode === "respawning");
  syncPauseButton();
}

function toggleUnlimitedLives() {
  unlimitedLives = !unlimitedLives;
  updateHud();
  ensureAudio();
  tone(unlimitedLives ? 660 : 330, .1, "sine", .025, unlimitedLives ? 120 : -80);
}

function toggleSound() {
  muted = !muted;
  if (muted) meowVoices.forEach(voice => voice.pause());
  ui.soundButton.classList.toggle("muted", muted);
  ui.soundButton.querySelector("span").textContent = muted ? "×" : "♪";
  updateHud();
  if (!muted) { ensureAudio(); tone(440, .08); }
}

function resetStickKnob() {
  ui.moveKnob.style.transform = "translate(0px, 0px)";
  ui.moveStick.classList.remove("active");
}

function updateStickFromPoint(clientX, clientY) {
  const rect = ui.moveStick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const max = rect.width * 0.34;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const dist = Math.hypot(dx, dy) || 1;
  if (dist > max) {
    dx = (dx / dist) * max;
    dy = (dy / dist) * max;
  }
  touch.mx = dx / max;
  touch.my = dy / max;
  ui.moveKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  ui.moveStick.classList.add("active");
}

function bindStick() {
  const stick = ui.moveStick;
  stick.addEventListener("pointerdown", event => {
    if (mode !== "playing" && mode !== "paused") return;
    if (mode === "paused") return;
    event.preventDefault();
    stick.setPointerCapture(event.pointerId);
    touch.pointerId = event.pointerId;
    touch.using = true;
    updateStickFromPoint(event.clientX, event.clientY);
  });
  stick.addEventListener("pointermove", event => {
    if (touch.pointerId !== event.pointerId) return;
    event.preventDefault();
    updateStickFromPoint(event.clientX, event.clientY);
  });
  const endStick = event => {
    if (touch.pointerId !== null && event.pointerId !== touch.pointerId) return;
    touch.pointerId = null;
    touch.mx = 0;
    touch.my = 0;
    resetStickKnob();
  };
  stick.addEventListener("pointerup", endStick);
  stick.addEventListener("pointercancel", endStick);
}

function bindTouchButtons() {
  const hold = (el, on, off) => {
    const start = event => {
      event.preventDefault();
      el.classList.add("pressed");
      on(event);
    };
    const end = event => {
      el.classList.remove("pressed");
      off?.(event);
    };
    el.addEventListener("pointerdown", start);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("pointerleave", end);
  };

  hold(ui.fireTouch, () => {
    if (mode !== "playing") return;
    touch.using = true;
    touch.firing = true;
    ensureAudio();
    shoot();
  }, () => { touch.firing = false; });

  ui.yarnTouch.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (mode !== "playing") return;
    touch.using = true;
    ensureAudio();
    shootYarn();
    ui.yarnTouch.classList.add("pressed");
  });
  ui.yarnTouch.addEventListener("pointerup", () => ui.yarnTouch.classList.remove("pressed"));
  ui.yarnTouch.addEventListener("pointercancel", () => ui.yarnTouch.classList.remove("pressed"));

  ui.pauseTouch.addEventListener("pointerdown", event => {
    event.preventDefault();
    if (mode === "playing" || mode === "paused") {
      ensureAudio();
      togglePause();
    }
  });
}

window.addEventListener("keydown", event => {
  if (event.target === ui.nameInput) return;
  keys.add(event.code);
  if (["Space", "ArrowUp", "ArrowDown"].includes(event.code)) event.preventDefault();
  if (event.code === "Enter" && mode === "menu") startGame();
  if (event.code === "KeyR" && (mode === "won" || mode === "lost") && document.activeElement !== ui.nameInput) {
    startGame();
  }
  if (event.code === "Space" && mode === "playing") shootYarn();
  if (event.code === "KeyP" && (mode === "playing" || mode === "paused")) togglePause();
});
window.addEventListener("keyup", event => keys.delete(event.code));
window.addEventListener("blur", () => {
  keys.clear();
  mouse.down = false;
  touch.firing = false;
  touch.mx = 0;
  touch.my = 0;
  resetStickKnob();
  if (mode === "playing") {
    mode = "paused";
    ui.pause.classList.remove("hidden");
    syncPauseButton();
  }
});
canvas.addEventListener("mousemove", event => {
  if (touch.using && wantsTouchUi()) return;
  Object.assign(mouse, canvasPosition(event));
});
canvas.addEventListener("mousedown", event => {
  if (event.button === 0) { mouse.down = true; ensureAudio(); }
  if (event.button === 2 && mode === "playing") shootYarn();
});
window.addEventListener("mouseup", event => { if (event.button === 0) mouse.down = false; });
canvas.addEventListener("contextmenu", event => event.preventDefault());

// Block multi-touch scroll/zoom on the game frame while playing.
document.querySelector(".game-frame").addEventListener("touchmove", event => {
  if (mode === "playing" || mode === "paused") event.preventDefault();
}, { passive: false });

ui.startButton.addEventListener("click", startGame);
ui.restartButton.addEventListener("click", startGame);
ui.livesButton.addEventListener("click", toggleUnlimitedLives);
ui.soundButton.addEventListener("click", toggleSound);
if (ui.pauseLivesBtn) ui.pauseLivesBtn.addEventListener("click", toggleUnlimitedLives);
if (ui.pauseSoundBtn) ui.pauseSoundBtn.addEventListener("click", () => {
  toggleSound();
  ensureAudio();
});
if (ui.resumeTouch) ui.resumeTouch.addEventListener("click", () => {
  if (mode === "paused") togglePause();
});

ui.nameInput.addEventListener("input", () => {
  const caret = ui.nameInput.selectionStart;
  ui.nameInput.value = ui.nameInput.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
  ui.nameInput.setSelectionRange(caret, caret);
});
ui.nameInput.addEventListener("keydown", event => {
  if (event.code === "Enter") {
    event.preventDefault();
    submitPendingScore();
  }
  event.stopPropagation();
});
ui.submitScore.addEventListener("click", submitPendingScore);

bindStick();
bindTouchButtons();
renderLeaderboard();
window.addEventListener("resize", () => {
  if (mode === "playing" || mode === "paused" || mode === "respawning") setTouchControlsVisible(true);
});

resetGame();
mode = "menu";
setTouchControlsVisible(false);
requestAnimationFrame(frame);
