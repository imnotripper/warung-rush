// main.js — boot, game loop, input, and the interaction rules.
// One clear job: run the game. It owns the state; the other files own pieces.

import { INGREDIENTS, RECIPES, recipeFor, recipeCanStillMatch, recipeById, prepResult, prepStationFor } from './recipes.js';
import { stationNear, stationById } from './kitchen.js';
import { OrderQueue } from './orders.js';
import { Chef } from './chef.js';
import { AudioSys } from './audio.js';
import { drawGame, VIEW_W, VIEW_H } from './render.js';
import { applyShot, mulberry32 } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

const state = {
  mode: 'title',
  frozen: false,
  time: 0,
  shiftLeft: 180,
  shiftLength: 180,
  score: 0,
  combo: 0,
  bestCombo: 0,
  served: 0,
  failed: 0,
  queue: new OrderQueue(),
  chef: new Chef(),
  assembly: [],
  assemblyDish: null,
  job: null, // { stationId, label, progress, duration, item, stationKind }
  nearStation: null,
  popup: null,
  servedFlash: null,
  audio: new AudioSys(),
  rng: mulberry32(seed),
};

function resize() {
  const scale = Math.min(window.innerWidth / VIEW_W, window.innerHeight / VIEW_H);
  canvas.width = Math.round(VIEW_W * scale * window.devicePixelRatio);
  canvas.height = Math.round(VIEW_H * scale * window.devicePixelRatio);
  canvas.style.width = Math.round(VIEW_W * scale) + 'px';
  canvas.style.height = Math.round(VIEW_H * scale) + 'px';
  ctx.setTransform(canvas.width / VIEW_W, 0, 0, canvas.height / VIEW_H, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function showPopup(text, color = '#fde68a', seconds = 2.2) {
  state.popup = { text, color, t: seconds };
}

function resetGame() {
  state.mode = 'play';
  state.time = 0;
  state.shiftLeft = state.shiftLength;
  state.score = 0;
  state.combo = 0;
  state.bestCombo = 0;
  state.served = 0;
  state.failed = 0;
  state.queue.reset();
  state.chef.reset();
  state.assembly = [];
  state.assemblyDish = null;
  state.job = null;
  state.popup = null;
  state.servedFlash = null;
  state.rng = mulberry32((Math.random() * 1e9) | 0);
  state.queue.spawn(state.rng);
  state.audio.start();
}

function cancelJob(silent) {
  if (state.job) {
    state.audio.sizzleStop();
    if (!silent) showPopup('Kerjaan batal — jangan pergi dulu!', '#fca5a5', 1.4);
  }
  state.job = null;
}

// The one interaction: E / Space / click on a station, or click-to-move.
function interact() {
  if (state.mode !== 'play') return;
  const chef = state.chef;
  const st = stationNear(chef.x, chef.y);
  if (!st) return;
  state.audio.ensure();

  if (st.kind === 'crate') {
    if (chef.carry) { showPopup('Tangan penuh — antar dulu bahannya!', '#fca5a5', 1.4); return; }
    const def = INGREDIENTS[st.ing];
    chef.carry = { ing: st.ing, stage: def.prep === 'none' ? 'ready' : 'raw' };
    state.audio.pickup();
    showPopup(def.name + ' diambil', '#e7e5e4', 1.2);
    return;
  }

  if (st.kind === 'assembly') {
    if (state.assemblyDish) {
      if (chef.carry) { showPopup('Tangan penuh!', '#fca5a5', 1.2); return; }
      chef.carry = { dish: true, recipeId: state.assemblyDish.recipeId };
      state.assemblyDish = null;
      state.audio.pickup();
      showPopup(recipeById(chef.carry.recipeId).name + ' di tangan — antar ke jendela!', '#4ade80', 1.6);
      return;
    }
    const item = chef.carryingIngredient();
    if (!item) { showPopup('Bawa bahan siap ke meja racik', '#e7e5e4', 1.4); return; }
    if (item.stage !== 'ready') {
      const need = prepStationFor(item);
      const where = { board: 'talenan', wok: 'wok', stove: 'panggangan', drink: 'teko teh' }[need] || 'dapur';
      showPopup(INGREDIENTS[item.ing].name + ' belum siap — olah di ' + where + ' dulu', '#fca5a5', 1.8);
      return;
    }
    if (state.assembly.includes(item.ing)) { showPopup('Sudah ada ' + INGREDIENTS[item.ing].name + ' di racikan', '#fca5a5', 1.4); return; }
    state.assembly.push(item.ing);
    chef.carry = null;
    state.audio.place();
    const recipe = recipeFor(state.assembly);
    if (recipe) {
      state.assemblyDish = { dish: true, recipeId: recipe.id };
      state.assembly = [];
      state.audio.ding();
      showPopup(recipe.name + ' jadi! Antar ke Jendela Saji', '#4ade80', 2);
    } else if (!recipeCanStillMatch(state.assembly)) {
      state.assembly = [];
      state.score = Math.max(0, state.score - 30);
      state.combo = 0;
      state.audio.fail();
      showPopup('Racikan salah! Bukan resep apa pun. -30', '#fca5a5', 2);
    }
    return;
  }

  if (st.kind === 'serve') {
    const dish = chef.carryingDish();
    if (!dish) { showPopup('Bawa piring jadi ke sini', '#e7e5e4', 1.4); return; }
    const order = state.queue.findForRecipe(dish.recipeId);
    if (!order) {
      state.score = Math.max(0, state.score - 50);
      state.combo = 0;
      state.failed += 1;
      chef.carry = null;
      state.audio.fail();
      showPopup('Tidak ada yang pesan ' + recipeById(dish.recipeId).name + '! -50', '#fca5a5', 2);
      return;
    }
    const timeBonus = Math.round(60 * (order.tLeft / order.tMax));
    state.combo += 1;
    state.bestCombo = Math.max(state.bestCombo, state.combo);
    const mult = 1 + 0.25 * (state.combo - 1);
    const gained = Math.round((recipeById(dish.recipeId).base + timeBonus) * mult);
    state.score += gained;
    state.served += 1;
    state.queue.remove(order);
    chef.carry = null;
    state.servedFlash = { t: 2.5 };
    state.audio.serve();
    showPopup('PESANAN SELESA! +' + gained + (state.combo > 1 ? '  •  KOMBO x' + state.combo : ''), '#4ade80', 2.2);
    return;
  }

  // Prep stations: board / wok / stove / drink. Start a timed job.
  const item = chef.carryingIngredient();
  if (!item) { showPopup('Bawa bahan mentah ke sini dulu', '#e7e5e4', 1.4); return; }
  if (state.job) return; // already working
  const result = prepResult(item.ing, st.kind);
  if (result === null || item.stage === 'ready') {
    const want = prepStationFor(item);
    const where = { board: 'talenan', wok: 'wok', stove: 'panggangan', drink: 'teko teh' }[want];
    showPopup(where ? INGREDIENTS[item.ing].name + ' olahnya di ' + where : INGREDIENTS[item.ing].name + ' sudah siap — rakit di Meja Racik', '#fca5a5', 1.8);
    return;
  }
  const def = INGREDIENTS[item.ing];
  const label = st.kind === 'board' ? 'Memotong ' + def.name
    : st.kind === 'wok' ? 'Memasak ' + def.name
    : st.kind === 'stove' ? 'Memanggang ' + def.name
    : 'Menyeduh ' + def.name;
  state.job = { stationId: st.id, stationKind: st.kind, label, progress: 0, duration: def.prepTime, item };
  if (st.kind === 'wok' || st.kind === 'stove') state.audio.sizzleStart();
  if (st.kind === 'board') state.audio.chop();
}

function update(dt) {
  if (state.mode !== 'play' || state.frozen) return;
  state.time += dt;
  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.mode = 'over';
    cancelJob(true);
    state.audio.sizzleStop();
    return;
  }
  const keys = input.keys;
  state.chef.update(dt, keys);
  state.nearStation = stationNear(state.chef.x, state.chef.y);

  // Walking away cancels an in-progress job.
  if (state.job) {
    const st = stationById(state.job.stationId);
    const near = st && stationNear(state.chef.x, state.chef.y) === st;
    if (!near) { cancelJob(false); }
  }
  if (state.job) {
    const job = state.job;
    job.progress += dt;
    if (job.stationKind === 'board' && Math.floor(job.progress * 4) !== Math.floor((job.progress - dt) * 4)) state.audio.chop();
    if (job.progress >= job.duration) {
      const result = prepResult(job.item.ing, job.stationKind);
      state.chef.carry = { ing: job.item.ing, stage: result };
      state.audio.sizzleStop();
      state.audio.ding();
      showPopup(INGREDIENTS[job.item.ing].name + ' siap!', '#4ade80', 1.4);
      state.job = null;
    }
  }

  const expired = state.queue.update(dt, state.rng);
  for (const o of expired) {
    state.combo = 0;
    state.failed += 1;
    state.score = Math.max(0, state.score - 20);
    state.audio.fail();
    showPopup('Pesanan ' + recipeById(o.recipeId).name + ' hangus! -20', '#fca5a5', 2);
  }
  if (state.popup) {
    state.popup.t -= dt;
    if (state.popup.t <= 0) state.popup = null;
  }
  if (state.servedFlash) {
    state.servedFlash.t -= dt;
    if (state.servedFlash.t <= 0) state.servedFlash = null;
  }
}

// ---- Input: keyboard + mouse ----
const input = { keys: { up: false, down: false, left: false, right: false } };
const KEYMAP = { ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right' };
window.addEventListener('keydown', (e) => {
  if (KEYMAP[e.code]) { input.keys[KEYMAP[e.code]] = true; e.preventDefault(); }
  if (e.code === 'KeyE' || e.code === 'Space') { interact(); e.preventDefault(); }
  if (e.code === 'Enter' && state.mode === 'title') resetGame();
  if (e.code === 'KeyR' && state.mode === 'over') resetGame();
  if (e.code === 'KeyM') { state.audio.muted = !state.audio.muted; if (state.audio.muted) state.audio.sizzleStop(); }
});
window.addEventListener('keyup', (e) => {
  if (KEYMAP[e.code]) input.keys[KEYMAP[e.code]] = false;
});
canvas.addEventListener('pointerdown', (e) => {
  state.audio.ensure();
  if (state.mode === 'title') { resetGame(); return; }
  if (state.mode === 'over') { resetGame(); return; }
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * VIEW_W;
  const y = ((e.clientY - rect.top) / rect.height) * VIEW_H;
  // Clicking a station the chef already stands at uses it; any other click
  // is a walk-to order (even a click on a far station).
  const st = stationNear(x, y, 130);
  if (st && stationNear(state.chef.x, state.chef.y) === st) { interact(); return; }
  state.chef.setTarget(x, y);
});

// ---- Main loop ----
let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  state.nearStation = state.mode === 'play' ? stationNear(state.chef.x, state.chef.y) : null;
  drawGame(ctx, state, now);
  requestAnimationFrame(frame);
}

if (shotName) {
  resetGame();
  applyShot(state, shotName, seed);
  drawGame(ctx, state, 0);
} else {
  drawGame(ctx, state, 0);
}
requestAnimationFrame(frame);
