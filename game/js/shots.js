// shots.js — deterministic staged scenes for screenshots (?shot=<name>&seed=N).
// One clear job: put the game into a fixed, readable state for each shot.
// Scenes never run timers (state.frozen), so every render is identical.

import { recipeById } from './recipes.js';

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function order(id, recipeId, tLeft, tMax) {
  return { id, recipeId, tLeft, tMax };
}

// state is the live game state built by main.js; shots only set fields.
export function applyShot(state, name, seed) {
  const rng = mulberry32(seed || 1);
  void rng;
  void recipeById;
  state.mode = 'play';
  state.frozen = true;
  state.shiftLeft = 150;
  state.score = 480;
  state.combo = 2;
  state.bestCombo = 3;
  state.served = 4;
  state.failed = 0;
  state.popup = null;
  state.job = null;
  state.assembly = [];
  state.assemblyDish = null;
  state.servedFlash = null;

  const chef = state.chef;
  chef.carry = null;

  if (name === 'kitchen') {
    // COVER: kitchen + order board (3 orders) + ingredients on counters +
    // dish mid-assembly + timer + plate ready to serve, all at once.
    state.queue.orders = [
      order(1, 'nasi-goreng', 45, 62),
      order(2, 'mie-ayam', 38, 62),
      order(3, 'es-teh', 50, 62),
    ];
    state.queue.elapsed = 30;
    chef.x = 700; chef.y = 560; chef.tx = 700; chef.ty = 560;
    chef.carry = { ing: 'sambal', stage: 'ready' };
    state.assembly = ['nasi', 'telur'];
    state.assemblyDish = { dish: true, recipeId: 'sate-ayam' };
    // The ready plate sits on the serving window via servedFlash marker.
    state.servedFlash = { t: 99 };
    state.popup = { text: 'Sate Ayam siap diantar!', color: '#4ade80', t: 99 };
  } else if (name === 'chopping') {
    state.queue.orders = [
      order(1, 'mie-ayam', 41, 62),
      order(2, 'sate-ayam', 30, 62),
    ];
    state.queue.elapsed = 55;
    chef.x = 520; chef.y = 445; chef.tx = 520; chef.ty = 445;
    chef.carry = null;
    state.job = { stationId: 'board', label: 'Memotong ayam', progress: 1.2, duration: 2.0 };
    state.assembly = ['mie'];
    state.popup = { text: 'Potong ayamnya...', color: '#fde68a', t: 99 };
  } else if (name === 'rush') {
    state.queue.orders = [
      order(1, 'nasi-goreng', 8, 52),
      order(2, 'mie-ayam', 24, 52),
      order(3, 'sate-ayam', 33, 52),
    ];
    state.queue.elapsed = 95;
    state.score = 860;
    state.combo = 3;
    state.bestCombo = 4;
    state.served = 7;
    chef.x = 1075; chef.y = 265; chef.tx = 1075; chef.ty = 265;
    chef.carry = { dish: true, recipeId: 'nasi-goreng' };
    state.popup = { text: 'BURUAN! Nasi Goreng 8 detik lagi!', color: '#fca5a5', t: 99 };
  } else if (name === 'served') {
    state.queue.orders = [
      order(1, 'mie-ayam', 36, 52),
      order(2, 'es-teh', 44, 52),
    ];
    state.queue.elapsed = 110;
    state.score = 1240;
    state.combo = 4;
    state.bestCombo = 4;
    state.served = 9;
    chef.x = 950; chef.y = 470; chef.tx = 950; chef.ty = 470;
    chef.carry = null;
    state.servedFlash = { t: 99 };
    state.popup = { text: 'PESANAN SELESA! +180  •  KOMBO x4', color: '#4ade80', t: 99 };
  } else {
    // Unknown shot: plain mid-game scene.
    state.queue.orders = [order(1, 'nasi-goreng', 40, 62)];
    chef.x = 640; chef.y = 620; chef.tx = 640; chef.ty = 620;
  }
  state.nearStation = null;
}
